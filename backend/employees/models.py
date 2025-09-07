from django.db import models
from organization.models import Branch
from positions.models import Position
from datetime import datetime, timedelta

# Create your models here.
class Employee(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='employees')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    position = models.ForeignKey(Position, on_delete=models.PROTECT, null=True, blank=True, related_name='employees')
    hire_date = models.DateField()
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
