from __future__ import annotations

import os
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Iterable

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Sum
from django.utils.dateparse import parse_date

from organization.models import Business, Branch
from positions.models import Position
from employees.models import Employee
from timekeeping.models import TimeLog, Holiday
from payroll.models import (
    PayrollCycle,
    PayrollPolicy,
    SalaryComponent,
    SalaryStructure,
    PayrollRecord,
)
from payroll.services.payroll_cycles import get_dynamic_cutoff
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle


# ---------------- helpers ----------------

def normalize_month(value: str | date) -> date:
    if isinstance(value, date):
        return value.replace(day=1)
    d = parse_date(value)
    if d:
        return d.replace(day=1)
    try:
        y, m = [int(x) for x in str(value).split("-")[:2]]
        return date(y, m, 1)
    except Exception:
        raise CommandError("Invalid month format. Use YYYY-MM or YYYY-MM-DD")

def q2(x: Decimal) -> Decimal:
    return Decimal(x).quantize(Decimal("0.01"))

def ensure_components() -> dict[str, SalaryComponent]:
    """Create or fetch all required components and return a code->component map."""
    specs = [
        ("BASIC", "EARNING"),
        ("OT", "EARNING"),
        ("LATE", "DEDUCTION"),
        ("UNDERTIME", "DEDUCTION"),
        ("ABSENT", "DEDUCTION"),
        ("HOLIDAY_REGULAR", "EARNING"),
        ("HOLIDAY_SPECIAL", "EARNING"),
        # PH mandatories (employee side)
        ("SSS_EE", "DEDUCTION"),
        ("PHIC_EE", "DEDUCTION"),
        ("HDMF_EE", "DEDUCTION"),
        ("TAX_WHT", "DEDUCTION"),
        # 13th month (earning)
        ("13TH", "EARNING"),
    ]
    out = {}
    for code, ctype in specs:
        comp, _ = SalaryComponent.objects.get_or_create(
            code=code,
            defaults={"name": code.title().replace("_", " "), "component_type": ctype},
        )
        out[code] = comp
    return out

def ensure_cycles(business: Business):
    PayrollCycle.objects.get_or_create(
        business=business, cycle_type="SEMI_1",
        defaults={"name": "1st Half", "start_day": 25, "end_day": 10, "is_active": True},
    )
    PayrollCycle.objects.get_or_create(
        business=business, cycle_type="SEMI_2",
        defaults={"name": "2nd Half", "start_day": 10, "end_day": 25, "is_active": True},
    )
    PayrollCycle.objects.get_or_create(
        business=business, cycle_type="MONTHLY",
        defaults={"name": "Monthly", "start_day": 1, "end_day": 28, "is_active": True},
    )

def compute_regular_monthly_gross(position: Position, base_salary: Decimal) -> Decimal:
    total = Decimal("0.00")
    structures = SalaryStructure.objects.filter(position=position).select_related("component")
    for s in structures:
        amt = (Decimal(s.amount) / Decimal("100.00")) * Decimal(base_salary) if s.is_percentage else Decimal(s.amount)
        if s.component.component_type == "EARNING":
            total += amt
    return q2(total)

def upsert_record(employee: Employee, month: date, component: SalaryComponent, cycle: str, amount: Decimal, is_13th=False):
    PayrollRecord.objects.update_or_create(
        employee=employee,
        month=month,
        component=component,
        payroll_cycle=cycle,     # must be in lookup (unique key includes it)
        defaults={"amount": q2(amount), "is_13th_month": bool(is_13th)},
    )

def seed_timelogs(employee: Employee, start_date: date, end_date: date) -> None:
    """Create a small deterministic set of TimeLogs within the window."""
    TimeLog.objects.filter(employee=employee, date__range=(start_date, end_date)).delete()

    def add_log(d: date, hrs: float, late_m: int = 0, undert_m: int = 0, absent=False, holiday: Optional[Holiday] = None):
        base_in = datetime.combine(d, datetime.strptime("09:00", "%H:%M").time())
        time_in = None if absent else (base_in + timedelta(minutes=late_m)).time()
        total_minutes = int(hrs * 60)
        work_minutes = max(0, total_minutes - late_m - undert_m)
        time_out = None if absent else (base_in + timedelta(minutes=late_m + work_minutes)).time()
        return TimeLog.objects.create(
            employee=employee,
            date=d,
            time_in=time_in,
            time_out=time_out,
            ot_hours=q2(max(Decimal("0.00"), Decimal(hrs) - Decimal("8.00"))),
            late_minutes=int(late_m),
            undertime_minutes=int(undert_m),
            is_absent=absent,
            holiday=holiday,
        )

    # Optional holiday on the window end date (for demo)
    holiday_obj = None
    try:
        holiday_obj, _ = Holiday.objects.get_or_create(
            date=end_date, defaults={"name": "Founders Day", "type": "REGULAR", "multiplier": Decimal("2.00"), "is_national": True}
        )
    except Exception:
        pass

    current = start_date
    samples = [
        dict(hrs=8.0, late=0, under=0),
        dict(hrs=9.5, late=0, under=0),  # OT + mark holiday
        dict(hrs=8.0, late=15, under=0),
        dict(hrs=7.5, late=0, under=30),
        dict(hrs=10.0, late=0, under=0), # OT
        dict(hrs=0.0, late=0, under=0, absent=True),
    ]
    for i, s in enumerate(samples):
        if current > end_date:
            break
        add_log(
            current,
            s.get("hrs", 8.0),
            s.get("late", 0),
            s.get("under", 0),
            s.get("absent", False),
            holiday_obj if i == 1 else None,
        )
        current += timedelta(days=1)

def simulate_cycle_for_month(
    employee: Employee,
    month: date,
    cycle: str,
    business: Business,
    comps: dict[str, SalaryComponent],
    policy: PayrollPolicy,
    base_salary: Decimal,
    seed_logs: bool,
    out_dir: str,
) -> tuple[Decimal, Decimal, str]:
    """Run one cycle (SEMI_1/SEMI_2/MONTHLY) for a given month; return (earn, ded, pdf_path)."""
    start_date, end_date = get_dynamic_cutoff(month, cycle, business)

    if seed_logs:
        seed_timelogs(employee, start_date, end_date)

    # Fixed components (BASIC + other structured earnings)
    structures = SalaryStructure.objects.filter(position=employee.position).select_related("component")
    for struct in structures:
        amt = (Decimal(struct.amount) / Decimal("100.00")) * base_salary if struct.is_percentage else Decimal(struct.amount)
        upsert_record(employee, month, struct.component, cycle, amt)

    # Time-based aggregates within cutoff
    agg = TimeLog.objects.filter(employee=employee, date__range=(start_date, end_date)).aggregate(
        total_ot=Sum("ot_hours"),
        total_late=Sum("late_minutes"),
        total_under=Sum("undertime_minutes"),
    )
    total_ot = Decimal(agg["total_ot"] or 0)
    total_late = Decimal(agg["total_late"] or 0)
    total_under = Decimal(agg["total_under"] or 0)
    total_absent = TimeLog.objects.filter(employee=employee, date__range=(start_date, end_date), is_absent=True).count()

    working_days = Decimal(getattr(policy, "standard_working_days", 22))
    ot_mult = Decimal(getattr(policy, "ot_multiplier", Decimal("1.25")))
    daily_rate = q2(base_salary / working_days)
    hourly_rate = q2(daily_rate / Decimal("8"))
    minute_rate = (hourly_rate / Decimal("60")).quantize(Decimal("0.0001"))

    # Upsert time-based components
    upsert_record(employee, month, comps["OT"], cycle, total_ot * hourly_rate * ot_mult)
    upsert_record(employee, month, comps["LATE"], cycle, total_late * minute_rate)
    upsert_record(employee, month, comps["UNDERTIME"], cycle, total_under * minute_rate)
    upsert_record(employee, month, comps["ABSENT"], cycle, Decimal(total_absent) * daily_rate)

    # Holiday OT
    hol_regs = TimeLog.objects.filter(employee=employee, date__range=(start_date, end_date), holiday__type="REGULAR", ot_hours__gt=0)
    hol_spec = TimeLog.objects.filter(employee=employee, date__range=(start_date, end_date), holiday__type="SPECIAL", ot_hours__gt=0)
    hol_reg_amount = sum((hourly_rate * Decimal(t.ot_hours) * Decimal("2.00") for t in hol_regs), Decimal("0.00"))
    hol_spec_amount = sum((hourly_rate * Decimal(t.ot_hours) * Decimal("1.30") for t in hol_spec), Decimal("0.00"))
    if hol_reg_amount:
        upsert_record(employee, month, comps["HOLIDAY_REGULAR"], cycle, hol_reg_amount)
    if hol_spec_amount:
        upsert_record(employee, month, comps["HOLIDAY_SPECIAL"], cycle, hol_spec_amount)

    # PH mandatories (monthly basis, allocated per cycle)
    gross_monthly = compute_regular_monthly_gross(employee.position, base_salary)
    monthly = compute_mandatories_monthly(gross_monthly, policy)
    per_cycle = allocate_to_cycle(monthly, cycle)  # default 50/50 split for semi-monthly
    upsert_record(employee, month, comps["SSS_EE"], cycle, per_cycle["SSS_EE"])
    upsert_record(employee, month, comps["PHIC_EE"], cycle, per_cycle["PHIC_EE"])
    upsert_record(employee, month, comps["HDMF_EE"], cycle, per_cycle["HDMF_EE"])
    upsert_record(employee, month, comps["TAX_WHT"], cycle, per_cycle["TAX_WHT"])

    # Payslip snapshot + PDF for this cycle
    snap = get_employee_payslip_snapshot(employee_id=employee.id, month=month, payroll_cycle=cycle)
    pdf = generate_payslip_pdf(snap, business_name=business.name)
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, f"payslip_{employee.id}_{month.strftime('%Y-%m')}_{cycle}.pdf")
    with open(pdf_path, "wb") as f:
        f.write(pdf)

    # Totals for this cycle
    recs = PayrollRecord.objects.filter(employee=employee, month=month, payroll_cycle=cycle).select_related("component")
    earn = sum((r.amount for r in recs if r.component.component_type == "EARNING"), start=Decimal("0.00"))
    ded = sum((r.amount for r in recs if r.component.component_type == "DEDUCTION"), start=Decimal("0.00"))
    return earn, ded, pdf_path


