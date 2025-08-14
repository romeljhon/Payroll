import django_filters
from timekeeping.models import Holiday
from payroll.models import PayrollCycle

class HolidayFilter(django_filters.FilterSet):
    date = django_filters.DateFilter(field_name="date", lookup_expr="exact")
    from_date = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    to_date = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    year = django_filters.NumberFilter(method="filter_year")
    type = django_filters.CharFilter(field_name="type", lookup_expr="iexact")
    is_national = django_filters.BooleanFilter(field_name="is_national")

    class Meta:
        model = Holiday
        fields = ["type", "is_national", "date"]

    def filter_year(self, queryset, name, value):
        return queryset.filter(date__year=value)


class PayrollCycleFilter(django_filters.FilterSet):
    business = django_filters.NumberFilter(field_name="business_id")
    cycle_type = django_filters.CharFilter(field_name="cycle_type", lookup_expr="iexact")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = PayrollCycle
        fields = ["business", "cycle_type", "is_active"]