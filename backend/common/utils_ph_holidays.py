from datetime import date, timedelta
from common.constants import PH_REGULAR_HOLIDAYS, PH_SPECIAL_HOLIDAYS
from timekeeping.models import Holiday
from common.constants import PH_DEFAULT_MULTIPLIERS

def _compute_easter(year: int) -> date:
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19*a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2*e + 2*i - h - k) % 7
    m = (a + 11*h + 22*l) // 451
    month = (h + l - 7*m + 114) // 31
    day = ((h + l - 7*m + 114) % 31) + 1
    return date(year, month, day)

def _last_monday_of_august(year: int) -> date:
    d = date(year, 8, 31)
    while d.weekday() != 0:
        d -= timedelta(days=1)
    return d

def get_ph_recurring_holidays(year: int):
    easter = _compute_easter(year)
    maundy_thursday = easter - timedelta(days=3)
    good_friday = easter - timedelta(days=2)

    regular = [
        ("New Year's Day", date(year, 1, 1)),
        ("Araw ng Kagitingan", date(year, 4, 9)),
        ("Maundy Thursday", maundy_thursday),
        ("Good Friday", good_friday),
        ("Labor Day", date(year, 5, 1)),
        ("Independence Day", date(year, 6, 12)),
        ("National Heroes Day", _last_monday_of_august(year)),
        ("Bonifacio Day", date(year, 11, 30)),
        ("Christmas Day", date(year, 12, 25)),
        ("Rizal Day", date(year, 12, 30)),
    ]

    special = [
        ("EDSA People Power Revolution Anniversary", date(year, 2, 25)),
        ("Ninoy Aquino Day", date(year, 8, 21)),
        ("All Saints' Day", date(year, 11, 1)),
        ("All Souls' Day", date(year, 11, 2)),
        ("Feast of the Immaculate Conception of Mary", date(year, 12, 8)),
        ("Christmas Eve", date(year, 12, 24)),
        ("New Year's Eve", date(year, 12, 31)),
    ]

    return {"REGULAR": regular, "SPECIAL": special}
