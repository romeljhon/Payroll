from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal

from organization.models import Business, Branch
from employees.models import Employee, Position, WorkSchedulePolicy
from payroll.models import (
    SalaryComponent, SalaryStructure, PayrollCycle, PayrollPolicy
)
from timekeeping.models import TimeLog, Holiday


class Command(BaseCommand):
    help = 'Seeds test data for payroll dry run'

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding test data...")

        # 1. Business & Branch
        business, _ = Business.objects.get_or_create(name="Acme Corp")
        branch, _ = Branch.objects.get_or_create(name="Main Office", business=business)

        # 2. Payroll Policy
        PayrollPolicy.objects.update_or_create(
            business=business,
            defaults={
                'grace_minutes': 10,
                'standard_working_days': 22,
                'late_penalty_per_minute': Decimal("2.00"),
                'undertime_penalty_per_minute': Decimal("2.00"),
                'absent_penalty_per_day': Decimal("1000.00"),
                'ot_multiplier': Decimal("1.25"),
                'rest_day_multiplier': Decimal("1.3"),
                'holiday_regular_multiplier': Decimal("2.0"),
                'holiday_special_multiplier': Decimal("1.3"),
            }
        )

        # 3. Position
        dev, _ = Position.objects.get_or_create(name="Developer")

        # 4. Salary Components
        components = [
            ("BASIC", "EARNING"),
            ("OT", "EARNING"),
            ("LATE", "DEDUCTION"),
            ("UNDERTIME", "DEDUCTION"),
            ("ABSENT", "DEDUCTION"),
            ("13TH", "EARNING"),
            ("HOLIDAY_REGULAR", "EARNING"),
        ]
        for code, ctype in components:
            SalaryComponent.objects.get_or_create(
                code=code,
                name=code.replace("_", " ").title(),
                component_type=ctype
            )

        # 5. Salary Structure
        basic = SalaryComponent.objects.get(code="BASIC")
        SalaryStructure.objects.get_or_create(
            position=dev,
            component=basic,
            defaults={"amount": 30000.00, "is_percentage": False}
        )

        # 6. Work Schedule
        WorkSchedulePolicy.objects.update_or_create(
            branch=branch,
            defaults={
                "time_in": time(9, 0),
                "time_out": time(18, 0),
                "break_hours": Decimal("1.0"),
                "min_hours_required": Decimal("4.0"),
                "regular_work_days": "0,1,2,3,4",  # Mon–Fri
                "is_flexible": False,
            }
        )

        # 7. Payroll Cycle
        PayrollCycle.objects.update_or_create(
            business=business,
            cycle_type="SEMI_1",
            name="First Half (1–15)",
            start_day=1,
            end_day=15,
            defaults={"is_active": True}
        )

        PayrollCycle.objects.update_or_create(
            business=business,
            cycle_type="SEMI_2",
            name="Second Half (16–30)",
            start_day=16,
            end_day=30,
            defaults={"is_active": True}
        )

        # 8. Employee
        emp, _ = Employee.objects.get_or_create(
            first_name="Juan",
            last_name="Dela Cruz",
            email="juan@acme.test",
            branch=branch,
            position=dev,
            hire_date=date(2024, 1, 10),
        )

        # 9. Holiday
        Holiday.objects.get_or_create(
            name="Independence Day",
            date=date(2025, 6, 12),
            type="REGULAR"
        )

        # 10. TimeLogs for June 2025
        start_date = date(2025, 6, 1)
        for i in range(10):  # First 10 working days
            log_date = start_date + timedelta(days=i)
            if log_date.weekday() > 4:
                continue  # skip weekends

            is_late = i % 3 == 0
            is_ot = i % 2 == 0
            log = TimeLog.objects.create(
                employee=emp,
                date=log_date,
                time_in=time(9, 30 if is_late else 0),
                time_out=time(19, 0) if is_ot else time(18, 0),
                ot_hours=Decimal("1.00") if is_ot else Decimal("0.00"),
                late_minutes=30 if is_late else 0,
                undertime_minutes=0,
                is_rest_day=False,
                is_absent=False,
                holiday=Holiday.objects.filter(date=log_date).first()
            )

        self.stdout.write(self.style.SUCCESS("✅ Test payroll data seeded!"))
