
import requests
from datetime import datetime

def get_holidays(year):
    """
    Fetches holidays from the Nager.Date API for a given year.
    """
    try:
        response = requests.get(f"https://date.nager.at/api/v3/PublicHolidays/{year}/PH")
        response.raise_for_status()  # Raise an exception for bad status codes
        holidays = response.json()
        return holidays
    except requests.exceptions.RequestException as e:
        print(f"Error fetching holidays: {e}")
        return None


def is_holiday(date, holidays):
    """
    Checks if a given date is a holiday.
    """
    if not holidays:
        return False
    return any(h['date'] == date.strftime('%Y-%m-%d') for h in holidays)
