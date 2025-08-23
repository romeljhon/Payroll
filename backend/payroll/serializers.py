from rest_framework import serializers
from .models import PayrollPolicy, PayrollRun, SalaryComponent, SalaryRate, SalaryStructure, PayrollRecord, PayrollCycle


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

class SalaryComponentInputSerializer(serializers.Serializer):
    component = serializers.PrimaryKeyRelatedField(queryset=SalaryComponent.objects.all())
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_percentage = serializers.BooleanField()

class SalaryStructureBulkCreateSerializer(serializers.Serializer):
    position = serializers.PrimaryKeyRelatedField(queryset=SalaryStructure._meta.get_field('position').related_model.objects.all())
    components = SalaryComponentInputSerializer(many=True)

    def create(self, validated_data):
        position = validated_data['position']
        components = validated_data['components']
        instances = []

        for comp in components:
            instances.append(SalaryStructure(
                position=position,
                component=comp['component'],
                amount=comp['amount'],
                is_percentage=comp['is_percentage']
            ))

        return SalaryStructure.objects.bulk_create(instances)

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

class PayrollCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollCycle
        fields = "__all__"

    def validate(self, attrs):
        start_day = attrs.get("start_day", getattr(self.instance, "start_day", None))
        end_day   = attrs.get("end_day",   getattr(self.instance, "end_day",   None))

        for label, val in (("start_day", start_day), ("end_day", end_day)):
            if not (1 <= int(val) <= 31):
                raise serializers.ValidationError({label: "Must be between 1 and 31."})

        # No same-month restriction—wrap-around is allowed (e.g., 25 -> 10).
        return attrs

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

class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = [
            'id',
            'employee',
            'employee_name',
            'month',
            'component',
            'component_name',
            'component_type',
            'amount',
            'is_13th_month',
            'payroll_cycle',
        ]

class SalaryRateSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = SalaryRate
        fields = [
            "id",
            "employee",
            "employee_name",
            "amount",
            "start_date",
            "end_date"
        ]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))

        if start and end and start > end:
            raise serializers.ValidationError("End date must be after start date.")

        return attrs
    
class PayrollRunSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)
    cycle_name = serializers.CharField(source="payroll_cycle.name", read_only=True)
    cycle_type = serializers.CharField(source="payroll_cycle.cycle_type", read_only=True)
    records_count = serializers.IntegerField(source="records.count", read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            "id",
            "business",
            "business_name",
            "month",
            "payroll_cycle",
            "cycle_name",
            "cycle_type",
            "status",
            "generated_at",
            "notes",
            "records_count",
        ]

    def validate(self, attrs):
        """
        Prevent duplicate runs for same (business, month, payroll_cycle).
        DB unique_together will also enforce this, but this gives a nicer error.
        """
        instance = getattr(self, "instance", None)
        business = attrs.get("business", getattr(instance, "business", None))
        month = attrs.get("month", getattr(instance, "month", None))
        payroll_cycle = attrs.get("payroll_cycle", getattr(instance, "payroll_cycle", None))

        if business and month and payroll_cycle:
            qs = PayrollRun.objects.filter(business=business, month=month, payroll_cycle=payroll_cycle)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"non_field_errors": ["A payroll run already exists for this business, month, and cycle."]}
                )
        return attrs