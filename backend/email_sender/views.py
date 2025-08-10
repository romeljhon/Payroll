# email_sender/views.py
import os
import re
from datetime import datetime
from tempfile import NamedTemporaryFile

from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from mailersend import EmailBuilder
from drf_spectacular.utils import extend_schema
from .mailersend_client import ms
from employees.models import Employee
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf


# --- Config (env-driven) -----------------------------------------------------

FROM_EMAIL = os.getenv("PAYROLL_FROM", "")
FROM_NAME = os.getenv("PAYROLL_FROM_NAME", "Payroll")

# very simple email sanity check (SDK will still validate strictly)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# --- Views -------------------------------------------------------------------
@extend_schema(tags=["Email"])
class SendSinglePayslipView(APIView):
    """
    POST /payroll/api/email/send-single-payslip/

    JSON body:
    {
      "employee_id": 1,
      "month": "2025-08-01",          # first day of the month (YYYY-MM-DD)
      "payroll_cycle": "SEMI_1",      # or "MONTHLY" / "SEMI_2"
      "period": "August 2025",        # optional (used for subject & text)
      "business_name": "Your Company" # optional (shown on PDF header & HTML)
    }

    Returns:
    {
      "to": "jane@example.com",
      "status_code": 202,
      "success": true,
      "id": "xxx",
      "snapshot_totals": { "earnings": "...", "deductions": "...", "net_pay": "..." }
    }
    """

    def post(self, request):
        # --- Validate FROM email early for clearer errors
        if not EMAIL_RE.match(FROM_EMAIL):
            return Response(
                {
                    "error": (
                        f"Invalid FROM email '{FROM_EMAIL}'. "
                        "Set PAYROLL_FROM to a full address like no-reply@yourdomain.com."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Read payload
        emp_id = request.data.get("employee_id")
        month_str = request.data.get("month")
        cycle = request.data.get("payroll_cycle")
        period = request.data.get("period")
        business_name = request.data.get("business_name")

        # Basic checks
        if not emp_id:
            return Response({"error": "employee_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not month_str:
            return Response({"error": "month is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if not cycle:
            return Response({"error": "payroll_cycle is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch employee
        employee = get_object_or_404(Employee, id=emp_id)
        if not employee.email:
            return Response({"error": "Employee has no email address."}, status=status.HTTP_400_BAD_REQUEST)

        # Parse month
        try:
            month = datetime.strptime(month_str, "%Y-%m-%d").date()
        except Exception:
            return Response(
                {"error": "Invalid month format. Use YYYY-MM-DD (first day of month)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Default period label if not provided
        if not period:
            period = month.strftime("%B %Y")

        # --- Read data from PayrollRecord (source of truth)
        snapshot = get_employee_payslip_snapshot(emp_id, month, cycle)
        if not snapshot["rows"]:
            return Response(
                {"error": "No PayrollRecord rows found for this employee/month/cycle."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- Generate PDF (in-memory) with ReportLab
        pdf_bytes = generate_payslip_pdf(snapshot, business_name=business_name)
        filename = f"Payslip-{employee.last_name}-{period.replace(' ', '-')}.pdf"

        # --- Build bodies: plain text + HTML (rendered from template)
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

        # --- MailerSend SDK v2 only supports attaching via file path → write temp file
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        try:
            email = (
                EmailBuilder()
                .from_email(FROM_EMAIL, FROM_NAME)
                .to_many([{"email": employee.email, "name": f"{employee.first_name} {employee.last_name}"}])
                .subject(f"Payslip - {period}")
                .text(plain_text)     # plaintext fallback
                .html(html_body)      # HTML version
                .attach_file(tmp_path)
                .build()
            )

            resp = ms.emails.send(email)

            return Response(
                {
                    "to": employee.email,
                    "status_code": resp.status_code,
                    "success": resp.success,
                    "id": getattr(resp, "id", None),
                    "snapshot_totals": snapshot.get("totals", {}),
                },
                status=status.HTTP_200_OK,
            )

        finally:
            # cleanup temp file
            try:
                os.remove(tmp_path)
            except Exception:
                pass
