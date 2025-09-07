from rest_framework import viewsets, permissions, filters
from .models import Business, Branch, WorkSchedulePolicy
from .serializers import BusinessSerializer, BranchSerializer, WorkSchedulePolicySerializer
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

@extend_schema(tags=["Organization"])
class WorkSchedulePolicyViewSet(viewsets.ModelViewSet):
    queryset = (
        WorkSchedulePolicy.objects
        .select_related("branch", "branch__business")
        .all()
        .order_by("branch__business__name", "branch__name")
    )
    serializer_class = WorkSchedulePolicySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["branch__name", "branch__business__name"]
    ordering_fields = ["branch__business__name", "branch__name", "time_in", "time_out"]
    filterset_fields = ["branch", "branch__business"]