# ---------------- command ----------------

class Command(BaseCommand):
    help = "Simulate a WHOLE YEAR: runs each month for SEMI_1 and SEMI_2 (or MONTHLY), generates PayrollRecords (incl. PH mandatories), creates PDFs, and prints an annual summary."

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, required=True, help="Year (e.g., 2025)")
        parser.add_argument("--base", dest="base_salary", default="30000.00", help="Monthly base salary")
        parser.add_argument("--business", default="Acme Corp", help="Business name")
        parser.add_argument("--branch", default="Main", help="Branch name")
        parser.add_argument("--position", default="Developer", help="Position name")
        parser.add_argument("--employee-id", type=int, help="Use existing employee ID (optional)")
        parser.add_argument("--cycles", choices=["SEMI", "MONTHLY", "BOTH"], default="BOTH", help="Which cycles to run per month")
        parser.add_argument("--no-seed-logs", action="store_true", help="Skip seeding demo timelogs (use your real logs)")
        parser.add_argument("--out-dir", default="./payslips", help="Directory to write payslip PDFs")
        parser.add_argument("--with-13th", action="store_true", help="Also compute 13th month at end of year")

    @transaction.atomic
    def handle(self, *args, **opts):
        year = int(opts["year"])
        base_salary = Decimal(str(opts["base_salary"]))
        out_dir = os.path.abspath(opts["out_dir"])
        seed_logs = not opts["no_seed_logs"]
        run_cycles_mode = opts["cycles"]

        business, _ = Business.objects.get_or_create(name=opts["business"])
        branch, _ = Branch.objects.get_or_create(business=business, name=opts["branch"])
        ensure_cycles(business)
        comps = ensure_components()

        policy, _ = PayrollPolicy.objects.get_or_create(
            business=business,
            defaults=dict(
                grace_minutes=5,
                standard_working_days=Decimal("22"),
                late_penalty_per_minute=Decimal("2.00"),
                undertime_penalty_per_minute=Decimal("2.00"),
                absent_penalty_per_day=Decimal("1000.00"),
                ot_multiplier=Decimal("1.25"),
                rest_day_multiplier=Decimal("1.30"),
                holiday_regular_multiplier=Decimal("2.00"),
                holiday_special_multiplier=Decimal("1.30"),
            ),
        )

        position, _ = Position.objects.get_or_create(name=opts["position"])
        if opts.get("employee_id"):
            employee = Employee.objects.get(pk=opts["employee_id"])
            if not employee.branch_id:
                employee.branch = branch
            if not employee.position_id:
                employee.position = position
            employee.save(update_fields=["branch", "position"])
        else:
            employee, _ = Employee.objects.get_or_create(
                first_name="Jane", last_name="Doe", email="jane.doe@example.com",
                defaults={"branch": branch, "position": position, "hire_date": date(year, 1, 1), "active": True},
            )

        # Ensure BASIC structure = 100% of base
        SalaryStructure.objects.get_or_create(
            position=position, component=comps["BASIC"], defaults={"amount": Decimal("100.00"), "is_percentage": True}
        )

        self.stdout.write(self.style.MIGRATE_HEADING(f"== YEARLY simulation for {employee} | {year} =="))

        annual = {"EARNING": Decimal("0.00"), "DEDUCTION": Decimal("0.00")}
        pdfs: list[str] = []

        # Decide cycle set
        if run_cycles_mode == "SEMI":
            cycle_set: Iterable[str] = ("SEMI_1", "SEMI_2")
        elif run_cycles_mode == "MONTHLY":
            cycle_set = ("MONTHLY",)
        else:  # BOTH
            cycle_set = ("SEMI_1", "SEMI_2", "MONTHLY")

        # Iterate months
        for m in range(1, 13):
            month = date(year, m, 1)
            self.stdout.write(self.style.HTTP_INFO(f"-- {month.strftime('%B %Y')} --"))

            for cycle in cycle_set:
                earn, ded, pdf_path = simulate_cycle_for_month(
                    employee=employee,
                    month=month,
                    cycle=cycle,
                    business=business,
                    comps=comps,
                    policy=policy,
                    base_salary=base_salary,
                    seed_logs=seed_logs,
                    out_dir=out_dir,
                )
                annual["EARNING"] += earn
                annual["DEDUCTION"] += ded
                pdfs.append(pdf_path)
                self.stdout.write(
                    f"[{cycle}] Earnings: {earn}  Deductions: {ded}  Net: {earn - ded}  PDF: {os.path.relpath(pdf_path)}"
                )

        # 13th month (optional)
        if opts["with_13th"]:
            basic_comp = comps["BASIC"]
            thirteenth_comp = comps["13TH"]
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)

            total_basic = PayrollRecord.objects.filter(
                employee=employee,
                component=basic_comp,
                month__range=(start_date, end_date),
                is_13th_month=False
            ).aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

            thirteenth = q2(Decimal(total_basic) / Decimal("12"))
            upsert_record(employee, date(year, 12, 1), thirteenth_comp, "MONTHLY", thirteenth, is_13th=True)

            # Tiny PDF receipt for 13th
            snap = {
                "employee_id": employee.id,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "month": date(year, 12, 1),
                "payroll_cycle": "13TH_MONTH",
                "rows": [{"component": "13th Month Pay", "type": "EARNING", "amount": thirteenth}],
                "totals": {"earnings": thirteenth, "deductions": Decimal("0.00"), "net_pay": thirteenth},
            }
            pdf = generate_payslip_pdf(snap, business_name=business.name)
            pdf_path = os.path.join(out_dir, f"payslip_{employee.id}_{year}_13th.pdf")
            with open(pdf_path, "wb") as f:
                f.write(pdf)
            pdfs.append(pdf_path)
            annual["EARNING"] += thirteenth
            self.stdout.write(self.style.SUCCESS(f"[13TH] Amount: {thirteenth}  PDF: {os.path.relpath(pdf_path)}"))

        # Annual summary
        net = annual["EARNING"] - annual["DEDUCTION"]
        self.stdout.write(self.style.MIGRATE_HEADING("== Annual totals =="))
        self.stdout.write(f"Earnings: {annual['EARNING']}  Deductions: {annual['DEDUCTION']}  Net: {net}")
        self.stdout.write(self.style.HTTP_INFO("Payslips written:"))
        for p in pdfs:
            self.stdout.write(f" - {os.path.relpath(p)}")
