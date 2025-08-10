# payroll/services/payroll_cycles.py
from __future__ import annotations

import logging
from calendar import monthrange
from datetime import date
from typing import Tuple

from django.utils.dateparse import parse_date

from payroll.models import PayrollCycle

logger = logging.getLogger(__name__)

def get_dynamic_cutoff(month: date | str, cycle_type: str, business) -> Tuple[date, date]:
    """
    Return (start_date, end_date) for a given month, cycle_type, and business.

    - month: date or 'YYYY-MM-DD' string. The *start* date will be in this month.
      If the cycle wraps (e.g., 25→10), end date will be in the *next* month.
    - cycle_type: e.g. 'MONTHLY' | 'SEMI_1' | 'SEMI_2'
    - business: Business instance (must have .id)

    Examples (wrap-aware):
      - start_day=25, end_day=10, month=2025-01-01  => (2025-01-25, 2025-02-10)
      - start_day=10, end_day=25, month=2025-01-01  => (2025-01-10, 2025-01-25)
    """
    if isinstance(month, str):
        parsed = parse_date(month)
        if not parsed:
            raise ValueError("month must be a date or 'YYYY-MM-DD' string")
        month = parsed

    if business is None or not getattr(business, "id", None):
        raise ValueError("business is required and must be a valid instance")

    cycle_type = cycle_type.strip().upper()
    logger.debug("Searching cycle_type='%s' for business ID=%s", cycle_type, business.id)

    try:
        cycle = PayrollCycle.objects.get(
            business=business,
            cycle_type=cycle_type,
            is_active=True,
        )
    except PayrollCycle.DoesNotExist as e:
        available = list(
            PayrollCycle.objects.filter(business=business).values("name", "cycle_type", "is_active")
        )
        logger.error("Matching cycle not found. Available cycles for business %s: %s", business.id, available)
        raise e

    # Clamp start/end days to actual days in that month
    days_in_month = monthrange(month.year, month.month)[1]
    start_day = max(1, min(int(cycle.start_day), days_in_month))
    end_day = max(1, min(int(cycle.end_day), days_in_month))

    # Build start in the given month
    start = date(month.year, month.month, start_day)

    if start_day <= end_day:
        # Same-month cutoff (e.g., 10–25)
        end = date(month.year, month.month, end_day)
    else:
        # Wrap-around cutoff (e.g., 25–10): end is in the next month
        next_year = month.year + 1 if month.month == 12 else month.year
        next_month = 1 if month.month == 12 else month.month + 1
        next_month_days = monthrange(next_year, next_month)[1]
        end = date(next_year, next_month, max(1, min(end_day, next_month_days)))

    return start, end
