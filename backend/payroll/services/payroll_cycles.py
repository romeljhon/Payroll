from calendar import monthrange
from datetime import date
from payroll.models import PayrollCycle

def get_dynamic_cutoff(month: date, cycle_type: str, business):
    from payroll.models import PayrollCycle
    from calendar import monthrange
    from datetime import date

    cycle_type = cycle_type.strip().upper()
    print(f"[DEBUG] Searching cycle_type='{cycle_type}' for business ID={business.id}")

    try:
        cycle = PayrollCycle.objects.get(
            business=business,
            cycle_type=cycle_type,
            is_active=True
        )
    except PayrollCycle.DoesNotExist:
        # Log what's available
        print("[ERROR] Matching cycle not found.")
        available = PayrollCycle.objects.filter(business=business).values("name", "cycle_type", "is_active")
        print(f"[INFO] Available cycles for business {business.id}: {list(available)}")
        raise

    start_day = cycle.start_day
    end_day = min(cycle.end_day, monthrange(month.year, month.month)[1])

    return date(month.year, month.month, start_day), date(month.year, month.month, end_day)

