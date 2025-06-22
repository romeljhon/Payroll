from rest_framework import viewsets
from .models import Business, Branch
from .serializers import BusinessSerializer, BranchSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(tags=["Organization"])
class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

@extend_schema(tags=["Organization"])
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset
