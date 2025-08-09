# payroll/management/commands/smoke_test_payroll.py
import json
from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import resolve, Resolver404

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
        "Run smoke tests against payroll endpoints using CURRENT database (no test DB). "
        "Auto-heals missing demo data and seeds timelogs/holiday to exercise batch calculations."
    )

    def add_arguments(self, parser):
        parser.add_argument("--employee-id", type=int, default=None, help="Employee ID to use (defaults to first).")
        parser.add_argument("--month", type=str, default="2025-08-01", help="Month (YYYY-MM-DD).")
        parser.add_argument("--base-salary", type=str, default="30000.00", help="Base salary.")
        parser.add_argument("--cycle", type=str, default="SEMI_1", choices=["SEMI_1", "SEMI_2", "MONTHLY"],
                            help="Payroll cycle to test for batch/generate.")

    # ---------- helpers ----------

    def _check_route(self, path):
        try:
            resolve(path)
            return True
        except Resolver404:
            self.stdout.write(self.style.WARNING(f"Route {path} not resolved by URLConf. Make sure URLs are wired."))
            return False

    def _ensure_employee_is_payroll_ready(self, employee: Employee):
        """Ensure employee has Branch->Business, Position, payroll cycles, components, and a BASIC structure."""
        changed = False

        # Ensure Business + Branch
        if not employee.branch or not getattr(employee.branch, "business", None):
            biz, _ = Business.objects.get_or_create(name="Demo Biz", defaults={"tax_id": "TAX-123"})
            branch, _ = Branch.objects.get_or_create(business=biz, name="HQ")
            employee.branch = branch
            changed = True
        else:
            biz = employee.branch.business

        # Ensure Position
        if not employee.position:
            pos, _ = Position.objects.get_or_create(name="Developer")
            employee.position = pos
            changed = True
        else:
            pos = employee.position

        if changed:
            employee.save()

        # Ensure Payroll Cycles
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

        # Ensure components
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

        # Ensure BASIC salary structure for this position
        SalaryStructure.objects.update_or_create(
            position=pos, component=comps["BASIC"],
            defaults={"amount": Decimal("30000.00"), "is_percentage": False},
        )

        return biz, pos, comps

    def _seed_timelogs_and_holiday(self, employee: Employee, month_str: str, cycle_type: str):
        """Seed a few timelogs inside the cutoff to trigger OT, Late, Undertime, Absence, and Holiday lines."""
        month = date.fromisoformat(month_str)
        biz = employee.branch.business
        start, end = get_dynamic_cutoff(month, cycle_type, biz)

        # Pick some dates inside the cutoff window
        day1 = start  # OT day
        day2 = min(start.replace(day=start.day + 3), end)  # Late
        day3 = min(start.replace(day=start.day + 5), end)  # Undertime
        day4 = min(start.replace(day=start.day + 7), end)  # Absence
        hol_day = end  # Holiday with OT

        # Make sure holiday exists
        hol, _ = Holiday.objects.get_or_create(
            date=hol_day,
            defaults={"name": "Test Regular Holiday", "type": Holiday.REGULAR, "multiplier": Decimal("2.00")}
        )

        # Create logs
        TimeLog.objects.update_or_create(
            employee=employee, date=day1,
            defaults=dict(time_in=time(9, 0), time_out=time(18, 0),
                          ot_hours=Decimal("2.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=employee, date=day2,
            defaults=dict(time_in=time(9, 30), time_out=time(17, 0),
                          ot_hours=Decimal("0.0"), late_minutes=30, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=employee, date=day3,
            defaults=dict(time_in=time(9, 0), time_out=time(16, 15),
                          ot_hours=Decimal("0.0"), late_minutes=0, undertime_minutes=45,
                          is_rest_day=False, is_absent=False, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=employee, date=day4,
            defaults=dict(time_in=None, time_out=None,
                          ot_hours=Decimal("0.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=True, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=employee, date=hol_day,
            defaults=dict(time_in=time(9, 0), time_out=time(19, 0),
                          ot_hours=Decimal("3.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=hol)
        )

        return start, end

    def _assert_component_present(self, employee: Employee, month_str: str, code_prefix: str | None, expect_present=True):
        """Check if a PayrollRecord for a component code (or code prefix like 'HOLIDAY_') exists for the month."""
        qs = PayrollRecord.objects.filter(employee=employee, month=month_str)
        if code_prefix is None:
            return

        if code_prefix.startswith("HOLIDAY_"):
            exists = qs.filter(component__code__startswith=code_prefix, amount__gt=0).exists()
        else:
            exists = qs.filter(component__code=code_prefix, amount__gt=0).exists()

        if expect_present and not exists:
            self.stdout.write(self.style.ERROR(f"❌ Expected component {code_prefix} not found or zero amount."))
        elif expect_present and exists:
            self.stdout.write(self.style.SUCCESS(f"✅ Component {code_prefix} present."))
        elif not expect_present and exists:
            self.stdout.write(self.style.WARNING(f"⚠️ Component {code_prefix} present but was not expected."))

    # ---------- main ----------

    def handle(self, *args, **opts):
        client = Client()
        # Avoid DisallowedHost during management command requests
        client.defaults["HTTP_HOST"] = "localhost"

        month = opts["month"]
        base_salary = opts["base_salary"]
        cycle = opts["cycle"]

        employee = (Employee.objects.filter(active=True).first()
                    if opts["employee_id"] is None
                    else Employee.objects.get(id=opts["employee_id"]))
        if not employee:
            self.stdout.write(self.style.ERROR("No active employee found. Seed demo data first."))
            return

        # Ensure employee + base data are ready
        biz, pos, comps = self._ensure_employee_is_payroll_ready(employee)
        # Seed timelogs/holiday inside cutoff
        cutoff_start, cutoff_end = self._seed_timelogs_and_holiday(employee, month, cycle)

        self.stdout.write(self.style.SUCCESS(
            f"Using employee: {employee.id} - {employee} | Cycle: {cycle} "
            f"| Cutoff: {cutoff_start}..{cutoff_end}"
        ))

        # Endpoints expected by this smoke test (ensure your urlconf matches)
        endpoints = {
            "generate": "/api/payroll/generate/",
            "summary": "/api/payroll/summary/",
            "thirteenth": "/api/payroll/13th/",
            "payslip": "/api/payroll/payslip/",
            "batch": "/api/payroll/batch/",
        }

        for name, path in endpoints.items():
            self._check_route(path)

        # 1) Generate payroll (fixed structure components)
        payload = {
            "employee_id": employee.id,
            "month": month,
            "base_salary": base_salary,
            "payroll_cycle": cycle,
        }
        resp = client.post(endpoints["generate"], data=json.dumps(payload), content_type="application/json")
        self.stdout.write(f"[Generate] {resp.status_code} -> {resp.content[:300]}")
        if resp.status_code >= 400:
            self.stdout.write(self.style.ERROR("GeneratePayrollView failed."))
            return

        # 2) Batch (time-based components from timelogs)
        resp = client.post(
            endpoints["batch"],
            data=json.dumps({"month": month, "base_salaries": {str(employee.id): base_salary}, "payroll_cycle": cycle}),
            content_type="application/json",
        )
        self.stdout.write(f"[Batch] {resp.status_code} -> {resp.content[:300]}")

        # 3) Summary
        resp = client.get(f'{endpoints["summary"]}?employee_id={employee.id}&month={month}')
        self.stdout.write(f"[Summary] {resp.status_code} -> {resp.content[:300]}")

        # 4) Payslip
        resp = client.get(f'{endpoints["payslip"]}?employee_id={employee.id}&month={month}')
        self.stdout.write(f"[Payslip] {resp.status_code} -> {resp.content[:300]}")

        # 5) 13th month
        year = date.fromisoformat(month).year
        resp = client.post(
            endpoints["thirteenth"],
            data=json.dumps({"employee_id": employee.id, "year": year}),
            content_type="application/json"
        )
        self.stdout.write(f"[13th] {resp.status_code} -> {resp.content[:300]}")

        # Assertions: confirm key components created
        self._assert_component_present(employee, month, "BASIC")
        self._assert_component_present(employee, month, "OT")
        self._assert_component_present(employee, month, "LATE")
        self._assert_component_present(employee, month, "UNDERTIME")
        self._assert_component_present(employee, month, "ABSENT")
        self._assert_component_present(employee, month, "HOLIDAY_REGULAR")  # we seeded a Regular holiday

        # Final count
        count = PayrollRecord.objects.filter(employee=employee, month=month).count()
        self.stdout.write(self.style.SUCCESS(f"✅ PayrollRecord count for {employee.id} @ {month}: {count}"))
        self.stdout.write(self.style.SUCCESS("Smoke tests completed."))
