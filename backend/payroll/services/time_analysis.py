from datetime import datetime, timedelta
from decimal import Decimal
from employees.models import TimeLog
from payroll.models import SalaryComponent
from django.utils.timezone import make_aware

def analyze_timelog(timelog, schedule):
    policy = timelog.employee.branch.business.payroll_policy
    grace = schedule.grace_minutes if schedule.grace_minutes else policy.grace_minutes

    components = []

    expected_in = schedule.time_in
    expected_out = schedule.time_out
    min_hours = schedule.min_hours_required
    work_days = schedule.get_work_days()

    weekday = timelog.date.weekday()
    is_rest_day = weekday not in work_days

    dt_in = datetime.combine(timelog.date, timelog.time_in)
    dt_out = datetime.combine(timelog.date, timelog.time_out)
    hours_worked = (dt_out - dt_in).total_seconds() / 3600 - float(schedule.break_hours)

    # LATE
    if timelog.time_in > expected_in:
        late_diff = (dt_in - datetime.combine(timelog.date, expected_in)).seconds / 60
        if late_diff > grace:
            components.append({
                "code": "LATE",
                "minutes": round(late_diff, 2)
            })

    # UNDERTIME
    if timelog.time_out < expected_out:
        undertime = (datetime.combine(timelog.date, expected_out) - dt_out).seconds / 60
        components.append({
            "code": "UNDERTIME",
            "minutes": round(undertime, 2)
        })

    # ABSENT
    if hours_worked < float(min_hours):
        components.append({
            "code": "ABSENT",
            "hours": round(float(min_hours) - hours_worked, 2)
        })

    # OVERTIME
    if hours_worked > 8 and not is_rest_day:
        components.append({
            "code": "OT",
            "hours": round(hours_worked - 8, 2)
        })

    # REST DAY OT
    if is_rest_day:
        components.append({
            "code": "REST_OT",
            "hours": round(hours_worked, 2)
        })

    return components



def compute_time_based_components(employee, target_month):
    """
    Analyze all timelogs for an employee in a given month.
    Returns list of dicts with:
        - component (SalaryComponent instance)
        - amount
    """

    branch_schedule = employee.branch.work_schedule
    components = []
    year = target_month.year
    month = target_month.month

    # Fetch all timelogs in the month
    logs = TimeLog.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month
    )

    for log in logs:
        analyzed = analyze_timelog(log, branch_schedule)

        for entry in analyzed:
            code = entry['code']
            try:
                component = SalaryComponent.objects.get(code=code)
            except SalaryComponent.DoesNotExist:
                continue  # Skip if component not set up

            # Compute amount (simplified: PHP per hour or per minute)
            if 'hours' in entry:
                multiplier = Decimal(100)  # example: PHP 100/hr
                amount = Decimal(entry['hours']) * multiplier
            elif 'minutes' in entry:
                multiplier = Decimal(2)  # example: PHP 2/min
                amount = Decimal(entry['minutes']) * multiplier
            else:
                amount = Decimal(0)

            components.append({
                "component": component,
                "amount": round(amount, 2),
            })

    return components
