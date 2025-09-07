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
def analyze_timelog(timelog, schedule) -> list[dict]:
    """
    Clean, non-overlapping codes:

    - REST DAY: only REST_OT (no LATE / UNDERTIME / ABSENT)
    - HOLIDAY:  no penalties at all (LATE/UNDERTIME/ABSENT suppressed). Holiday premium is added elsewhere.
    - WORK DAY:
        * No punches -> ABSENT (full day)
        * Hours <= 0   -> ABSENT (full day)
        * LATE if arrived after expected_in (beyond grace; emits minutes net of grace)
        * UNDERTIME once: max( left-early, shortfall-to-min-hours )
        * OT if hours_worked > expected_hours
    """
    policy = getattr(timelog.employee.branch.business, "payroll_policy", None)

    # Pull schedule params with safe fallbacks
    grace = getattr(schedule, "grace_minutes", None)
    if grace is None:
        grace = getattr(policy, "grace_minutes", 0) or 0
    break_hours = Decimal(str(getattr(schedule, "break_hours", "1.00") or "1.00"))
    min_hours = Decimal(str(getattr(schedule, "min_hours_required", "8.00") or "8.00"))

    expected_in = getattr(schedule, "time_in", None)
    expected_out = getattr(schedule, "time_out", None)

    # Workdays (Mon–Fri) fallback if schedule missing
    work_days = schedule.get_work_days() if schedule and hasattr(schedule, "get_work_days") else {0,1,2,3,4}
    weekday = timelog.date.weekday()
    is_rest_day = weekday not in work_days
    is_holiday = bool(getattr(timelog, "holiday_id", None))

    # Missing punches
    if not timelog.time_in or not timelog.time_out:
        # Rest day or holiday: no penalties
        if is_rest_day or is_holiday:
            return []
        return [{"code": "ABSENT", "hours": min_hours}]

    # Build times & worked hours (handle overnight)
    dt_in = datetime.combine(timelog.date, timelog.time_in)
    dt_out = datetime.combine(timelog.date, timelog.time_out)
    if dt_out <= dt_in:
        dt_out += timedelta(days=1)
    hours_worked = _to_hours(dt_out - dt_in) - break_hours
    if hours_worked < 0:
        hours_worked = Decimal("0.00")

    components: list[dict] = []

    # REST DAY: only credit the hours as REST_OT; no penalties
    if is_rest_day:
        if hours_worked > 0:
            components.append({"code": "REST_OT", "hours": hours_worked})
        return components

    # HOLIDAY: do not emit penalties; premium is handled outside
    if is_holiday:
        return []

    # From here it's a regular working day
    if hours_worked <= Decimal("0.00"):
        return [{"code": "ABSENT", "hours": min_hours}]

    # Expected day bounds (guard if schedule missing)
    exp_in_dt = datetime.combine(timelog.date, expected_in) if expected_in else None
    exp_out_dt = datetime.combine(timelog.date, expected_out) if expected_out else None
    if exp_out_dt and exp_in_dt and exp_out_dt <= exp_in_dt:
        exp_out_dt += timedelta(days=1)

    # LATE (emit minutes already net of grace) ✅
    if exp_in_dt and dt_in > exp_in_dt:
        late_delta = dt_in - exp_in_dt
        late_minutes = _to_minutes(late_delta)
        eff = late_minutes - Decimal(grace)
        if eff > 0:
            components.append({"code": "LATE", "minutes": eff})

    # UNDERTIME — compute once, as the MAX of two sources ✅
    undertime_from_left_early = Decimal("0.00")
    if exp_out_dt and dt_out < exp_out_dt:
        undertime_delta = exp_out_dt - dt_out
        undertime_from_left_early = _to_minutes(undertime_delta)

    shortfall_minutes = Decimal("0.00")
    if hours_worked < min_hours:
        shortfall_minutes = (min_hours - hours_worked) * Decimal("60")

    undertime_total = max(undertime_from_left_early, shortfall_minutes).quantize(Decimal("0.01"))
    if undertime_total > 0:
        components.append({"code": "UNDERTIME", "minutes": undertime_total})

    # OT: only if over expected hours (when we have expected bounds)
    if exp_in_dt and exp_out_dt:
        expected_hours = _to_hours(exp_out_dt - exp_in_dt) - break_hours
        if hours_worked > expected_hours:
            components.append({"code": "OT", "hours": (hours_worked - expected_hours).quantize(Decimal("0.01"))})

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
                rate = Decimal(str(getattr(policy, "late_penalty_per_minute", 0)))
                if minutes > 0 and rate > 0:
                    amt = _q2(minutes * rate)   # minutes already net of grace
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
