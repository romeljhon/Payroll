from django.db import models

from organization.models import Business

# Create your models here.
class Position(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
class SalaryComponent(models.Model):
    EARNING = 'EARNING'
    DEDUCTION = 'DEDUCTION'
    COMPONENT_TYPES = [
        (EARNING, 'Earning'),
        (DEDUCTION, 'Deduction'),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    component_type = models.CharField(max_length=10, choices=COMPONENT_TYPES)
    is_taxable = models.BooleanField(default=False)  # for future calc rules

    def __str__(self):
        return f"{self.name} ({self.component_type})"

class SalaryStructure(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='salary_structure')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Can be a fixed amount or percentage
    is_percentage = models.BooleanField(default=False)  # NEW: Determines if amount is % of base salary

    class Meta:
        unique_together = ('position', 'component')

    def __str__(self):
        value = f"{self.amount}% " if self.is_percentage else f"{self.amount} "
        return f"{self.position.name} - {self.component.name}: {value}"

class PayrollRecord(models.Model):
    CYCLE_MONTHLY = 'monthly'
    CYCLE_FIRST_HALF = '1st_half'
    CYCLE_SECOND_HALF = '2nd_half'

    CYCLE_CHOICES = [
        (CYCLE_MONTHLY, 'Monthly'),
        (CYCLE_FIRST_HALF, 'First Half'),
        (CYCLE_SECOND_HALF, 'Second Half'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    month = models.DateField(help_text="Use the first day of the month")
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_13th_month = models.BooleanField(default=False)
    
    payroll_cycle = models.CharField(  # ✅ NEW FIELD
        max_length=10,
        choices=CYCLE_CHOICES,
        default=CYCLE_MONTHLY,
        help_text="Indicates the payroll cycle: full month or split"
    )

    class Meta:
        unique_together = ('employee', 'month', 'component', 'payroll_cycle')

    def __str__(self):
        tag = " (13th)" if self.is_13th_month else f" ({self.payroll_cycle})"
        return f"{self.employee} - {self.month.strftime('%b %Y')} - {self.component.name}{tag}"
    
class PayrollCycle(models.Model):
    CYCLE_TYPE_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('SEMI_1', 'Semi-Monthly 1st Half'),
        ('SEMI_2', 'Semi-Monthly 2nd Half'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='payroll_cycles')
    name = models.CharField(max_length=50)
    cycle_type = models.CharField(max_length=10, choices=CYCLE_TYPE_CHOICES)
    start_day = models.PositiveSmallIntegerField()
    end_day = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business', 'cycle_type')

    def __str__(self):
        return f"{self.business.name} - {self.name} ({self.start_day}-{self.end_day})"