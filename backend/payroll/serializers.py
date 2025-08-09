from rest_framework import serializers
from .models import PayrollPolicy, SalaryComponent, SalaryStructure, PayrollRecord
from positions.models import Position



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
    payroll_cycle = serializers.ChoiceField(
        choices=[
            ('MONTHLY', 'Monthly'),
            ('SEMI_1', 'Semi-Monthly (1st Half)'),
            ('SEMI_2', 'Semi-Monthly (2nd Half)'),
        ],
        default='SEMI_1'
    )

class PayrollSummarySerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = ['component_name', 'component_type', 'amount']

class PayrollSummaryResponseSerializer(serializers.Serializer):
    employee = serializers.CharField()
    month = serializers.CharField()  # or serializers.DateField() if you return YYYY-MM-DD
    earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_pay = serializers.DecimalField(max_digits=12, decimal_places=2)
    details = PayrollSummarySerializer(many=True)

class PayslipComponentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='component.name')
    type = serializers.CharField(source='component.component_type')

    class Meta:
        model = PayrollRecord
        fields = ['name', 'type', 'amount', 'is_13th_month']


class PayrollPolicySerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = PayrollPolicy
        fields = [
            'id',
            'business',          # business ID for write operations
            'business_name',     # business name for read operations
            'grace_minutes',
            'standard_working_days',
            'late_penalty_per_minute',
            'undertime_penalty_per_minute',
            'absent_penalty_per_day',
            'ot_multiplier',
            'rest_day_multiplier',
            'holiday_regular_multiplier',
            'holiday_special_multiplier',
        ]