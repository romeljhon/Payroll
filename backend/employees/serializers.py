from rest_framework import serializers

from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    position = serializers.CharField(source='position.name', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'

