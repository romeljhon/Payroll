
# email_sender/views.py
import os
import re
import base64
from datetime import datetime

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from .brevo_client import api_instance

from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema
from employees.models import Employee
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf
from .models import EmailSentLog # Import the new model

# --- Config (env-driven) -----------------------------------------------------

FROM_EMAIL = os.getenv("PAYROLL_FROM", "")
FROM_NAME = os.getenv("PAYROLL_FROM_NAME", "Payroll")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# --- Core Email Sending Logic -----------------------------------------------

def send_email(subject, html_content, recipient_email, recipient_name=None, text_content=None, attachment_content=None, attachment_name=None):
    """
    Sends an email using the Brevo API, with rate limiting.
    """
    # Check monthly email limit
    with transaction.atomic():
        log = EmailSentLog.get_current_log()
        if log.is_limit_reached():
            raise Exception(f"Monthly email limit of {log.limit} reached.")

        if not EMAIL_RE.match(FROM_EMAIL):
            raise ValueError(
                f"Invalid FROM email '{FROM_EMAIL}'. "
                "Set PAYROLL_FROM to a full address like no-reply@yourdomain.com."
            )

        if not recipient_name:
            recipient_name = recipient_email

        try:
            # Build the email
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[sib_api_v3_sdk.SendSmtpEmailTo(email=recipient_email, name=recipient_name)],
                sender=sib_api_v3_sdk.SendSmtpEmailSender(email=FROM_EMAIL, name=FROM_NAME),
                subject=subject,
                html_content=html_content,
                text_content=text_content,
            )

            # Add attachment if provided
            if attachment_content and attachment_name:
                encoded_content = base64.b64encode(attachment_content).decode('utf-8')
                send_smtp_email.attachment = [
                    sib_api_v3_sdk.SendSmtpEmailAttachment(content=encoded_content, name=attachment_name)
                ]

            # Send the email
            api_response = api_instance.send_transac_email(send_smtp_email)
            
            # Increment count on success
            log.increment_count()

            return api_response

        except ApiException as e:
            # Re-raise the exception to be handled by the caller
            raise e


# --- Views -------------------------------------------------------------------
@extend_schema(tags=["Email"])
class SendSinglePayslipView(APIView):
    def post(self, request):
        emp_id = request.data.get("employee_id")
        month_str = request.data.get("month")
        cycle = request.data.get("payroll_cycle")
        period = request.data.get("period")
        business_name = request.data.get("business_name")

        if not emp_id:
            return Response({"error": "employee_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not month_str:
            return Response({"error": "month is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if not cycle:
            return Response({"error": "payroll_cycle is required."}, status=status.HTTP_400_BAD_REQUEST)

        employee = get_object_or_404(Employee, id=emp_id)
        if not employee.email:
            return Response({"error": "Employee has no email address."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month = datetime.strptime(month_str, "%Y-%m-%d").date()
        except Exception:
            return Response(
                {"error": "Invalid month format. Use YYYY-MM-DD (first day of month)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not period:
            period = month.strftime("%B %Y")

        snapshot = get_employee_payslip_snapshot(emp_id, month, cycle)
        if not snapshot["rows"]:
            return Response(
                {"error": "No PayrollRecord rows found for this employee/month/cycle."},
                status=status.HTTP_404_NOT_FOUND,
            )

        pdf_bytes = generate_payslip_pdf(snapshot, business_name=business_name)
        filename = f"Payslip-{employee.last_name}-{period.replace(' ', '-')}.pdf"

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
        
        try:
            api_response = send_email(
                subject=f"Payslip - {period}",
                html_content=html_body,
                recipient_email=employee.email,
                recipient_name=f"{employee.first_name} {employee.last_name}",
                text_content=plain_text,
                attachment_content=pdf_bytes,
                attachment_name=filename,
            )
            return Response(
                {
                    "to": employee.email,
                    "success": True,
                    "id": api_response.message_id,
                    "snapshot_totals": snapshot.get("totals", {}),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

@extend_schema(tags=["Email"])
class SendBulkPayslipView(APIView):
    def post(self, request):
        business_id = request.data.get("business_id")
        branch_id = request.data.get("branch_id")
        month_str = request.data.get("month")
        cycle = request.data.get("payroll_cycle")
        period = request.data.get("period")
        business_name = request.data.get("business_name")

        if not business_id and not branch_id:
            return Response({"error": "Either business_id or branch_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not month_str:
            return Response({"error": "month is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if not cycle:
            return Response({"error": "payroll_cycle is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month = datetime.strptime(month_str, "%Y-%m-%d").date()
        except Exception:
            return Response(
                {"error": "Invalid month format. Use YYYY-MM-DD (first day of month)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not period:
            period = month.strftime("%B %Y")

        employees = Employee.objects.all()
        if branch_id:
            employees = employees.filter(branch_id=branch_id)
        elif business_id:
            employees = employees.filter(branch__business_id=business_id)

        results = []
        for employee in employees:
            if not employee.email:
                results.append({"employee_id": employee.id, "success": False, "error": "No email address."})
                continue

            snapshot = get_employee_payslip_snapshot(employee.id, month, cycle)
            if not snapshot["rows"]:
                results.append({"employee_id": employee.id, "success": False, "error": "No payroll data."})
                continue

            pdf_bytes = generate_payslip_pdf(snapshot, business_name=business_name)
            filename = f"Payslip-{employee.last_name}-{period.replace(' ', '-')}.pdf"
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

            try:
                api_response = send_email(
                    subject=f"Payslip - {period}",
                    html_content=html_body,
                    recipient_email=employee.email,
                    recipient_name=f"{employee.first_name} {employee.last_name}",
                    text_content=plain_text,
                    attachment_content=pdf_bytes,
                    attachment_name=filename,
                )
                results.append({"employee_id": employee.id, "success": True, "message_id": api_response.message_id})
            except Exception as e:
                results.append({"employee_id": employee.id, "success": False, "error": str(e)})
        
        return Response(results, status=status.HTTP_200_OK)
