# payroll/management/commands/seed_and_simulate_payroll.py
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Sum

from organization.models import Business, Branch
from positions.models import Position
from employees.models import Employee
from payroll.models import (
    PayrollCycle, PayrollPolicy, SalaryComponent, SalaryStructure,
    SalaryRate, PayrollRecord, PayrollRun
)
from payroll.services.payroll_engine import generate_batch_payroll


class Command(BaseCommand):
    help = "Seed minimal payroll data and simulate a run. Supports a realistic scenario."

    def add_arguments(self, parser):
        parser.add_argument("--month", default="2025-08", help="Target month (YYYY-MM)")
        parser.add_argument("--cycle", default="SEMI_1", help="MONTHLY | SEMI_1 | SEMI_2")
        parser.add_argument("--no-timelogs", action="store_true", help="Skip creating sample TimeLogs")
        parser.add_argument("--scenario", default="simple", choices=["simple", "realistic"],  # ✅ NEW
                            help="simple: 2 logs in first half; realistic: varied logs across month.")
        parser.add_argument("--both", action="store_true", help="Run both SEMI_1 and SEMI_2 (ignores --cycle)")  # ✅ NEW

    def handle(self, *args, **opts):
        target_month = self._normalize_month(opts["month"])
        cycle_type = str(opts["cycle"]).upper()
        create_timelogs = not opts["no_timelogs"]
        scenario = opts["scenario"]
        run_both = bool(opts["both"])

        with transaction.atomic():
            biz = self._seed_business()
            br = self._seed_branch(biz)
            pol = self._seed_policy(biz)
            self._seed_cycles(biz)
            comps = self._seed_components()
            pos = self._seed_position()
            self._seed_structure(pos, comps)
            emp = self._seed_employee(br, pos)
            self._seed_salary_rate(emp, Decimal("30000.00"))  # gross monthly

        # TimeLogs
        if create_timelogs:
            if scenario == "realistic":
                self._seed_realistic_timelogs(emp, target_month)  # ✅ NEW
            else:
                self._seed_timelogs(emp, target_month)

        # Decide which cycles to run
        cycles_to_run = []
        if run_both:
            cycles_to_run = ["SEMI_1", "SEMI_2"]
        else:
            cycles_to_run = [cycle_type]

        monthly_totals = {"earnings": Decimal("0.00"), "deductions": Decimal("0.00"), "net": Decimal("0.00")}
        created_runs: list[PayrollRun] = []

        for cy in cycles_to_run:
            self.stdout.write(self.style.NOTICE(f"\nGenerating payroll for {emp} — {target_month} ({cy})..."))
            _results = generate_batch_payroll(
                month=target_month,
                cycle_type=cy,
                employee_ids=[emp.id],
                run=None,  # auto-create run
            )

            run = PayrollRun.objects.filter(business=biz, month=target_month, payroll_cycle__cycle_type=cy).order_by("-id").first()
            if not run:
                self.stdout.write(self.style.ERROR(f"No PayrollRun found for cycle {cy}."))
                continue
            created_runs.append(run)

            # Summarize this run
            sums = self._run_summary(run, emp)
            self.stdout.write(self.style.SUCCESS("\n=== RUN SUMMARY ==="))
            self.stdout.write(f"Run ID: {run.id}  |  Business: {biz.name}  |  Month: {run.month}  |  Cycle: {run.payroll_cycle.cycle_type}")
            self.stdout.write(f"EARNINGS : {sums['earnings']}")
            self.stdout.write(f"DEDUCTIONS: {sums['deductions']}")
            self.stdout.write(f"NET PAY  : {sums['net']}")

            # Accumulate monthly totals
            monthly_totals["earnings"] += sums["earnings"]
            monthly_totals["deductions"] += sums["deductions"]
            monthly_totals["net"] += sums["net"]

            # Line items
            self.stdout.write(self.style.NOTICE("\n=== LINE ITEMS ==="))
            for rec in PayrollRecord.objects.select_related("component").filter(run=run, employee=emp).order_by("component__component_type", "component__name"):
                self.stdout.write(f"- {rec.component.component_type:<9} {rec.component.code or rec.component.name:<16} {rec.amount}")

            self.stdout.write(self.style.SUCCESS("\nUse the endpoints below to preview payslip and email.\n"))
            self.stdout.write(f"Payslip preview (JSON): GET /payroll/payslip/?employee_id={emp.id}&month={run.month}&run={run.id}")
            self.stdout.write(f"Email single payslip  : POST /payroll/api/email/send-single-payslip/  {{ employee_id: {emp.id}, month: '{run.month}', run_id: {run.id} }}")

        # Monthly roll-up if both halves
        if len(created_runs) > 1:
            self.stdout.write(self.style.SUCCESS("\n=== MONTHLY TOTAL (SEMI_1 + SEMI_2) ==="))
            self.stdout.write(f"EARNINGS : {monthly_totals['earnings']}")
            self.stdout.write(f"DEDUCTIONS: {monthly_totals['deductions']}")
            self.stdout.write(f"NET PAY  : {monthly_totals['net']}")

    # ---------- Seed helpers ----------

    def _normalize_month(self, s: str) -> date:
        y, m = map(int, s.split("-")[:2])
        return date(y, m, 1)

    def _seed_business(self) -> Business:
        biz, _ = Business.objects.get_or_create(name="Acme Corp", defaults={"tax_id": "ACME-123"})
        return biz

    def _seed_branch(self, biz: Business) -> Branch:
        br, _ = Branch.objects.get_or_create(business=biz, name="HQ")
        return br

    def _seed_policy(self, biz: Business) -> PayrollPolicy:
        pol, _ = PayrollPolicy.objects.get_or_create(
            business=biz,
            defaults=dict(
                grace_minutes=5,
                standard_working_days=Decimal("22.00"),
                late_penalty_per_minute=Decimal("2.00"),
                undertime_penalty_per_minute=Decimal("2.00"),
                absent_penalty_per_day=Decimal("1000.00"),
                ot_multiplier=Decimal("1.25"),
                rest_day_multiplier=Decimal("1.30"),
                holiday_regular_multiplier=Decimal("2.00"),
                holiday_special_multiplier=Decimal("1.30"),
            )
        )
        return pol

    def _seed_cycles(self, biz: Business):
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="SEMI_1", defaults={"name": "1st Half", "start_day": 1, "end_day": 15, "is_active": True})
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="SEMI_2", defaults={"name": "2nd Half", "start_day": 16, "end_day": 31, "is_active": True})
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="MONTHLY", defaults={"name": "Monthly", "start_day": 1, "end_day": 31, "is_active": True})

    def _seed_components(self) -> dict[str, SalaryComponent]:
        mapping = {}
        for code, name, ctype in [
            ("BASIC", "Basic Pay", "EARNING"),
            ("ALLOW", "Allowance", "EARNING"),
            ("SSS_EE", "SSS (Employee Share)", "DEDUCTION"),
            ("PHIC_EE", "PhilHealth (Employee Share)", "DEDUCTION"),
            ("HDMF_EE", "Pag-IBIG (Employee Share)", "DEDUCTION"),
            ("TAX_WHT", "Withholding Tax", "DEDUCTION"),
            ("OT", "Overtime Pay", "EARNING"),
            ("LATE", "Late Penalty", "DEDUCTION"),
            ("UNDERTIME", "Undertime Penalty", "DEDUCTION"),
            ("REST_OT", "Rest Day Overtime", "EARNING"),
            ("HOLIDAY_PREMIUM", "Holiday Premium", "EARNING"),  # ✅ ensure exists
            ("13TH", "13th Month Pay", "EARNING"),
        ]:
            obj, _ = SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": ctype})
            mapping[code] = obj
        return mapping

    def _seed_position(self) -> Position:
        pos, _ = Position.objects.get_or_create(name="Software Engineer")
        return pos

    def _seed_structure(self, pos: Position, comps: dict[str, SalaryComponent]):
        # Earning split: 80% BASIC, 20% ALLOWANCE
        SalaryStructure.objects.get_or_create(position=pos, component=comps["BASIC"], defaults={"amount": Decimal("80.00"), "is_percentage": True})
        SalaryStructure.objects.get_or_create(position=pos, component=comps["ALLOW"], defaults={"amount": Decimal("20.00"), "is_percentage": True})
        # MVP deductions via structure (rough example %s)
        SalaryStructure.objects.get_or_create(position=pos, component=comps["SSS_EE"], defaults={"amount": Decimal("3.00"), "is_percentage": True})
        SalaryStructure.objects.get_or_create(position=pos, component=comps["PHIC_EE"], defaults={"amount": Decimal("2.00"), "is_percentage": True})
        SalaryStructure.objects.get_or_create(position=pos, component=comps["HDMF_EE"], defaults={"amount": Decimal("1.00"), "is_percentage": True})
        SalaryStructure.objects.get_or_create(position=pos, component=comps["TAX_WHT"], defaults={"amount": Decimal("5.00"), "is_percentage": True})

    def _seed_employee(self, br: Branch, pos: Position) -> Employee:
        emp, _ = Employee.objects.get_or_create(
            email="jane.doe@example.com",
            defaults=dict(
                branch=br,
                first_name="Jane",
                last_name="Doe",
                phone="09171234567",
                position=pos,
                hire_date=date(2024, 1, 15),
                active=True,
            )
        )
        return emp

    def _seed_salary_rate(self, emp: Employee, amount: Decimal):
        SalaryRate.objects.get_or_create(
            employee=emp,
            start_date=date(2025, 1, 1),
            defaults={"amount": amount, "end_date": None}
        )

    def _seed_timelogs(self, emp: Employee, anchor_month: date):
        """Simple: two logs in first half (on-time, slight late)."""
        try:
            from timekeeping.models import TimeLog
        except Exception:
            self.stdout.write(self.style.WARNING("Timekeeping app not available; skipping timelogs."))
            return

        d1 = date(anchor_month.year, anchor_month.month, 5)
        d2 = date(anchor_month.year, anchor_month.month, 6)
        TimeLog.objects.get_or_create(employee=emp, date=d1, defaults={"time_in": time(9, 0), "time_out": time(18, 0)})
        TimeLog.objects.get_or_create(employee=emp, date=d2, defaults={"time_in": time(9, 12), "time_out": time(18, 0)})

    # ✅ NEW: realistic timelogs & holiday
    def _seed_realistic_timelogs(self, emp: Employee, anchor_month: date):
        """
        Realistic spread across the month:
          - On-time days, late, undertime, overtime
          - One weekend (rest day) work
          - One holiday with work (premium)
          - One absence (no punches)
          - Covers both halves so you can run SEMI_1 + SEMI_2
        """
        try:
            from timekeeping.models import TimeLog, Holiday
        except Exception:
            self.stdout.write(self.style.WARNING("Timekeeping app not available; skipping timelogs/holidays."))
            return

        y, m = anchor_month.year, anchor_month.month

        # Create a REGULAR holiday on the 12th and a SPECIAL on the 26th
        h12, _ = Holiday.objects.get_or_create(
            date=date(y, m, 12),
            defaults={"name": "Founders Day", "type": "REGULAR", "multiplier": Decimal("2.00"), "is_national": True},
        )
        h26, _ = Holiday.objects.get_or_create(
            date=date(y, m, 26),
            defaults={"name": "City Day", "type": "SPECIAL", "multiplier": Decimal("1.30"), "is_national": False},
        )

        def punch(d, ti, to, **extra):
            TimeLog.objects.get_or_create(employee=emp, date=d, defaults={"time_in": ti, "time_out": to, **extra})

        # ---------- First half (1–15)
        punch(date(y, m, 1), time(9, 0),  time(18, 0))           # on-time
        punch(date(y, m, 2), time(9, 0),  time(18, 0))           # on-time
        punch(date(y, m, 3), time(9, 12), time(18, 0))           # late 12 min
        punch(date(y, m, 4), time(9, 0),  time(17, 30))          # undertime 30 min
        # absences: no punches — create a log row with no times (your analyzer treats as ABSENT)
        TimeLog.objects.get_or_create(employee=emp, date=date(y, m, 5), defaults={})
        punch(date(y, m, 6), time(9, 0),  time(20, 0))           # ~2h OT
        # rest day (first Sunday 1–15): find a sunday
        first_half_sunday = next(d for d in range(1, 16) if date(y, m, d).weekday() == 6)
        punch(date(y, m, first_half_sunday), time(10, 0), time(14, 0))  # 4h rest-day work
        # holiday on 12th with work
        punch(date(y, m, 12), time(9, 0), time(15, 0), holiday=h12)     # 6h span (minus break per analyzer)

        # ---------- Second half (16–31)
        punch(date(y, m, 16), time(9, 0), time(18, 0))          # on-time
        punch(date(y, m, 17), time(9, 0), time(20, 0))          # OT
        punch(date(y, m, 18), time(9, 15), time(18, 0))         # late 15 mins
        punch(date(y, m, 19), time(9, 0), time(17, 0))          # undertime 1h
        # special holiday on 26th with work
        punch(date(y, m, 26), time(9, 0), time(14, 0), holiday=h26)
        # another absence
        TimeLog.objects.get_or_create(employee=emp, date=date(y, m, 28), defaults={})
        # rest day (a sunday 16–31)
        second_half_sunday = next(d for d in range(16, 32) if date(y, m, d).weekday() == 6)
        punch(date(y, m, second_half_sunday), time(11, 0), time(16, 0))

    def _run_summary(self, run: PayrollRun, emp: Employee) -> dict:
        er = (
            PayrollRecord.objects
            .filter(run=run, employee=emp, component__component_type="EARNING")
            .aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        )
        dr = (
            PayrollRecord.objects
            .filter(run=run, employee=emp, component__component_type="DEDUCTION")
            .aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        )
        return {"earnings": er, "deductions": dr, "net": er - dr}
