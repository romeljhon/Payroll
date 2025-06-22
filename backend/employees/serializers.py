from rest_framework import serializers
from .models import Employee, TimeLog
from organization.models import Branch

class EmployeeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_id = serializers.IntegerField(source='branch.business.id', read_only=True)
    business_name = serializers.CharField(source='branch.business.name', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'

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