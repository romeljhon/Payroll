from django.db import models

class Holiday(models.Model):
    REGULAR = 'REGULAR'
    SPECIAL = 'SPECIAL'

    HOLIDAY_TYPES = [
        (REGULAR, 'Regular Holiday'),
        (SPECIAL, 'Special Non-Working Holiday'),
    ]

    name = models.CharField(max_length=100)
    date = models.DateField(unique=True)
    type = models.CharField(max_length=10, choices=HOLIDAY_TYPES)
    multiplier = models.DecimalField(default=2.0, max_digits=4, decimal_places=2)
    is_national = models.BooleanField(default=True)  # Optional: future local holidays

    def __str__(self):
        return f"{self.name} - {self.date} ({self.get_type_display()})"


class TimeLog(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    date = models.DateField()
    time_in = models.TimeField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)

    ot_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    late_minutes = models.PositiveIntegerField(default=0)
    undertime_minutes = models.PositiveIntegerField(default=0)  # 🔥 NEW FIELD
    is_rest_day = models.BooleanField(default=False)
    is_absent = models.BooleanField(default=False)
    holiday = models.ForeignKey('timekeeping.Holiday', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.employee} - {self.date}"