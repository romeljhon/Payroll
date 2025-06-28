from django.core.management.base import BaseCommand
from decimal import Decimal
from datetime import date

from payroll.models import (
    Position, SalaryComponent, SalaryStructure,
    PayrollCycle, PayrollRecord
)
from employees.models import Employee  # Replace with your actual app path
from organization.models import Business   # Adjust if different


class Command(BaseCommand):
    help = "Seed mock payroll data for a restaurant (Philippine context)"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding restaurant payroll test data...")

        # 1. Create Positions common in a restaurant
        position_names = [
            "Cashier",
            "Service Crew",
            "Cook",
            "Pizza Maker",
            "Store Supervisor",
            "Dishwasher",
            "Delivery Rider",
        ]
        for name in position_names:
            Position.objects.get_or_create(name=name)

        # 2. Create core Salary Components
        components = [
            ("Basic Pay", "BASIC", "EARNING", True),
            ("13th Month Pay", "13TH", "EARNING", False),
            ("SSS", "SSS", "DEDUCTION", False),
            ("PhilHealth", "PHILHEALTH", "DEDUCTION", False),
            ("Pag-IBIG", "PAGIBIG", "DEDUCTION", False),
            ("Withholding Tax", "WTAX", "DEDUCTION", False),
        ]
        for name, code, ctype, taxable in components:
            SalaryComponent.objects.get_or_create(
                code=code,
                defaults={"name": name, "component_type": ctype, "is_taxable": taxable}
            )

        # 3. Assign salary structures per position (using flat basic pay)
        salary_ranges = {
            "Cashier": 13000,
            "Service Crew": 12000,
            "Cook": 15000,
            "Pizza Maker": 14000,
            "Store Supervisor": 18000,
            "Dishwasher": 10000,
            "Delivery Rider": 12500,
        }

        basic = SalaryComponent.objects.get(code="BASIC")
        sss = SalaryComponent.objects.get(code="SSS")
        phic = SalaryComponent.objects.get(code="PHILHEALTH")
        pagibig = SalaryComponent.objects.get(code="PAGIBIG")
        wtax = SalaryComponent.objects.get(code="WTAX")

        for title, base_salary in salary_ranges.items():
            pos = Position.objects.get(name=title)
            SalaryStructure.objects.get_or_create(position=pos, component=basic, defaults={
                "amount": Decimal(base_salary),
                "is_percentage": False,
            })
            for comp, pct in [(sss, 4.5), (phic, 3.0), (pagibig, 2.0), (wtax, 5.0)]:
                SalaryStructure.objects.get_or_create(position=pos, component=comp, defaults={
                    "amount": Decimal(pct),
                    "is_percentage": True,
                })

        # 4. Create PayrollCycle
        business, _ = Business.objects.get_or_create(name="PizzaHub PH")  # Customize as needed
        cycle_data = [
            ("Monthly", "MONTHLY", 1, 31),
            ("1st Half", "SEMI_1", 1, 15),
            ("2nd Half", "SEMI_2", 16, 31),
        ]
        for name, cycle_type, start, end in cycle_data:
            PayrollCycle.objects.get_or_create(
                business=business,
                cycle_type=cycle_type,
                defaults={"name": name, "start_day": start, "end_day": end, "is_active": True}
            )

        # 5. Sample PayrollRecord (if employee exists)
        try:
            employee = Employee.objects.first()
            if not employee:
                self.stdout.write(self.style.WARNING("⚠️ No employee found. Skipping payroll record."))
            else:
                month = date(2025, 7, 1)
                SalaryComponentMap = {sc.code: sc for sc in SalaryComponent.objects.all()}
                PayrollRecord.objects.get_or_create(
                    employee=employee, month=month,
                    component=SalaryComponentMap["BASIC"], payroll_cycle="monthly",
                    defaults={"amount": Decimal("15000.00"), "is_13th_month": False}
                )
                PayrollRecord.objects.get_or_create(
                    employee=employee, month=month,
                    component=SalaryComponentMap["SSS"], payroll_cycle="monthly",
                    defaults={"amount": Decimal("675.00"), "is_13th_month": False}
                )
                PayrollRecord.objects.get_or_create(
                    employee=employee, month=month,
                    component=SalaryComponentMap["PHILHEALTH"], payroll_cycle="monthly",
                    defaults={"amount": Decimal("450.00"), "is_13th_month": False}
                )
                PayrollRecord.objects.get_or_create(
                    employee=employee, month=month,
                    component=SalaryComponentMap["PAGIBIG"], payroll_cycle="monthly",
                    defaults={"amount": Decimal("300.00"), "is_13th_month": False}
                )
                PayrollRecord.objects.get_or_create(
                    employee=employee, month=month,
                    component=SalaryComponentMap["WTAX"], payroll_cycle="monthly",
                    defaults={"amount": Decimal("750.00"), "is_13th_month": False}
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating PayrollRecord: {e}"))

        self.stdout.write(self.style.SUCCESS("✅ Restaurant payroll mock data seeded."))
