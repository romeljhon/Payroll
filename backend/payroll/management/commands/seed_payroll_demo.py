# payroll/management/commands/seed_payroll_demo.py
from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from organization.models import Business, Branch
from positions.models import Position
from employees.models import Employee
from timekeeping.models import TimeLog, Holiday
from payroll.models import (
    PayrollCycle, SalaryComponent, SalaryStructure
)

class Command(BaseCommand):
    help = "Seed demo business/branch/employee/components/structures/cycles/timelogs into CURRENT database."

    @transaction.atomic
    def handle(self, *args, **options):
        # Business & Branch
        biz, _ = Business.objects.get_or_create(name="Demo Biz", defaults={"tax_id": "TAX-123"})
        branch, _ = Branch.objects.get_or_create(business=biz, name="HQ")

        # Position
        pos, _ = Position.objects.get_or_create(name="Developer")

        # Employee
        emp, _ = Employee.objects.get_or_create(
            first_name="Jane", last_name="Doe",
            defaults={
                "email": "jane@example.com",
                "phone": "09123456789",
                "branch": branch,
                "position": pos,
                "hire_date": date(2024, 1, 15),
                "active": True
            }
        )
        # Ensure relations set if get_or_create found existing without them
        if not emp.branch:
            emp.branch = branch
        if not emp.position:
            emp.position = pos
        emp.save()

        # Payroll cycles
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="MONTHLY",
            defaults={"name": "Monthly 1-30", "start_day": 1, "end_day": 30, "is_active": True}
        )
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="SEMI_1",
            defaults={"name": "1st Half", "start_day": 1, "end_day": 15, "is_active": True}
        )
        PayrollCycle.objects.update_or_create(
            business=biz, cycle_type="SEMI_2",
            defaults={"name": "2nd Half", "start_day": 16, "end_day": 30, "is_active": True}
        )

        # Salary Components
        comps = {
            "BASIC": ("Basic", "EARNING"),
            "OT": ("Overtime", "EARNING"),
            "LATE": ("Late", "DEDUCTION"),
            "UNDERTIME": ("Undertime", "DEDUCTION"),
            "ABSENT": ("Absence", "DEDUCTION"),
            "HOLIDAY_REGULAR": ("Regular Holiday OT", "EARNING"),
            "HOLIDAY_SPECIAL": ("Special Holiday OT", "EARNING"),
            "13TH": ("13th Month", "EARNING"),
        }
        comp_objs = {}
        for code, (name, ctype) in comps.items():
            comp, _ = SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": ctype})
            # If created earlier without code, ensure fields
            comp.name = name
            comp.component_type = ctype
            comp.save()
            comp_objs[code] = comp

        # Salary Structure: Basic 30000 fixed for Developer
        SalaryStructure.objects.update_or_create(
            position=pos, component=comp_objs["BASIC"],
            defaults={"amount": Decimal("30000.00"), "is_percentage": False}
        )

        # Holidays (for TimeLogs)
        holiday_reg, _ = Holiday.objects.get_or_create(
            name="Independence Day",
            date=date(2025, 6, 12),
            defaults={"type": Holiday.REGULAR, "multiplier": Decimal("2.00"), "is_national": True}
        )
        holiday_spec, _ = Holiday.objects.get_or_create(
            name="Ninoy Day",
            date=date(2025, 8, 21),
            defaults={"type": Holiday.SPECIAL, "multiplier": Decimal("1.30"), "is_national": True}
        )

        # TimeLogs within SEMI_1 August cutoff (1–15)
        TimeLog.objects.update_or_create(
            employee=emp, date=date(2025, 8, 5),
            defaults=dict(time_in=time(9, 0), time_out=time(18, 0),
                          ot_hours=Decimal("2.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=emp, date=date(2025, 8, 8),
            defaults=dict(time_in=time(9, 30), time_out=time(17, 0),
                          ot_hours=Decimal("0.0"), late_minutes=30, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=None)
        )
        TimeLog.objects.update_or_create(
            employee=emp, date=date(2025, 8, 12),
            defaults=dict(time_in=None, time_out=None,
                          ot_hours=Decimal("0.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=True, holiday=None)
        )
        # Holiday OT within 1–15 (use a made-up holiday on Aug 15 if needed)
        hol_aug15, _ = Holiday.objects.get_or_create(
            name="Regular Holiday Test",
            date=date(2025, 8, 15),
            defaults={"type": Holiday.REGULAR, "multiplier": Decimal("2.00")}
        )
        TimeLog.objects.update_or_create(
            employee=emp, date=date(2025, 8, 15),
            defaults=dict(time_in=time(9, 0), time_out=time(19, 0),
                          ot_hours=Decimal("3.0"), late_minutes=0, undertime_minutes=0,
                          is_rest_day=False, is_absent=False, holiday=hol_aug15)
        )

        self.stdout.write(self.style.SUCCESS("✅ Seeded demo data successfully."))
        self.stdout.write(f"Business ID: {biz.id}, Branch ID: {branch.id}, Position ID: {pos.id}, Employee ID: {emp.id}")
