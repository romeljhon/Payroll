from rest_framework import serializers

from .models import Employee
from payroll.models import SalaryRate
from django.db import transaction

class EmployeeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    position = serializers.CharField(source='position.name', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'


class SalaryRateInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRate
        fields = ("amount", "start_date", "end_date")
        extra_kwargs = {
            "end_date": {"required": False, "allow_null": True},
        }


class EmployeeWithRateCreateSerializer(serializers.ModelSerializer):
    """
    Create employee + one salary rate in a single request.
    """
    salary_rate = SalaryRateInlineSerializer(write_only=True)

    class Meta:
        model = Employee
        # keep it explicit to avoid clashes with your read_only 'position_name' etc.
        fields = (
            "branch", "position", "first_name", "last_name",
            "email", "phone", "hire_date", "active",
            "salary_rate",
        )

    def validate(self, attrs):
        # you can add any cross-field validations here
        return attrs

    def create(self, validated_data):
        rate_data = validated_data.pop("salary_rate")
        with transaction.atomic():
            emp = Employee.objects.create(**validated_data)
            SalaryRate.objects.create(employee=emp, **rate_data)
        return emp