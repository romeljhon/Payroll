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

class TimeLog(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='time_logs')
    date = models.DateField()
    time_in = models.TimeField()
    time_out = models.TimeField()

    is_overtime = models.BooleanField(default=False)  # Optional flag

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee} - {self.date}"

    def duration_hours(self):
        in_datetime = datetime.combine(self.date, self.time_in)
        out_datetime = datetime.combine(self.date, self.time_out)
        return round((out_datetime - in_datetime).total_seconds() / 3600, 2)