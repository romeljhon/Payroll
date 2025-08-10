from rest_framework import serializers
from timekeeping.models import TimeLog


class TimeLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField(read_only=True)
    duration = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TimeLog
        fields = ['id', 'employee', 'employee_name', 'date', 'time_in', 'time_out', 'duration']

    def get_employee_name(self, obj):
        return str(obj.employee)

    def get_duration(self, obj):
        return obj.duration_hours()