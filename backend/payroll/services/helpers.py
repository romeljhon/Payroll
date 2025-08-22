from datetime import date
from decimal import Decimal
from django.utils.dateparse import parse_date
from payroll.models import SalaryStructure, SalaryComponent

def normalize_month(value) -> date:
    """Accepts date or 'YYYY-MM' / 'YYYY-MM-DD' and returns first day of that month."""
    if isinstance(value, date):
        return value.replace(day=1)
    d = parse_date(value)
    if d:
        return d.replace(day=1)
    year, month = map(int, str(value).split("-")[:2])
    return date(year, month, 1)

def compute_regular_monthly_gross(position, base_salary: Decimal) -> Decimal:
    """Sum BASIC + other EARNING components from SalaryStructure (excludes time-based items)."""
    total = Decimal("0.00")
    qs = SalaryStructure.objects.filter(position=position).select_related("component")
    for s in qs:
        amt = (Decimal(s.amount) / Decimal("100.00")) * base_salary if s.is_percentage else Decimal(s.amount)
        if s.component.component_type == SalaryComponent.EARNING:
            total += amt
    return total.quantize(Decimal("0.01"))
