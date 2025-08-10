# utils inside this views.py file (top-level)
from datetime import date
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
