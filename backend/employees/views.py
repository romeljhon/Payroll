from rest_framework import viewsets
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeWithRateCreateSerializer, SalaryRateInlineSerializer
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, status
from payroll.models import SalaryRate
from django.db import transaction

@extend_schema(tags=["Employees"])
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("branch", "position").all()
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset


    @action(detail=False, methods=["post"], url_path="create-with-rate")
    def create_with_rate(self, request):
        """
        POST /employees/create-with-rate/
        {
          "branch": 1,
          "position": 2,
          "first_name": "Jane",
          "last_name": "Doe",
          "email": "jane@example.com",
          "phone": "0917...",
          "hire_date": "2025-01-15",
          "active": true,
          "salary_rate": {
            "amount": "30000.00",
            "start_date": "2025-01-01",
            "end_date": null
          }
        }
        """
        ser = EmployeeWithRateCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        emp = ser.save()
        return Response(
            {
                "employee": EmployeeSerializer(emp).data,
                "message": "Employee and salary rate created.",
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="add-salary-rate")
    def add_salary_rate(self, request, pk=None):
        """
        POST /employees/{id}/add-salary-rate/
        { "amount": "35000.00", "start_date": "2025-06-01", "end_date": null }
        """
        emp = self.get_object()
        rate_ser = SalaryRateInlineSerializer(data=request.data)
        rate_ser.is_valid(raise_exception=True)
        with transaction.atomic():
            rate = SalaryRate.objects.create(employee=emp, **rate_ser.validated_data)
        return Response(
            {"employee_id": emp.id, "salary_rate": SalaryRateInlineSerializer(rate).data},
            status=status.HTTP_201_CREATED,
        )