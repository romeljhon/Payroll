# payroll/services/time_analysis.py
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from timekeeping.models import TimeLog
from payroll.models import SalaryComponent

def _to_hours(delta) -> Decimal:
    return (Decimal(delta.total_seconds()) / Decimal(3600)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _to_minutes(delta) -> Decimal:
    return (Decimal(delta.total_seconds()) / Decimal(60)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def analyze_timelog(timelog: TimeLog, schedule) -> list[dict]:
    """
    Produce time-based codes from a single timelog against a branch schedule.
    Returns a list of dicts like {"code": "LATE", "minutes": Decimal(...)}.
    """
    # Guard: missing punches
    if not timelog.time_in or not timelog.time_out:
        return [{"code": "ABSENT", "hours": Decimal(schedule.min_hours_required)}]

    # Policy overrides / schedule params
    policy = getattr(timelog.employee.branch.business, "payroll_policy", None)
    grace = schedule.grace_minutes if schedule.grace_minutes else (getattr(policy, "grace_minutes", 0) or 0)

    expected_in = schedule.time_in
    expected_out = schedule.time_out
    min_hours = Decimal(schedule.min_hours_required)
    break_hours = Decimal(schedule.break_hours)

    work_days = schedule.get_work_days()
    weekday = timelog.date.weekday()
    is_rest_day = weekday not in work_days

    # Build datetimes; handle overnight shifts (out < in)
    dt_in = datetime.combine(timelog.date, timelog.time_in)
    dt_out = datetime.combine(timelog.date, timelog.time_out)
    if dt_out <= dt_in:
        dt_out += timedelta(days=1)

    hours_worked = _to_hours(dt_out - dt_in) - break_hours

    components: list[dict] = []

    # LATE
    exp_in_dt = datetime.combine(timelog.date, expected_in)
    if dt_in > exp_in_dt:
        late_delta = dt_in - exp_in_dt
        late_minutes = _to_minutes(late_delta)
        if late_minutes > Decimal(grace):
            components.append({"code": "LATE", "minutes": late_minutes})

    # UNDERTIME
    exp_out_dt = datetime.combine(timelog.date, expected_out)
    if exp_out_dt <= exp_in_dt:
        exp_out_dt += timedelta(days=1)  # expected overnight
    if dt_out < exp_out_dt:
        undertime_delta = exp_out_dt - dt_out
        undertime_minutes = _to_minutes(undertime_delta)
        components.append({"code": "UNDERTIME", "minutes": undertime_minutes})

    # ABSENT (below minimum required hours)
    if hours_worked < min_hours:
        components.append({"code": "ABSENT", "hours": (min_hours - hours_worked).quantize(Decimal("0.01"))})

    # OVERTIME (compute expected day length rather than fixed 8 hours)
    expected_hours = _to_hours(exp_out_dt - exp_in_dt) - break_hours
    if not is_rest_day and hours_worked > expected_hours:
        components.append({"code": "OT", "hours": (hours_worked - expected_hours).quantize(Decimal("0.01"))})

    # REST DAY OT
    if is_rest_day and hours_worked > 0:
        components.append({"code": "REST_OT", "hours": hours_worked.quantize(Decimal("0.01"))})

    return components

def compute_time_based_components(employee, target_month):
    """
    Analyze all timelogs for an employee in a given month.
    Returns list of dicts with:
        - component (SalaryComponent instance)
        - amount (Decimal)
    """
    branch_schedule = employee.branch.work_schedule
    components: list[dict] = []
    year = target_month.year
    month = target_month.month

    logs = TimeLog.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month
    )

    # Simple rate example; replace with policy-driven config as needed
    HOURLY_RATE = Decimal("100.00")
    PER_MINUTE_RATE = Decimal("2.00")

    for log in logs:
        analyzed = analyze_timelog(log, branch_schedule)

        for entry in analyzed:
            code = entry["code"]
            try:
                component = SalaryComponent.objects.get(code=code)
            except SalaryComponent.DoesNotExist:
                continue  # Skip if not configured

            if "hours" in entry:
                amount = (Decimal(entry["hours"]) * HOURLY_RATE).quantize(Decimal("0.01"))
            elif "minutes" in entry:
                amount = (Decimal(entry["minutes"]) * PER_MINUTE_RATE).quantize(Decimal("0.01"))
            else:
                amount = Decimal("0.00")

            components.append({
                "component": component,
                "amount": amount,
            })

    return components
