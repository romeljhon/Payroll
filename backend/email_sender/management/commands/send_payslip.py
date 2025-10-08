
from django.core.management.base import BaseCommand
from django.shortcuts import get_object_or_404
from datetime import datetime

from employees.models import Employee
from email_sender.views import send_email
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf
from django.template.loader import render_to_string

class Command(BaseCommand):
    help = '''Generates a payslip for a specific employee and sends it via email.'''

    def add_arguments(self, parser):
        parser.add_argument('employee_id', type=int, help="The ID of the employee.")
        parser.add_argument('month', type=str, help="The first day of the month for the payslip (YYYY-MM-DD).")
        parser.add_argument('cycle', type=str, help="The payroll cycle (e.g., MONTHLY, SEMI_1, SEMI_2).")

    def handle(self, *args, **options):
        emp_id = options['employee_id']
        month_str = options['month']
        cycle = options['cycle']
        business_name = "KazuPay Solutions"

        self.stdout.write(f"Starting payslip generation for employee ID: {emp_id}...")

        try:
            # --- Fetch Data ---
            employee = get_object_or_404(Employee, id=emp_id)
            if not employee.email:
                self.stdout.write(self.style.ERROR(f"Employee {emp_id} has no email address."))
                return

            month = datetime.strptime(month_str, "%Y-%m-%d").date()
            period = month.strftime("%B %Y")

            self.stdout.write(f"Fetching payroll data for {period} ({cycle})...")
            snapshot = get_employee_payslip_snapshot(emp_id, month, cycle)
            if not snapshot["rows"]:
                self.stdout.write(self.style.WARNING("No payroll data found for this period."))
                return

            # --- Generate PDF ---
            self.stdout.write("Generating payslip PDF...")
            pdf_bytes = generate_payslip_pdf(snapshot, business_name=business_name)
            filename = f"Payslip-{employee.last_name}-{period.replace(' ', '-')}.pdf"

            # --- Build Email Content ---
            self.stdout.write("Building email content...")
            plain_text = (
                f"Hi {employee.first_name},\n\n"
                f"Attached is your payslip for {period} ({cycle}).\n\n"
                "Regards,\nPayroll"
            )
            html_body = render_to_string(
                "email_sender/payslip_email.html",
                {
                    "employee": employee,
                    "period": period,
                    "cycle": cycle,
                    "snapshot": snapshot,
                    "business_name": business_name,
                },
            )

            # --- Send Email ---
            self.stdout.write(f"Sending payslip to {employee.email}...")
            send_email(
                subject=f"Your Payslip for {period}",
                html_content=html_body,
                recipient_email=employee.email,
                recipient_name=f"{employee.first_name} {employee.last_name}",
                text_content=plain_text,
                attachment_content=pdf_bytes,
                attachment_name=filename,
            )

            self.stdout.write(self.style.SUCCESS("Successfully sent payslip email."))

        except Employee.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Employee with ID {emp_id} not found."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"An unexpected error occurred: {e}"))
