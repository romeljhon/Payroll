
# payroll/management/commands/seed_and_simulate_payroll.py
from __future__ import annotations

from datetime import date, time, timedelta
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
    help = "Seed data for multiple employees and simulate a payroll run."

    def add_arguments(self, parser):
        parser.add_argument("--month", default="2025-08", help="Target month (YYYY-MM)")
        parser.add_argument("--cycle", default="MONTHLY", help="MONTHLY | SEMI_1 | SEMI_2")

    def handle(self, *args, **opts):
        target_month = self._normalize_month(opts["month"])
        cycle_type = str(opts["cycle"]).upper()

        with transaction.atomic():
            self.stdout.write("Seeding foundational data...")
            biz = self._seed_business()
            br = self._seed_branch(biz)
            self._seed_policy(biz)
            self._seed_cycles(biz)
            self._seed_components()

            self.stdout.write("Seeding employees and their data...")
            employees = self._seed_employees(br)
            for emp in employees:
                self._seed_realistic_timelogs(emp, target_month)

        self.stdout.write(self.style.NOTICE(f"\nGenerating payroll for {len(employees)} employees — {target_month} ({cycle_type})..."))
        employee_ids = [emp.id for emp in employees]
        _results = generate_batch_payroll(
            month=target_month,
            cycle_type=cycle_type,
            employee_ids=employee_ids,
        )

        run = PayrollRun.objects.filter(business=biz, month=target_month, payroll_cycle__cycle_type=cycle_type).order_by("-id").first()
        if not run:
            self.stdout.write(self.style.ERROR("No PayrollRun found after generation."))
            return

        self.stdout.write(self.style.SUCCESS("\n=== PAYROLL RUN SUMMARY ==="))
        self.stdout.write(f"Run ID: {run.id} | Month: {run.month} | Cycle: {run.payroll_cycle.cycle_type}")
        self.stdout.write("\nRun includes the following employees:")
        for emp in employees:
            self.stdout.write(f"- {emp.first_name} {emp.last_name} (ID: {emp.id})")

        self.stdout.write(self.style.SUCCESS("\nSeeding complete. You can now use the bulk sending command:"))
        self.stdout.write(self.style.NOTICE(f"python manage.py send_bulk_payslips {target_month.strftime('%Y-%m')} {cycle_type}"))

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

    def _seed_policy(self, biz: Business):
        PayrollPolicy.objects.get_or_create(business=biz, defaults=dict(grace_minutes=5, standard_working_days=Decimal("22.00"), late_penalty_per_minute=Decimal("2.00"), undertime_penalty_per_minute=Decimal("2.00"), absent_penalty_per_day=Decimal("1000.00"), ot_multiplier=Decimal("1.25")))

    def _seed_cycles(self, biz: Business):
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="MONTHLY", defaults={"name": "Monthly", "start_day": 1, "end_day": 31, "is_active": True})

    def _seed_components(self):
        components = [("BASIC", "Basic Pay", "EARNING"), ("ALLOW", "Allowance", "EARNING"), ("OT", "Overtime Pay", "EARNING"), ("LATE", "Late Penalty", "DEDUCTION"), ("UNDERTIME", "Undertime Penalty", "DEDUCTION"), ("ABSENT", "Absences", "DEDUCTION")]
        for code, name, ctype in components:
            SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": ctype})

    def _seed_employees(self, br: Branch) -> list[Employee]:
        # Create Positions
        se_pos, _ = Position.objects.get_or_create(name="Software Engineer")
        sa_pos, _ = Position.objects.get_or_create(name="Solution Architect")

        # Employee 1: Jane Doe
        jane, _ = Employee.objects.get_or_create(email="kazueezuak@gmail.com", defaults=dict(branch=br, first_name="Jane", last_name="Doe", position=se_pos, hire_date=date(2024, 1, 15), active=True))
        SalaryRate.objects.get_or_create(employee=jane, start_date=date(2025, 1, 1), defaults={"amount": Decimal("30000.00")})

        # Employee 2: Zandro Narvaza
        zandro, _ = Employee.objects.get_or_create(email="zandro.narvaza@gmail.com", defaults=dict(branch=br, first_name="Zandro", last_name="Narvaza", position=sa_pos, hire_date=date(2024, 2, 1), active=True))
        SalaryRate.objects.get_or_create(employee=zandro, start_date=date(2025, 1, 1), defaults={"amount": Decimal("50000.00")})

        return [jane, zandro]

    def _seed_realistic_timelogs(self, emp: Employee, anchor_month: date):
        try:
            from timekeeping.models import TimeLog
        except ImportError:
            self.stdout.write(self.style.WARNING("Timekeeping app not found. Skipping timelogs."))
            return

        y, m = anchor_month.year, anchor_month.month
        logs = [
            (date(y, m, 1), time(9, 0), time(18, 0)),
            (date(y, m, 2), time(9, 10), time(18, 0)), # Late
            (date(y, m, 3), time(9, 0), time(19, 0)), # OT
            (date(y, m, 4), time(9, 0), time(17, 30)), # Undertime
            (date(y, m, 5), None, None) # Absent
        ]

        for d, ti, to in logs:
            defaults = {'time_in': ti, 'time_out': to} if ti and to else {}
            TimeLog.objects.update_or_create(employee=emp, date=d, defaults=defaults)
