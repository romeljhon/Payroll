from datetime import datetime
from .fetch_holidays import get_holidays

# Based on historical data and common classifications in the Philippines.
# The Nager.Date API does not distinguish between Regular and Special holidays for PH.
REGULAR_HOLIDAY_NAMES = [
    "New Year's Day",
    "Araw ng Kagitingan",
    "Maundy Thursday",
    "Good Friday",
    "Labor Day",
    "Independence Day",
    "National Heroes Day",
    "Bonifacio Day",
    "Christmas Day",
    "Rizal Day",
]

SPECIAL_HOLIDAY_NAMES = [
    "Chinese New Year",
    "EDSA People Power Revolution Anniversary",
    "Ninoy Aquino Day",
    "All Saints' Day",
    "All Souls' Day",
    "Feast of the Immaculate Conception of Mary",
    "Christmas Eve",
    "New Year's Eve",
]

def get_ph_recurring_holidays(year: int):
    """
    Fetches Philippine holidays for a given year from the Nager.Date API
    and categorizes them into REGULAR and SPECIAL.
    """
    holidays_from_api = get_holidays(year)
    
    if not holidays_from_api:
        return {"REGULAR": [], "SPECIAL": []}

    regular_holidays = []
    special_holidays = []

    # Get the names of holidays that are consistently regular.
    # Some holidays might change type, but this list is a stable baseline.
    known_regular_names = set(REGULAR_HOLIDAY_NAMES)
    known_special_names = set(SPECIAL_HOLIDAY_NAMES)

    for holiday in holidays_from_api:
        holiday_name = holiday.get('localName')
        holiday_date_str = holiday.get('date')
        
        if not holiday_name or not holiday_date_str:
            continue
            
        try:
            holiday_date = datetime.strptime(holiday_date_str, '%Y-%m-%d').date()
        except ValueError:
            continue

        # Classify based on name.
        if holiday_name in known_regular_names:
            regular_holidays.append((holiday_name, holiday_date))
        elif holiday_name in known_special_names:
            special_holidays.append((holiday_name, holiday_date))
        else:
            # Fallback for holidays not in our explicit lists (e.g., one-off proclamations).
            # We will assume they are special non-working holidays, which is a common case.
            if 'Public' in holiday.get('types', []):
                special_holidays.append((holiday_name, holiday_date))

    return {"REGULAR": regular_holidays, "SPECIAL": special_holidays}
