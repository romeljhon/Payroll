# payroll/services/time_analysis.py
from datetime import datetime, timedelta, date, time as dt_time
from types import SimpleNamespace
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

from timekeeping.models import TimeLog
from payroll.models import SalaryComponent

# ─────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────
def _to_hours(delta) -> Decimal:
    return (Decimal(delta.total_seconds()) / Decimal(3600)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _to_minutes(delta) -> Decimal:
    return (Decimal(delta.total_seconds()) / Decimal(60)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _q2(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

# map analyzer codes -> payroll component codes
CODE_MAP = {
    "OT": "OT",
    "REST_OT": "REST_OT",
    "LATE": "LATE",
    "UNDERTIME": "UNDERTIME",
    "ABSENT": "ABSENT",
}

# fallback metadata for auto-creating components in MVP
COMPONENT_DEFS = {
    "OT": ("Overtime Pay", "EARNING"),
    "REST_OT": ("Rest Day Overtime", "EARNING"),
    "HOLIDAY_PREMIUM": ("Holiday Premium", "EARNING"),
    "LATE": ("Late Penalty", "DEDUCTION"),
    "UNDERTIME": ("Undertime Penalty", "DEDUCTION"),
    "ABSENT": ("Absence Penalty", "DEDUCTION"),
}

def _get_component(code: str) -> SalaryComponent:
    name, ctype = COMPONENT_DEFS.get(code, (code.replace("_", " ").title(), "EARNING"))
    obj, _ = SalaryComponent.objects.get_or_create(
        code=code,
        defaults={"name": name, "component_type": ctype, "is_taxable": False},
    )
    return obj

def _worked_hours_for_log(log: TimeLog, break_hours: Decimal) -> Decimal:
    if not (log.time_in and log.time_out):
        return Decimal("0")
    dt_in = datetime.combine(log.date, log.time_in)
    dt_out = datetime.combine(log.date, log.time_out)
    if dt_out <= dt_in:
        dt_out += timedelta(days=1)  # overnight
    return _q2(_to_hours(dt_out - dt_in) - break_hours)

# ─────────────────────────────────────────────────────────
# your analyzer (UNCHANGED)
# ─────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────
# ✅ MODIFIED: cutoff-aware & policy-driven compute
# ─────────────────────────────────────────────────────────
def compute_time_based_components(
    employee,
    start: date,            # ✅ cutoff start
    end: date,              # ✅ cutoff end
    base_salary: Decimal,   # ✅ to derive hourly rates
    policy,                 # ✅ late/under/absent rates & multipliers
) -> list[dict]:
    """
    Compute time-based earnings/deductions for an employee within [start, end].
    Returns: list of {"component": SalaryComponent, "amount": Decimal}
    """
    # fallbacks if policy is missing
    if not policy:
        class _P:
            grace_minutes = 0
            standard_working_days = Decimal("22")
            late_penalty_per_minute = Decimal("0")
            undertime_penalty_per_minute = Decimal("0")
            absent_penalty_per_day = Decimal("0")
            ot_multiplier = Decimal("1.25")
            rest_day_multiplier = Decimal("1.30")
        policy = _P()

    # derive hourly rate from base salary and standard days
    schedule = getattr(getattr(employee, "branch", None), "work_schedule", None)
    if schedule is None:
        schedule = SimpleNamespace(
            time_in=dt_time(9, 0),
            time_out=dt_time(18, 0),
            min_hours_required=Decimal("8.00"),
            break_hours=Decimal("1.00"),
            get_work_days=lambda: {0, 1, 2, 3, 4},  # Mon–Fri
            grace_minutes=(getattr(policy, "grace_minutes", 0) if policy else 0),
        )
    # expected daily hours based on schedule; fallback to 8
    if schedule and schedule.time_in and schedule.time_out is not None:
        # build a fake date just to measure span
        exp_in = datetime.combine(start, schedule.time_in)
        exp_out = datetime.combine(start, schedule.time_out)
        if exp_out <= exp_in:
            exp_out += timedelta(days=1)
        expected_daily_hours = _to_hours(exp_out - exp_in) - Decimal(getattr(schedule, "break_hours", 0) or 0)
        if expected_daily_hours <= 0:
            expected_daily_hours = Decimal("8")
    else:
        expected_daily_hours = Decimal("8")

    working_days = Decimal(str(getattr(policy, "standard_working_days", Decimal("22"))))
    if working_days <= 0:
        working_days = Decimal("22")

    hourly_rate = _q2(Decimal(base_salary) / (working_days * expected_daily_hours))

    logs = (
        TimeLog.objects
        .select_related("holiday", "employee__branch__business")
        .filter(employee=employee, date__gte=start, date__lte=end)
        .order_by("date")
    )

    totals = defaultdict(lambda: Decimal("0.00"))

    for log in logs:
        analyzed = analyze_timelog(log, schedule) or []

        # derive worked hours for premiums (holiday/rest day)
        worked_hours = _worked_hours_for_log(log, Decimal(getattr(schedule, "break_hours", 0) or 0))

        # 1) premiums inferred from the log (holiday/rest-day)
        if log.holiday_id and worked_hours > 0:
            # premium is the extra above normal pay (multiplier - 1)
            mult_extra = Decimal(str(log.holiday.multiplier)) - Decimal("1")
            if mult_extra > 0:
                amt = _q2(worked_hours * hourly_rate * mult_extra)
                totals["HOLIDAY_PREMIUM"] += amt

        # 2) analyzer-emitted items (OT, REST_OT, LATE, UNDERTIME, ABSENT)
        for entry in analyzed:
            raw_code = entry.get("code")
            comp_code = CODE_MAP.get(raw_code, raw_code)

            hours = Decimal(str(entry.get("hours", 0) or 0))
            minutes = Decimal(str(entry.get("minutes", 0) or 0))

            if comp_code == "OT":
                ot_mult = Decimal(str(getattr(policy, "ot_multiplier", Decimal("1.25"))))
                amt = _q2(hours * hourly_rate * ot_mult)
                totals[comp_code] += amt

            elif comp_code == "REST_OT":
                # premium (extra) portion over normal rate
                rest_extra = Decimal(str(getattr(policy, "rest_day_multiplier", Decimal("1.30")))) - Decimal("1")
                if rest_extra > 0 and hours > 0:
                    amt = _q2(hours * hourly_rate * rest_extra)
                    totals[comp_code] += amt

            elif comp_code == "LATE":
                grace = Decimal(str(getattr(policy, "grace_minutes", 0) or 0))
                effective_minutes = minutes - grace
                if effective_minutes > 0:
                    rate = Decimal(str(getattr(policy, "late_penalty_per_minute", 0)))
                    amt = _q2(effective_minutes * rate)
                    totals[comp_code] += amt

            elif comp_code == "UNDERTIME":
                rate = Decimal(str(getattr(policy, "undertime_penalty_per_minute", 0)))
                if minutes > 0 and rate > 0:
                    amt = _q2(minutes * rate)
                    totals[comp_code] += amt

            elif comp_code == "ABSENT":
                per_day = Decimal(str(getattr(policy, "absent_penalty_per_day", 0)))
                # treat one ABSENT entry per log-date as 1 day; if you prefer fractional, convert hours/expected_daily_hours
                days = Decimal("1") if hours > 0 else Decimal("0")
                if days > 0 and per_day > 0:
                    amt = _q2(days * per_day)
                    totals[comp_code] += amt

            else:
                # unknown -> treat hours as simple earning at base hourly (safe fallback)
                if hours > 0:
                    amt = _q2(hours * hourly_rate)
                    totals[comp_code] += amt

    # build final rows
    rows: list[dict] = []
    for code, amount in totals.items():
        if amount == 0:
            continue
        component = _get_component(code)  # or use strict get() if you configured them already
        rows.append({"component": component, "amount": amount})

    return rows
