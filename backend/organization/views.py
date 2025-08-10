from rest_framework import viewsets, permissions, filters
from .models import Business, Branch
from .serializers import BusinessSerializer, BranchSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(tags=["Organization"])
class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "tax_id"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

@extend_schema(tags=["Organization"])
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.select_related("business").all()
    serializer_class = BranchSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "business__name"]
    ordering_fields = ["name", "business__name", "id"]
    ordering = ["business__name", "name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset
