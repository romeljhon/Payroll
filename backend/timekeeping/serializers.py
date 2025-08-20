from rest_framework import serializers
from timekeeping.models import TimeLog, Holiday
from common.constants import (
    PH_DEFAULT_MULTIPLIERS,
)

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"

    def validate(self, attrs):
        htype = attrs.get("type", getattr(self.instance, "type", None))
        multiplier = attrs.get("multiplier", getattr(self.instance, "multiplier", None))

        if htype not in PH_DEFAULT_MULTIPLIERS:
            raise serializers.ValidationError({"type": "Invalid holiday type for Philippines setup."})

        # Default multiplier if missing
        if multiplier in (None, ""):
            attrs["multiplier"] = PH_DEFAULT_MULTIPLIERS[htype]

        # Guardrails
        expected = PH_DEFAULT_MULTIPLIERS[htype]
        if abs(float(attrs["multiplier"]) - expected) > 0.2:
            raise serializers.ValidationError(
                {"multiplier": f"Multiplier for {htype} holidays should be around {expected}."}
            )

        return attrs
    
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
    

class TimeLogImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    employee_field = serializers.ChoiceField(choices=["employee_id", "employee_number", "email"], default="employee_id")
    date_format = serializers.CharField(required=False, default="%Y-%m-%d")
    time_format = serializers.CharField(required=False, default="%H:%M")
    has_header = serializers.BooleanField(required=False, default=True)
    dry_run = serializers.BooleanField(required=False, default=False)
