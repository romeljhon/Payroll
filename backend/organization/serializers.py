from rest_framework import serializers
from .models import Business, Branch

class BusinessSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)

    class Meta:
        model = Business
        fields = "__all__"

    def validate_name(self, value: str) -> str:
        normalized = " ".join(value.strip().split())
        # case-insensitive uniqueness guard (DB is case-sensitive by default)
        qs = Business.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(name__iexact=normalized).exists():
            raise serializers.ValidationError("A business with this name already exists.")
        return normalized

class BranchSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    name = serializers.CharField(max_length=255)

    class Meta:
        model = Branch
        fields = "__all__"

    def validate(self, attrs):
        # Normalize branch name
        name = " ".join(attrs.get("name", "").strip().split())
        attrs["name"] = name

        business = attrs.get("business") or getattr(self.instance, "business", None)
        if business and Branch.objects.filter(business=business, name__iexact=name).exclude(
            pk=getattr(self.instance, "pk", None)
        ).exists():
            raise serializers.ValidationError({"name": "Branch with this name already exists for the business."})
        return attrs
