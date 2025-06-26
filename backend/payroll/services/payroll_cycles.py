from calendar import monthrange
from datetime import date
from payroll.models import PayrollCycle

def get_dynamic_cutoff(month: date, cycle_type: str, business):
    """
    Returns cutoff start and end dates based on configured PayrollCycle.
    """
    cycle = PayrollCycle.objects.get(
        business=business,
        cycle_type=cycle_type,
        is_active=True
    )

    start_day = cycle.start_day
    end_day = cycle.end_day

    last_day = monthrange(month.year, month.month)[1]
    end_day = min(end_day, last_day)

    return date(month.year, month.month, start_day), date(month.year, month.month, end_day)
