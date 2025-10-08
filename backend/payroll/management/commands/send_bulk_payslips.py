
# payroll/management/commands/send_bulk_payslips.py
from __future__ import annotations

from datetime import date
from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from employees.models import Employee
from payroll.models import PayrollRun
from email_sender.views import send_email
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf
from django.template.loader import render_to_string


class Command(BaseCommand):
    help = "Sends payslips in bulk to all employees in a given payroll run."

    def add_arguments(self, parser: CommandParser):
        parser.add_argument("month", type=str, help="The payroll month in YYYY-MM format.")
        parser.add_argument("cycle_type", type=str, help="The payroll cycle type (e.g., MONTHLY, SEMI_1).")

    def handle(self, *args, **options):
        month_str = options["month"]
        cycle_type = options["cycle_type"].upper()

        try:
            target_month = date.fromisoformat(f"{month_str}-01")
        except ValueError:
            self.stdout.write(self.style.ERROR("Invalid month format. Please use YYYY-MM."))
            return

        self.stdout.write(self.style.NOTICE(f"Starting bulk payslip dispatch for {target_month.strftime('%B %Y')} ({cycle_type})..."))

        try:
            # Find the specific payroll run
            run = PayrollRun.objects.get(month=target_month, payroll_cycle__cycle_type=cycle_type)
            business = run.business
        except PayrollRun.DoesNotExist:
            self.stdout.write(self.style.ERROR("No matching payroll run found for the specified month and cycle."))
            return
        except PayrollRun.MultipleObjectsReturned:
            self.stdout.write(self.style.ERROR("Multiple payroll runs found. Please ensure your criteria are specific enough."))
            return

        # Get all unique employees from this run's records
        employees_in_run = Employee.objects.filter(payrollrecord__run=run).distinct()

        if not employees_in_run:
            self.stdout.write(self.style.WARNING("No employees found in this payroll run."))
            return

        self.stdout.write(f"Found {len(employees_in_run)} employee(s) to process.")

        success_count = 0
        failure_count = 0

        for emp in employees_in_run:
            self.stdout.write(f"  - Processing payslip for: {emp.first_name} {emp.last_name} ({emp.email})...")
            try:
                with transaction.atomic():
                    snapshot = get_employee_payslip_snapshot(emp.id, target_month, cycle_type)
                    if not snapshot or not snapshot.get("rows"):
                        self.stdout.write(self.style.WARNING(f"    -> No payslip data for {emp.email}, skipping."))
                        failure_count += 1
                        continue

                    pdf_bytes = generate_payslip_pdf(snapshot, business_name=business.name)
                    filename = f"Payslip-{emp.last_name}-{target_month.strftime('%Y-%m')}.pdf"

                    html_body = render_to_string(
                        "email_sender/payslip_email.html",
                        {
                            "employee": emp,
                            "period": target_month.strftime('%B %Y'),
                            "cycle": cycle_type,
                            "snapshot": snapshot,
                            "business_name": business.name,
                        },
                    )

                    send_email(
                        subject=f"Your Payslip for {target_month.strftime('%B %Y')}",
                        html_content=html_body,
                        recipient_email=emp.email,
                        recipient_name=f"{emp.first_name} {emp.last_name}",
                        attachment_content=pdf_bytes,
                        attachment_name=filename,
                    )

                self.stdout.write(self.style.SUCCESS(f"    -> Successfully sent to {emp.email}."))
                success_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"    -> FAILED to send to {emp.email}: {e}"))
                failure_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nBulk dispatch complete!"))
        self.stdout.write(f"  Successful sends: {success_count}")
        self.stdout.write(f"  Failed sends    : {failure_count}")

