from django.core.management.base import BaseCommand
from payroll.models import SalaryComponent


class Command(BaseCommand):
    help = 'Seed default salary components'

    def handle(self, *args, **kwargs):
        components = [
            # Core Earnings
            {"name": "Basic Pay", "code": "BASIC", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "13th Month Pay", "code": "13TH", "component_type": SalaryComponent.EARNING, "is_taxable": False},  # Tax-exempt up to ₱90k
            {"name": "Overtime", "code": "OT", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Rest Day OT", "code": "REST_OT", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Holiday Pay (Regular)", "code": "HOLIDAY_REG", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Holiday Pay (Special)", "code": "HOLIDAY_SPEC", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Night Differential", "code": "NIGHT_DIFF", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Allowances (e.g. Transpo)", "code": "ALLOWANCE", "component_type": SalaryComponent.EARNING, "is_taxable": False},

            # Deductions
            {"name": "Absence Deduction", "code": "ABSENCE", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "Late Deduction", "code": "LATE", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "Undertime Deduction", "code": "UNDERTIME", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "SSS Contribution", "code": "SSS", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "PhilHealth Contribution", "code": "PHILHEALTH", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "Pag-IBIG Contribution", "code": "PAGIBIG", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},
            {"name": "Withholding Tax", "code": "WTAX", "component_type": SalaryComponent.DEDUCTION, "is_taxable": False},

            # Optional
            {"name": "Bonus", "code": "BONUS", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Commission", "code": "COMM", "component_type": SalaryComponent.EARNING, "is_taxable": True},
            {"name": "Adjustment", "code": "ADJUSTMENT", "component_type": SalaryComponent.EARNING, "is_taxable": False},  # Could be earning or deduction
        ]

        created_count = 0
        for comp in components:
            obj, created = SalaryComponent.objects.get_or_create(code=comp['code'], defaults=comp)
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} salary components.'))
