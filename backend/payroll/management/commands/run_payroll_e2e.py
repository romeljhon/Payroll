# payroll/management/commands/run_payroll_e2e.py
import json
from datetime import date, time, timedelta
from decimal import Decimal
from typing import Tuple

from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import resolve, Resolver404
from django.utils.dateparse import parse_date

from employees.models import Employee
from organization.models import Business, Branch
from positions.models import Position
from payroll.models import (
    PayrollRecord, PayrollCycle, SalaryComponent, SalaryStructure
)
from timekeeping.models import TimeLog, Holiday
from payroll.services.payroll_cycles import get_dynamic_cutoff


class Command(BaseCommand):
    help = (
        "End-to-end payroll run using CURRENT DB. "
        "Seeds Business/Branch/Position/Cycles/Components/Structure, "
        "populates TimeLogs for every day in the cutoff (e.g., 1–15), "
        "creates a Regular Holiday on cutoff end, runs all endpoints, and prints a report."
    )

    def add_arguments(self, parser):
        parser.add_argument("--employee-id", type=int, default=None, help="Employee ID (defaults to first active).")
        parser.add_argument("--month", type=str, default="2025-08-01", help="Month (YYYY-MM-DD, use first day).")
        parser.add_argument("--base-salary", type=str, default="30000.00", help="Base salary.")
        parser.add_argument("--cycle", type=str, default="SEMI_1", choices=["SEMI_1", "SEMI_2", "MONTHLY"],
                            help="Payroll cycle to test.")
        parser.add_argument("--clean", action="store_true",
                            help="Clean existing PayrollRecords for employee+month and TimeLogs in cutoff first.")

    # ---------- helpers ----------

    def _check_route(self, path):
        try:
            resolve(path)
            return True
        except Resolver404:
            self.stdout.write(self.style.WARNING(f"Route {path} not resolved by URLConf. Ensure URLs are wired."))
            return False

    def _ensure_employee_ready(self, employee: Employee) -> Tuple[Business, Position, dict]:
        """Ensure Branch->Business, Position, Cycles, Components, and a BASIC structure exist."""
        changed = False

        if not employee.branch or not getattr(employee.branch, "business", None):
            biz, _ = Business.objects.get_or_create(name="Demo Biz", defaults={"tax_id": "TAX-123"})
            branch, _ = Branch.objects.get_or_create(business=biz, name="HQ")
            employee.branch = branch
            changed = True
        else:
            biz = employee.branch.business

        if not employee.position:
            pos, _ = Position.objects.get_or_create(name="Developer")
            employee.position = pos
            changed = True
        else:
            pos = employee.position

        if changed:
            employee.save()

        # Cycles
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="SEMI_1",
            defaults={"name": "1st Half", "start_day": 1, "end_day": 15, "is_active": True},
        )
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="SEMI_2",
            defaults={"name": "2nd Half", "start_day": 16, "end_day": 30, "is_active": True},
        )
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="MONTHLY",
            defaults={"name": "Monthly", "start_day": 1, "end_day": 30, "is_active": True},
        )

        # Components
        base_set = [
            ("BASIC", "Basic", "EARNING"),
            ("OT", "Overtime", "EARNING"),
            ("LATE", "Late", "DEDUCTION"),
            ("UNDERTIME", "Undertime", "DEDUCTION"),
            ("ABSENT", "Absence", "DEDUCTION"),
            ("HOLIDAY_REGULAR", "Regular Holiday OT", "EARNING"),
            ("HOLIDAY_SPECIAL", "Special Holiday OT", "EARNING"),
            ("13TH", "13th Month", "EARNING"),
        ]
        comps = {}
        for code, name, ctype in base_set:
            comp, _ = SalaryComponent.objects.get_or_create(
                code=code, defaults={"name": name, "component_type": ctype}
            )
            comps[code] = comp

        # Structure (fixed 30,000 unless you change base)
        SalaryStructure.objects.update_or_create(
            position=pos, component=comps["BASIC"],
            defaults={"amount": Decimal("30000.00"), "is_percentage": False},
        )

        return biz, pos, comps

    def _seed_full_cutoff_timelogs(self, employee: Employee, month_date: date, cycle_type: str) -> Tuple[date, date, int]:
        """
        Populate a TimeLog for EVERY day in the cutoff (inclusive).
        Pattern:
          - All days: normal day (9:00–18:00), no OT/late/undertime, not absent.
          - start+2: OT (2h)
          - start+3: Late (30m)
          - start+5: Undertime (45m)
          - start+7: Absent
          - cutoff_end: Regular Holiday with OT (3h)
        """
        biz = employee.branch.business
        cutoff_start, cutoff_end = get_dynamic_cutoff(month_date, cycle_type, biz)

        # Ensure a Regular Holiday on cutoff_end
        hol, _ = Holiday.objects.get_or_create(
            date=cutoff_end,
            defaults={"name": "Test Regular Holiday", "type": Holiday.REGULAR, "multiplier": Decimal("2.00")}
        )

        if self.clean_logs:
            TimeLog.objects.filter(employee=employee, date__range=(cutoff_start, cutoff_end)).delete()

        total_created = 0
        day = cutoff_start
        # Base defaults for a normal workday
        base_defaults = dict(
            time_in=time(9, 0), time_out=time(18, 0),
            ot_hours=Decimal("0.0"), late_minutes=0, undertime_minutes=0,
            is_rest_day=False, is_absent=False, holiday=None
        )

        while day <= cutoff_end:
            defaults = base_defaults.copy()

            # Special days
            if day == cutoff_start + timedelta(days=2):
                defaults["ot_hours"] = Decimal("2.0")
            if day == cutoff_start + timedelta(days=3):
                defaults["late_minutes"] = 30
            if day == cutoff_start + timedelta(days=5):
                defaults["undertime_minutes"] = 45
            if day == cutoff_start + timedelta(days=7):
                defaults.update(time_in=None, time_out=None, is_absent=True)
            if day == cutoff_end:
                defaults.update(holiday=hol, ot_hours=Decimal("3.0"))

            _, created = TimeLog.objects.update_or_create(
                employee=employee, date=day, defaults=defaults
            )
            if created:
                total_created += 1

            day += timedelta(days=1)

        return cutoff_start, cutoff_end, total_created

    def _print_records_table(self, employee: Employee, month_date: date):
        rows = (PayrollRecord.objects
                .filter(employee=employee, month=month_date)
                .select_related("component")
                .order_by("component__component_type", "component__code", "component__name"))
        if not rows.exists():
            self.stdout.write(self.style.WARNING("No PayrollRecord rows found."))
            return
        self.stdout.write("\nComponent         Type        Amount     13th?   Cycle")
        self.stdout.write("---------------  ----------  ----------  ------  --------")
        for r in rows:
            self.stdout.write(
                f"{(r.component.code or r.component.name):<15}  "
                f"{r.component.component_type:<10}  "
                f"{str(r.amount):>10}  "
                f"{'Y' if r.is_13th_month else 'N':<6}  "
                f"{r.payroll_cycle}"
            )
        self.stdout.write("")

    # ---------- main ----------

    def handle(self, *args, **opts):
        client = Client()
        client.defaults["HTTP_HOST"] = "localhost"  # avoid DisallowedHost

        self.clean_logs = bool(opts.get("clean"))
        month_str = opts["month"]
        base_salary = opts["base_salary"]
        cycle = opts["cycle"]
        month_date = parse_date(month_str)
        if not month_date:
            self.stdout.write(self.style.ERROR("month must be YYYY-MM-DD"))
            return

        # Pick employee (or create one if none exists)
        employee = (Employee.objects.filter(active=True).first()
                    if opts["employee_id"] is None
                    else Employee.objects.get(id=opts["employee_id"]))
        if not employee:
            # Create a demo employee if truly none
            biz, _ = Business.objects.get_or_create(name="Demo Biz")
            branch, _ = Branch.objects.get_or_create(business=biz, name="HQ")
            pos, _ = Position.objects.get_or_create(name="Developer")
            employee = Employee.objects.create(
                first_name="Jane", last_name="Doe", email=None, phone=None,
                branch=branch, position=pos, hire_date=month_date, active=True
            )

        # Ensure required related data
        biz, pos, comps = self._ensure_employee_ready(employee)

        # Clean existing PayrollRecords for that month if requested
        if opts["clean"]:
            PayrollRecord.objects.filter(employee=employee, month=month_date).delete()

        # Seed TimeLogs for EVERY day in cutoff (+ Regular Holiday on cutoff_end)
        cutoff_start, cutoff_end, created_logs = self._seed_full_cutoff_timelogs(employee, month_date, cycle)

        self.stdout.write(self.style.SUCCESS(
            f"Using employee: {employee.id} - {employee} | Cycle: {cycle} | "
            f"Cutoff: {cutoff_start}..{cutoff_end} | TimeLogs created: {created_logs}"
        ))

        # Routes we expect (ensure mounted at /api/)
        endpoints = {
            "generate": "/api/payroll/generate/",
            "summary": "/api/payroll/summary/",
            "thirteenth": "/api/payroll/13th/",
            "payslip": "/api/payroll/payslip/",
            "batch": "/api/payroll/batch/",
        }
        for _, path in endpoints.items():
            self._check_route(path)

        # 1) Generate (fixed components per structure)
        payload = {
            "employee_id": employee.id, "month": month_str,
            "base_salary": base_salary, "payroll_cycle": cycle,
        }
        resp = client.post(endpoints["generate"], data=json.dumps(payload), content_type="application/json")
        self.stdout.write(f"[Generate] {resp.status_code} -> {resp.content[:300]}")
        if resp.status_code >= 400:
            self.stdout.write(self.style.ERROR("Generate failed."))
            return

        # 2) Batch (time-based from TimeLogs)
        resp = client.post(
            endpoints["batch"],
            data=json.dumps({"month": month_str, "base_salaries": {str(employee.id): base_salary}, "payroll_cycle": cycle}),
            content_type="application/json",
        )
        self.stdout.write(f"[Batch] {resp.status_code} -> {resp.content[:300]}")

        # 3) Summary
        resp = client.get(f'{endpoints["summary"]}?employee_id={employee.id}&month={month_str}')
        self.stdout.write(f"[Summary] {resp.status_code} -> {resp.content[:300]}")

        # 4) Payslip
        resp = client.get(f'{endpoints["payslip"]}?employee_id={employee.id}&month={month_str}')
        self.stdout.write(f"[Payslip] {resp.status_code} -> {resp.content[:300]}")

        # 5) 13th month
        year = month_date.year
        resp = client.post(
            endpoints["thirteenth"],
            data=json.dumps({"employee_id": employee.id, "year": year}),
            content_type="application/json"
        )
        self.stdout.write(f"[13th] {resp.status_code} -> {resp.content[:300]}")

        # Final report
        self._print_records_table(employee, month_date)

        total = PayrollRecord.objects.filter(employee=employee, month=month_date).count()
        self.stdout.write(self.style.SUCCESS(f"✅ Total PayrollRecord rows for emp={employee.id}, month={month_str}: {total}"))
        self.stdout.write(self.style.SUCCESS("E2E payroll run completed."))
