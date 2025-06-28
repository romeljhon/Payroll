from django.db import models
from organization.models import Branch
from payroll.models import Position
from datetime import datetime, timedelta

# Create your models here.
class Employee(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='employees')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    position = models.ForeignKey(Position, on_delete=models.PROTECT, related_name='employees')
    hire_date = models.DateField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    
class WorkSchedulePolicy(models.Model):
    branch = models.OneToOneField(Branch, on_delete=models.CASCADE, related_name='work_schedule')

    time_in = models.TimeField(default="09:00")
    time_out = models.TimeField(default="17:00")
    grace_minutes = models.PositiveSmallIntegerField(default=0)
    break_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)

    min_hours_required = models.DecimalField(
        max_digits=4, decimal_places=2, default=4.0,
        help_text="Minimum working hours to be considered present"
    )

    is_flexible = models.BooleanField(default=False)

    regular_work_days = models.CharField(
        max_length=20,
        default="0,1,2,3,4",
        help_text="Comma-separated weekdays: 0=Mon, 6=Sun"
    )

    def get_work_days(self):
        return list(map(int, self.regular_work_days.split(",")))

    def __str__(self):
        return f"Schedule for {self.branch.name}"