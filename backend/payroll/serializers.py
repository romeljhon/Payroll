from rest_framework import serializers
from .models import Position, SalaryComponent, SalaryStructure, PayrollRecord

class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = '__all__'


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(source='position.name', read_only=True)
    component_name = serializers.CharField(source='component.name', read_only=True)

    class Meta:
        model = SalaryStructure
        fields = '__all__'

class GeneratePayrollSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    month = serializers.DateField()
    base_salary = serializers.DecimalField(max_digits=10, decimal_places=2)

class PayrollSummarySerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = ['component_name', 'component_type', 'amount']

class PayslipComponentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='component.name')
    type = serializers.CharField(source='component.component_type')

    class Meta:
        model = PayrollRecord
        fields = ['name', 'type', 'amount', 'is_13th_month']

