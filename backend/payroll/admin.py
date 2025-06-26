from django.contrib import admin
from .models import (
    Position,
    SalaryComponent,
    SalaryStructure,
    PayrollRecord,
    PayrollCycle,  # 👈 NEW
)

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'component_type', 'is_taxable')
    list_filter = ('component_type', 'is_taxable')
    search_fields = ('name', 'code')

@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ('position', 'component', 'amount', 'is_percentage')
    list_filter = ('position', 'component')
    search_fields = ('position__name', 'component__name')

@admin.register(PayrollRecord)
class PayrollRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'month', 'component', 'amount', 'is_13th_month', 'payroll_cycle')
    list_filter = ('month', 'component', 'is_13th_month', 'payroll_cycle')
    search_fields = ('employee__first_name', 'employee__last_name', 'component__name')

@admin.register(PayrollCycle)
class PayrollCycleAdmin(admin.ModelAdmin):
    list_display = ('business', 'name', 'cycle_type', 'start_day', 'end_day', 'is_active')
    list_filter = ('business', 'cycle_type', 'is_active')
    search_fields = ('name',)
