
# payroll/management/commands/seed_zandro_payroll.py
from __future__ import annotations

from datetime import date, time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from organization.models import Business, Branch
from positions.models import Position
from employees.models import Employee
from payroll.models import (
    PayrollCycle, PayrollPolicy, SalaryComponent, SalaryRate
)
from payroll.services.payroll_engine import generate_batch_payroll
from email_sender.views import send_email
from payroll.services.payslip_snapshot import get_employee_payslip_snapshot
from payroll.services.payslip_pdf import generate_payslip_pdf
from django.template.loader import render_to_string

# Import TimeLog safely
try:
    from timekeeping.models import TimeLog
except ImportError:
    TimeLog = None

class Command(BaseCommand):
    help = "Seed a new employee (Zandro Narvaza), create timelogs, and send him a payslip."

    def _seed_timelogs(self, emp: Employee, anchor_month: date):
        """Seeds sample timelogs for an employee for a given month."""
        if not TimeLog:
            self.stdout.write(self.style.WARNING("Timekeeping app not available; skipping timelogs."))
            return

        self.stdout.write(f"Seeding timelogs for {emp.first_name}...")
        y, m = anchor_month.year, anchor_month.month

        # Define logs: date, time_in, time_out
        logs = [
            (date(y, m, 1), time(9, 0), time(18, 0)),    # On-time
            (date(y, m, 2), time(9, 5), time(18, 0)),    # On-time (within grace)
            (date(y, m, 3), time(9, 15), time(18, 1)),   # Late
            (date(y, m, 4), time(8, 58), time(19, 3)),   # Overtime
            (date(y, m, 5), time(9, 1), time(17, 0)),    # Undertime
            (date(y, m, 8), None, None),                # Absent
        ]

        for d, ti, to in logs:
            defaults = {'time_in': ti, 'time_out': to} if ti and to else {}
            TimeLog.objects.update_or_create(employee=emp, date=d, defaults=defaults)

        self.stdout.write(self.style.SUCCESS("Timelogs created."))

    def handle(self, *args, **options):
        with transaction.atomic():
            # --- 1. Foundational Data (ensure it exists) ---
            self.stdout.write("Ensuring foundational data exists...")
            biz, _ = Business.objects.get_or_create(name="Acme Corp", defaults={"tax_id": "ACME-123"})
            br, _ = Branch.objects.get_or_create(business=biz, name="HQ")
            pos, _ = Position.objects.get_or_create(name="Solution Architect")
            PayrollPolicy.objects.get_or_create(business=biz, defaults=dict(grace_minutes=5, standard_working_days=Decimal("22.00"), late_penalty_per_minute=Decimal("2.00"), undertime_penalty_per_minute=Decimal("2.00"), absent_penalty_per_day=Decimal("1000.00"), ot_multiplier=Decimal("1.25")))
            PayrollCycle.objects.get_or_create(business=biz, cycle_type="MONTHLY", defaults={"name": "Monthly", "start_day": 1, "end_day": 31, "is_active": True})
            for code, name, ctype in [("BASIC", "Basic Pay", "EARNING"), ("ALLOW", "Allowance", "EARNING"), ("LATE", "Late Penalty", "DEDUCTION"), ("UNDERTIME", "Undertime Penalty", "DEDUCTION"), ("ABSENT", "Absences", "DEDUCTION"), ("OT", "Overtime Pay", "EARNING")]:
                SalaryComponent.objects.get_or_create(code=code, defaults={"name": name, "component_type": ctype})

            # --- 2. Create Employee ---
            self.stdout.write("Creating employee: Zandro Narvaza...")
            emp, created = Employee.objects.get_or_create(email="zandro.narvaza@gmail.com", defaults=dict(branch=br, first_name="Zandro", last_name="Narvaza", position=pos, hire_date=date(2024, 2, 1), active=True))
            if not created:
                self.stdout.write(self.style.WARNING("Zandro Narvaza already exists."))

            # --- 3. Assign Salary ---
            self.stdout.write("Assigning salary...")
            SalaryRate.objects.get_or_create(employee=emp, start_date=date(2025, 1, 1), defaults={"amount": Decimal("50000.00")})

            # --- 4. Seed Timelogs ---
            target_month = date(2025, 9, 1)
            self._seed_timelogs(emp, target_month)

            # --- 5. Run Payroll ---
            self.stdout.write(f"Generating payroll for {target_month.strftime('%B %Y')}...")
            generate_batch_payroll(month=target_month, cycle_type="MONTHLY", employee_ids=[emp.id])

            # --- 6. Generate and Send Payslip ---
            self.stdout.write("Generating payslip snapshot...")
            snapshot = get_employee_payslip_snapshot(emp.id, target_month, "MONTHLY")

            if not snapshot or not snapshot.get("rows"):
                self.stdout.write(self.style.ERROR("Payroll data is empty! Cannot generate or send payslip."))
                return

            self.stdout.write("Generating payslip PDF...")
            pdf_bytes = generate_payslip_pdf(snapshot, business_name=biz.name)
            filename = f"Payslip-{emp.last_name}-{target_month.strftime('%Y-%m')}.pdf"

            self.stdout.write("Building and sending email...")
            html_body = render_to_string("email_sender/payslip_email.html", {"employee": emp, "period": target_month.strftime('%B %Y'), "cycle": "MONTHLY", "snapshot": snapshot, "business_name": biz.name})

            send_email(
                subject=f"Your Payslip for {target_month.strftime('%B %Y')}",
                html_content=html_body,
                recipient_email=emp.email,
                recipient_name=f"{emp.first_name} {emp.last_name}",
                attachment_content=pdf_bytes,
                attachment_name=filename,
            )

            self.stdout.write(self.style.SUCCESS(f"Successfully created and sent payslip to {emp.email}."))
