from django.core.management.base import BaseCommand
from datetime import date, datetime, timedelta, time
from decimal import Decimal
import random

from employees.models import Employee
from timekeeping.models import Holiday, TimeLog


class Command(BaseCommand):
    help = "Generate full simulated time logs for all employees (default: July 2025)"

    def handle(self, *args, **kwargs):
        self.stdout.write("🕒 Seeding time logs for all employees (July 2025)...")

        start_date = date(2025, 7, 1)
        end_date = date(2025, 7, 31)

        holidays = Holiday.objects.filter(date__range=(start_date, end_date))
        holiday_map = {h.date: h for h in holidays}

        employees = Employee.objects.all()
        if not employees.exists():
            self.stdout.write(self.style.WARNING("⚠️ No employees found. Aborting."))
            return

        total_logs = 0

        for employee in employees:
            current = start_date
            while current <= end_date:
                weekday = current.weekday()
                is_sunday = weekday == 6
                is_workday = not is_sunday

                holiday = holiday_map.get(current)
                is_absent = False
                is_rest_day = is_sunday
                time_in = None
                time_out = None
                late_minutes = 0
                undertime_minutes = 0
                ot_hours = Decimal("0.00")

                if is_workday:
                    # 10% chance of being absent
                    if random.random() < 0.1:
                        is_absent = True
                    else:
                        # Arrive between 8:00–9:15
                        hour_in = random.choice([8, 8, 9])
                        minute_in = random.choice([0, 15, 30])
                        time_in = time(hour_in, minute_in)
                        late_minutes = max(0, ((hour_in - 9) * 60 + minute_in)) if hour_in >= 9 else 0

                        # Leave between 5:00–6:30
                        hour_out = random.choice([17, 18])
                        minute_out = random.choice([0, 15, 30])
                        time_out = time(hour_out, minute_out)

                        # 10% chance undertime, 15% chance OT
                        if random.random() < 0.1:
                            undertime_minutes = random.choice([15, 30, 60])
                        elif random.random() < 0.15:
                            ot_hours = Decimal(random.choice(["1.00", "2.00"]))

                TimeLog.objects.update_or_create(
                    employee=employee,
                    date=current,
                    defaults={
                        "time_in": time_in,
                        "time_out": time_out,
                        "late_minutes": late_minutes,
                        "undertime_minutes": undertime_minutes,
                        "ot_hours": ot_hours,
                        "is_rest_day": is_rest_day,
                        "is_absent": is_absent,
                        "holiday": holiday,
                    }
                )
                total_logs += 1
                current += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f"✅ Time logs generated: {total_logs} entries"))
