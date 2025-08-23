# payroll/services/salary_rates.py
from datetime import date
from decimal import Decimal
from django.db import models

from payroll.models import SalaryRate

def get_salary_for_month(employee, target_month: date) -> Decimal:
    """
    Returns the employee's active SalaryRate amount for the given month.
    - start_date <= target_month <= end_date (or end_date is null)
    Raises ValueError if no rate is found.
    """
    rate = (
        SalaryRate.objects
        .filter(employee=employee, start_date__lte=target_month)
        .filter(models.Q(end_date__gte=target_month) | models.Q(end_date__isnull=True))
        .order_by("-start_date")
        .first()
    )
    if not rate:
        raise ValueError(f"No salary rate found for {employee} on {target_month}")
    return rate.amount
