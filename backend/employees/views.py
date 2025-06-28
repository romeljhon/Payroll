from rest_framework import viewsets
from .models import Employee
from .serializers import EmployeeSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(tags=["Employees"])
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset


