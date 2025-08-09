# timekeeping/management/commands/seed_ph_2025_holidays.py
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction

from timekeeping.models import Holiday


class Command(BaseCommand):
    help = "Seed the 2025 Philippines holiday list into the CURRENT database (idempotent)."

    def handle(self, *args, **options):
        # --- 2025 Holy Week (fixed for 2025) ---
        # Palm Sunday: 2025-04-13
        # Maundy Thursday: 2025-04-17 (Regular)
        # Good Friday: 2025-04-18 (Regular)
        # Black Saturday: 2025-04-19 (Special)
        MAUNDY_THURSDAY = date(2025, 4, 17)
        GOOD_FRIDAY = date(2025, 4, 18)
        BLACK_SATURDAY = date(2025, 4, 19)

        # National Heroes Day: last Monday of August
        def last_monday_of_august(year: int) -> date:
            d = date(year, 8, 31)
            while d.weekday() != 0:  # Monday=0
                d -= timedelta(days=1)
            return d

        nhd = last_monday_of_august(2025)

        # Note on types:
        # - REGULAR: New Year, Araw ng Kagitingan, Maundy Thu, Good Fri, Labor Day, Independence Day,
        #            National Heroes Day, Bonifacio Day, Christmas Day, Rizal Day
        # - SPECIAL: Chinese New Year, EDSA, Black Saturday, Ninoy, All Saints, All Souls,
        #            Immaculate Conception, Christmas Eve, Last Day of the Year

        HOLIDAYS_2025 = [
            # Regular Holidays
            ("New Year's Day", date(2025, 1, 1), Holiday.REGULAR),
            ("Araw ng Kagitingan", date(2025, 4, 9), Holiday.REGULAR),
            ("Maundy Thursday", MAUNDY_THURSDAY, Holiday.REGULAR),
            ("Good Friday", GOOD_FRIDAY, Holiday.REGULAR),
            ("Labor Day", date(2025, 5, 1), Holiday.REGULAR),
            ("Independence Day", date(2025, 6, 12), Holiday.REGULAR),
            ("National Heroes Day", nhd, Holiday.REGULAR),
            ("Bonifacio Day", date(2025, 11, 30), Holiday.REGULAR),
            ("Christmas Day", date(2025, 12, 25), Holiday.REGULAR),
            ("Rizal Day", date(2025, 12, 30), Holiday.REGULAR),

            # Special (Non-Working) Holidays
            ("Chinese New Year", date(2025, 1, 29), Holiday.SPECIAL),
            ("EDSA People Power Revolution Anniversary", date(2025, 2, 25), Holiday.SPECIAL),
            ("Black Saturday", BLACK_SATURDAY, Holiday.SPECIAL),
            ("Ninoy Aquino Day", date(2025, 8, 21), Holiday.SPECIAL),
            ("All Saints' Day", date(2025, 11, 1), Holiday.SPECIAL),
            ("All Souls' Day", date(2025, 11, 2), Holiday.SPECIAL),
            ("Feast of the Immaculate Conception of Mary", date(2025, 12, 8), Holiday.SPECIAL),
            ("Christmas Eve", date(2025, 12, 24), Holiday.SPECIAL),
            ("Last Day of the Year", date(2025, 12, 31), Holiday.SPECIAL),
        ]

        created, updated = 0, 0
        with transaction.atomic():
            for name, d, htype in HOLIDAYS_2025:
                obj, was_created = Holiday.objects.update_or_create(
                    date=d,
                    defaults={
                        "name": name,
                        "type": htype,
                        # multipliers can be adjusted by policy; we set sensible defaults
                        "multiplier": 2.0 if htype == Holiday.REGULAR else 1.3,
                        "is_national": True,
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Seeded Philippines 2025 Holidays. Created: {created}, Updated: {updated}"
        ))
