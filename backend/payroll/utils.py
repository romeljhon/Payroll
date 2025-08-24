# utils inside this views.py file (top-level)
from datetime import date
from calendar import monthrange


def _period_bounds_for_month(year: int, month: int, start_day: int, end_day: int) -> tuple[date, date]:
    """
    For a given (year, month) and cycle days, return the concrete inclusive
    [start, end] dates anchored in that month.
    - Supports wrap-around cutoffs (e.g., 26→10).
    - Clamps days to month length.
    """
    dim = monthrange(year, month)[1]
    s_day = max(1, min(int(start_day), dim))
    start = date(year, month, s_day)

    if int(end_day) >= int(start_day):
        # same-month end
        e_day = max(1, min(int(end_day), dim))
        end = date(year, month, e_day)
    else:
        # wraps to next month
        if month == 12:
            ny, nm = year + 1, 1
        else:
            ny, nm = year, month + 1
        dim_next = monthrange(ny, nm)[1]
        e_day = max(1, min(int(end_day), dim_next))
        end = date(ny, nm, e_day)

    return start, end


def _date_in_cycle(start_day: int, end_day: int, target: date) -> bool:
    """
    Does `target` fall within *some* period of this cycle?
    We must check:
      1) the period anchored in the target's month, and
      2) the period anchored in the *previous* month (to catch wrap-around
         cycles that end early this month, e.g., 26→10).
    """
    # Anchor to target's month
    s1, e1 = _period_bounds_for_month(target.year, target.month, start_day, end_day)
    if s1 <= target <= e1:
        return True

    # Anchor to previous month
    if target.month == 1:
        py, pm = target.year - 1, 12
    else:
        py, pm = target.year, target.month - 1
    s2, e2 = _period_bounds_for_month(py, pm, start_day, end_day)
    return s2 <= target <= e2