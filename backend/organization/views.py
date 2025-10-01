from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import Business, Branch, WorkSchedulePolicy
from .serializers import BusinessSerializer, BranchSerializer, WorkSchedulePolicySerializer


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
        business_id = self.request.query_params.get("business")
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

    # ✅ New custom endpoint
    @action(detail=False, methods=["get"], url_path="by-business")
    def by_all_business(self, request):
        """
        GET /branches/by-business/
        Returns all businesses with their branches.
        """
        businesses = Business.objects.prefetch_related("branches").all()

        results = []
        for business in businesses:
            results.append({
                "business": {
                    "id": business.id,
                    "name": business.name,
                    "tax_id": business.tax_id,
                    "address": business.address,
                    "created_at": business.created_at,
                },
                "branches": BranchSerializer(business.branches.all(), many=True).data
            })

        return Response(results, status=status.HTTP_200_OK)


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
