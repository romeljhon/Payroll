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

    - month: date (or 'YYYY-MM-DD' string)
    - cycle_type: 'MONTHLY' | 'SEMI_1' | 'SEMI_2'
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

    days_in_month = monthrange(month.year, month.month)[1]

    # Defensive bounds
    start_day = max(1, min(cycle.start_day, days_in_month))
    end_day = max(1, min(cycle.end_day, days_in_month))

    if start_day > end_day:
        raise ValueError(
            f"Invalid cutoff for {cycle_type}: start_day ({start_day}) > end_day ({end_day}) "
            f"for {month.strftime('%Y-%m')}"
        )

    start = date(month.year, month.month, start_day)
    end = date(month.year, month.month, end_day)
    return start, end
