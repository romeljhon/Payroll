
# payroll/management/commands/seed_and_simulate_payroll.py
from __future__ import annotations

import random
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

            self.stdout.write("Seeding employees, positions, and salaries...")
            employees, positions = self._seed_employees_and_positions(br)
            self._seed_salary_structures(positions)

            self.stdout.write("Seeding realistic time logs for all employees for the month...")
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
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="SEMI_1", defaults=dict(name="Semi-monthly 1-15", start_day=1, end_day=15, is_active=True))
        PayrollCycle.objects.get_or_create(business=biz, cycle_type="SEMI_2", defaults=dict(name="Semi-monthly 16-31", start_day=16, end_day=31, is_active=True))

    def _seed_components(self):
        earnings = [
            ("BASIC", "Basic Pay"),
            ("ALLOW", "Allowance"),
            ("OT", "Overtime Pay"),
            ("HOLIDAY_PAY", "Holiday Pay"),
            ("COMM", "Commission"),
        ]
        deductions = [
            ("LATE", "Late Penalty"),
            ("UNDERTIME", "Undertime Penalty"),
            ("ABSENT", "Absences"),
            ("SSS", "SSS Contribution"),
            ("PHILHEALTH", "PhilHealth Contribution"),
            ("PAGIBIG", "Pag-IBIG Contribution"),
        ]
        for code, name in earnings:
            SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": "EARNING"})
        for code, name in deductions:
            SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": "DEDUCTION"})

    def _seed_employees_and_positions(self, br: Branch) -> tuple[list[Employee], dict[str, Position]]:
        # Create Positions
        positions = {}
        pos_names = ["Software Engineer", "Solution Architect", "Project Manager", "QA Engineer", "UI/UX Designer"]
        for name in pos_names:
            pos, _ = Position.objects.get_or_create(name=name)
            positions[name.replace(" ", "_").lower()] = pos

        # Employee data: (first_name, last_name, email, position_key, salary)
        employee_data = [
            ("Jane", "Doe", "kazueezuak@gmail.com", "software_engineer", Decimal("60000.00")),
            ("Zandro", "Narvaza", "zandro.narvaza@gmail.com", "solution_architect", Decimal("85000.00")),
            ("John", "Smith", "john.smith@example.com", "project_manager", Decimal("75000.00")),
            ("Emily", "White", "emily.white@example.com", "qa_engineer", Decimal("55000.00")),
            ("Michael", "Brown", "michael.brown@example.com", "ui_ux_designer", Decimal("58000.00")),
        ]

        employees = []
        for fname, lname, email, pos_key, salary in employee_data:
            emp, created = Employee.objects.get_or_create(
                email=email,
                defaults=dict(
                    branch=br,
                    first_name=fname,
                    last_name=lname,
                    position=positions[pos_key],
                    hire_date=date(2024, 1, 15),
                    active=True
                )
            )
            SalaryRate.objects.get_or_create(
                employee=emp,
                start_date=date(2025, 1, 1),
                defaults={"amount": salary}
            )
            employees.append(emp)

        return employees, positions

    def _seed_salary_structures(self, positions: dict[str, Position]):
        basic = SalaryComponent.objects.get(code="BASIC")
        allow = SalaryComponent.objects.get(code="ALLOW")
        sss = SalaryComponent.objects.get(code="SSS")
        philhealth = SalaryComponent.objects.get(code="PHILHEALTH")
        pagibig = SalaryComponent.objects.get(code="PAGIBIG")

        for pos in positions.values():
            # Basic pay for all
            SalaryStructure.objects.get_or_create(position=pos, component=basic, defaults={'rate': Decimal("1.0")}) # 100% of basic salary rate

            # Allowance for some
            if pos.name in ["Solution Architect", "Project Manager"]:
                 SalaryStructure.objects.get_or_create(position=pos, component=allow, defaults={'amount': Decimal("5000.00")})

            # Standard deductions for all
            SalaryStructure.objects.get_or_create(position=pos, component=sss, defaults={'is_fixed_amount': False}) # Indicates table-based computation
            SalaryStructure.objects.get_or_create(position=pos, component=philhealth, defaults={'is_fixed_amount': False})
            SalaryStructure.objects.get_or_create(position=pos, component=pagibig, defaults={'amount': Decimal("100.00"), 'is_fixed_amount': True})


    def _seed_realistic_timelogs(self, emp: Employee, anchor_month: date):
        try:
            from timekeeping.models import TimeLog
        except ImportError:
            self.stdout.write(self.style.WARNING("Timekeeping app not found. Skipping timelogs."))
            return

        y, m = anchor_month.year, anchor_month.month
        num_days = (date(y, m + 1, 1) - timedelta(days=1)).day if m < 12 else 31

        for day in range(1, num_days + 1):
            d = date(y, m, day)
            # Skip weekends (Saturday=5, Sunday=6)
            if d.weekday() in [5, 6]:
                continue

            # Randomly decide employee's attendance for the day
            scenario = random.choices(
                population=['on_time', 'late', 'overtime', 'undertime', 'absent'],
                weights=[0.7, 0.1, 0.05, 0.05, 0.1],
                k=1
            )[0]
            
            ti, to = None, None
            if scenario == 'on_time':
                ti = time(9, 0)
                to = time(18, 0)
            elif scenario == 'late':
                ti = time(9, random.randint(6, 30)) # 6-30 mins late
                to = time(18, 0)
            elif scenario == 'overtime':
                ti = time(9, 0)
                to = time(18 + random.randint(1, 3), random.randint(0, 59)) # 1-3 hours OT
            elif scenario == 'undertime':
                ti = time(9, 0)
                to = time(17, random.randint(0, 45)) # up to 45 mins undertime
            elif scenario == 'absent':
                pass # ti and to remain None

            if ti and to:
                TimeLog.objects.update_or_create(employee=emp, date=d, defaults={'time_in': ti, 'time_out': to})
            else: # Handle absent case
                TimeLog.objects.update_or_create(employee=emp, date=d, defaults={'time_in': None, 'time_out': None})
