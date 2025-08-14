from __future__ import annotations
from datetime import date
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.shortcuts import get_object_or_404
from django.db.models import Sum
import os

from employees.models import Employee
from payroll.models import SalaryComponent, PayrollRecord
from payroll.services.payslip_pdf import generate_payslip_pdf

class Command(BaseCommand):
    help = "Compute and save 13th month pay for an employee, and generate a simple PDF receipt."

    def add_arguments(self, parser):
        parser.add_argument("--employee-id", type=int, required=True)
        parser.add_argument("--year", type=int, required=True)
        parser.add_argument("--out", default=".", help="Output directory for PDF")

    def handle(self, *args, **opts):
        employee_id = opts["employee_id"]
        year = opts["year"]
        out_dir = os.path.abspath(opts["out"])
        os.makedirs(out_dir, exist_ok=True)

        employee = get_object_or_404(Employee, id=employee_id)
        basic_component = get_object_or_404(SalaryComponent, code="BASIC")
        thirteenth_component = get_object_or_404(SalaryComponent, code="13TH")

        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        total_basic = PayrollRecord.objects.filter(
            employee=employee,
            component=basic_component,
            month__range=(start_date, end_date),
            is_13th_month=False
        ).aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        thirteenth = (Decimal(total_basic) / Decimal("12")).quantize(Decimal("0.01"))

        # Upsert the 13th-month record (saved on December 1)
        record, created = PayrollRecord.objects.update_or_create(
            employee=employee,
            component=thirteenth_component,
            month=date(year, 12, 1),
            defaults={"amount": thirteenth, "is_13th_month": True, "payroll_cycle": "MONTHLY"},
        )

        # Build a tiny snapshot and PDF (simple one-line payslip)
        snapshot = {
            "employee_id": employee.id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "month": date(year, 12, 1),
            "payroll_cycle": "13TH_MONTH",
            "rows": [
                {"component": "13th Month Pay", "type": "EARNING", "amount": thirteenth},
            ],
            "totals": {"earnings": thirteenth, "deductions": Decimal("0.00"), "net_pay": thirteenth},
        }
        pdf = generate_payslip_pdf(snapshot, business_name=getattr(employee.branch.business, "name", "Payslip"))

        pdf_path = os.path.join(out_dir, f"payslip_{employee.id}_{year}_13th.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf)

        self.stdout.write(self.style.SUCCESS(
            f"13th month saved ({'created' if created else 'updated'}): {thirteenth}  →  {pdf_path}"
        ))
