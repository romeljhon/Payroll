from datetime import date
from decimal import Decimal
from django.utils.dateparse import parse_date
from payroll.models import SalaryStructure, SalaryComponent

def normalize_month(value) -> date:
    """
    Accepts a date or 'YYYY-MM' / 'YYYY-MM-DD' and returns the first day of that month.
    Raises ValueError on invalid inputs.
    """
    if isinstance(value, date):
        return value.replace(day=1)

    s = str(value).strip()
    # Try full date first (YYYY-MM-DD)
    d = parse_date(s)
    if d:
        return d.replace(day=1)

    # Try YYYY-MM by appending '-01'
    d = parse_date(f"{s}-01")
    if d:
        return d.replace(day=1)

    # Final fallback with explicit parsing + clear error
    try:
        year, month = map(int, s.split("-")[:2])
        if not (1 <= month <= 12):
            raise ValueError
        return date(year, month, 1)
    except Exception:
        raise ValueError("Invalid month format. Use 'YYYY-MM' or 'YYYY-MM-DD'.")

def compute_regular_monthly_gross(position, base_salary: Decimal) -> Decimal:
    """Sum BASIC + other EARNING components from SalaryStructure (excludes time-based items)."""
    total = Decimal("0.00")
    qs = SalaryStructure.objects.filter(position=position).select_related("component")
    for s in qs:
        amt = (Decimal(s.amount) / Decimal("100.00")) * base_salary if s.is_percentage else Decimal(s.amount)
        if s.component.component_type == SalaryComponent.EARNING:
            total += amt
    return total.quantize(Decimal("0.01"))
