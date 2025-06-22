from django.contrib import admin
from .models import Position, SalaryComponent, SalaryStructure, PayrollRecord

admin.site.register(Position)
admin.site.register(SalaryComponent)
admin.site.register(SalaryStructure)
admin.site.register(PayrollRecord)
