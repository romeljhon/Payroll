from rest_framework import viewsets
from timekeeping.models import TimeLog
from timekeeping.serializers import TimeLogSerializer
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework import permissions, status


# Create your views here.
@extend_schema(tags=["Timekeeping"])
class TimeLogViewSet(viewsets.ModelViewSet):
    queryset = TimeLog.objects.all()
    serializer_class = TimeLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        month_param = self.request.query_params.get('month')  # Expected: YYYY-MM

        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        if month_param:
            try:
                year, month_num = map(int, month_param.split('-'))
                if 1 <= month_num <= 12:
                    qs = qs.filter(date__year=year, date__month=month_num)
            except (ValueError, AttributeError):
                # If month format is invalid, just ignore it
                pass

        return qs.order_by('-date')
    
@extend_schema(tags=["Timekeeping"])
class BulkTimeLogUploadView(APIView):

    def post(self, request):
        logs = request.data.get("logs", None)
        if not isinstance(logs, list):
            return Response(
                {"error": "`logs` must be a list of timelog objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TimeLogSerializer(data=logs, many=True, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # All-or-nothing write for consistency
        with transaction.atomic():
            instances = serializer.save()

        return Response(
            {
                "message": f"{len(instances)} time logs created successfully.",
                "data": TimeLogSerializer(instances, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )