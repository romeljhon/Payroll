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

    # Days in the anchor (this) month
    days_in_month = monthrange(month.year, month.month)[1]

    # Clamp start to this month
    start_day = max(1, min(int(cycle.start_day), days_in_month))
    start = date(month.year, month.month, start_day)

    if int(cycle.end_day) >= int(cycle.start_day):
        # Same-month cutoff -> clamp to THIS month  ✅ FIX: only clamp here for same-month
        end_day_this = max(1, min(int(cycle.end_day), days_in_month))
        end = date(month.year, month.month, end_day_this)
    else:
        # Wrap-around cutoff -> clamp to NEXT month  ✅ FIX: clamp using next month's length
        next_year = month.year + 1 if month.month == 12 else month.year
        next_month = 1 if month.month == 12 else month.month + 1
        next_month_days = monthrange(next_year, next_month)[1]
        end_day_next = max(1, min(int(cycle.end_day), next_month_days))
        end = date(next_year, next_month, end_day_next)

    return start, end
