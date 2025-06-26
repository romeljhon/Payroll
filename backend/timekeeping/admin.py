from django.contrib import admin
from .models import Holiday, TimeLog

admin.site.register(TimeLog)
@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'type', 'is_national')
    list_filter = ('type', 'is_national')
    search_fields = ('name',)
