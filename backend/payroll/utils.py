# utils inside this views.py file (top-level)
from datetime import date
from calendar import monthrange
from django.utils.dateparse import parse_date

def normalize_month(value) -> date:
    """
    Accepts date or string 'YYYY-MM' / 'YYYY-MM-DD' and returns first day of that month (date).
    """
    if isinstance(value, date):
        return value.replace(day=1)
    if isinstance(value, str):
        # Try 'YYYY-MM-DD' then 'YYYY-MM'
        d = parse_date(value)
        if d:
            return d.replace(day=1)
        try:
            year, month = map(int, value.split("-")[:2])
            return date(year, month, 1)
        except Exception:
            raise ValueError("month must be a date or a 'YYYY-MM' / 'YYYY-MM-DD' string")
    raise ValueError("month must be a date or a string")



def _date_in_cycle(start_day: int, end_day: int, target: date) -> bool:
    """
    True if target day-of-month falls within [start_day..end_day] (inclusive),
    allowing wrap-around (e.g., 25..10 covers 25-31 and 1-10).
    """
    d = target.day
    if start_day <= end_day:
        return start_day <= d <= end_day
    return d >= start_day or d <= end_day  # wrap-around

def _period_bounds_for_month(year: int, month: int, start_day: int, end_day: int):
    """
    Compute the concrete start/end dates for a cycle within a target calendar month.
    Works with wrap-around. Returns (start_date, end_date).
    The start may be in the previous month if wrap-around and start_day > end_day.
    """
    last_day = monthrange(year, month)[1]
    # clamp to month length for safety
    sd = min(start_day, last_day)
    ed = min(end_day, last_day)

    # If no wrap-around (e.g., 1..15), the period is within the same month.
    if start_day <= end_day:
        return date(year, month, sd), date(year, month, ed)

    # Wrap-around (e.g., 25..10): start is in previous month, end in current.
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1
    prev_last = monthrange(prev_year, prev_month)[1]
    sd_prev = min(start_day, prev_last)

    return date(prev_year, prev_month, sd_prev), date(year, month, ed)