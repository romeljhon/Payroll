from rest_framework import serializers
from .models import Position


class PositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=100)
    class Meta:
        model = Position
        fields = '__all__'

    def validate_name(self, value: str) -> str:
        # normalize whitespace and casing quirks
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise serializers.ValidationError("Name cannot be blank.")
        # case-insensitive uniqueness check (avoids 'Dev' vs 'dev')
        qs = Position.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(name__iexact=normalized).exists():
            raise serializers.ValidationError("A position with this name already exists.")
        return normalized