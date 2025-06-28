from django.contrib import admin
from .models import Business, Branch

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    search_fields = ['name']  # ✅ Required for autocomplete to work

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'business']
    search_fields = ['name']
    autocomplete_fields = ['business']
