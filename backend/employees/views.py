from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

from timekeeping.models import TimeLog
from .models import Employee
from .serializers import EmployeeSerializer, TimeLogSerializer
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

@extend_schema(tags=["Employees"])
class TimeLogViewSet(viewsets.ModelViewSet):
    queryset = TimeLog.objects.all()
    serializer_class = TimeLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        month = self.request.query_params.get('month')

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if month:
            qs = qs.filter(date__month=month.split('-')[1], date__year=month.split('-')[0])

        return qs.order_by('-date')

@extend_schema(tags=["Employees"])
class BulkTimeLogUploadView(APIView):
    def post(self, request):
        logs = request.data.get("logs", [])
        created = []

        for entry in logs:
            serializer = TimeLogSerializer(data=entry)
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                return Response({
                    "error": "Invalid data in one or more records.",
                    "details": serializer.errors
                }, status=400)

        return Response({
            "message": f"{len(created)} time logs created successfully.",
            "data": created
        }, status=201)