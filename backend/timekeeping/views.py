from rest_framework import viewsets, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date

from timekeeping.models import TimeLog, Holiday
from timekeeping.serializers import (
    TimeLogSerializer,
    HolidaySerializer,
    TimeLogImportSerializer,
)
from common.constants import PH_DEFAULT_MULTIPLIERS
from common.filters import HolidayFilter
from common.utils_ph_holidays import get_ph_recurring_holidays
from timekeeping.importers.timelog_importer import ImportOptions, import_timelogs


# ------------------------------
# TimeLog CRUD + Attendance Filters
# ------------------------------
@extend_schema(tags=["Timekeeping"])
class TimeLogViewSet(viewsets.ModelViewSet):
    queryset = TimeLog.objects.all()
    serializer_class = TimeLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee_id")
        month_param = self.request.query_params.get("month")  # Expected: YYYY-MM

        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        if month_param:
            try:
                year, month_num = map(int, month_param.split("-"))
                if 1 <= month_num <= 12:
                    qs = qs.filter(date__year=year, date__month=month_num)
            except (ValueError, AttributeError):
                pass

        return qs.order_by("-date")

    # 🔹 New endpoint: filter attendance history by business + branch + employee
    @action(detail=False, methods=["get"], url_path="by-business-branch")
    def by_business_branch(self, request):
        """
        Filter TimeLogs by employee + branch + business
        Example:
          GET /api/timelogs/by-business-branch/?employee_id=1&branch_id=2&business_id=3
        """
        employee_id = request.query_params.get("employee_id")
        branch_id = request.query_params.get("branch_id")
        business_id = request.query_params.get("business_id")

        qs = self.get_queryset()

        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        if branch_id:
            qs = qs.filter(employee__branch_id=branch_id)

        if business_id:
            qs = qs.filter(employee__branch__business_id=business_id)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ------------------------------
# Bulk Upload TimeLogs
# ------------------------------
@extend_schema(tags=["Timekeeping"])
class BulkTimeLogUploadView(APIView):
    def post(self, request):
        logs = request.data.get("logs", None)
        if not isinstance(logs, list):
            return Response(
                {"error": "`logs` must be a list of timelog objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TimeLogSerializer(
            data=logs, many=True, context={"request": request}
        )
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


# ------------------------------
# Holiday API
# ------------------------------
@extend_schema(tags=["Timekeeping"])
class HolidayViewSet(viewsets.ModelViewSet):
    """
    Philippines-only Holiday API

    Endpoints:
      - GET  /holidays/?year=2025&type=REGULAR
      - GET  /holidays/upcoming/
      - GET  /holidays/on/YYYY-MM-DD/
      - POST /holidays/seed_ph/<year>/
    """

    queryset = Holiday.objects.all().order_by("date")
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = HolidayFilter
    search_fields = ["name", "type"]
    ordering_fields = ["date", "name", "type", "multiplier"]
    ordering = ["date"]

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        qs = self.get_queryset().filter(date__gte=date.today())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"on/(?P<day>\d{4}-\d{2}-\d{2})")
    def on(self, request, day=None):
        try:
            target = date.fromisoformat(day)
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400
            )
        qs = self.get_queryset().filter(date=target)
        if not qs.exists():
            return Response({"is_holiday": False, "holiday": None})
        serializer = self.get_serializer(qs.first())
        return Response({"is_holiday": True, "holiday": serializer.data})

    @action(detail=False, methods=["post"], url_path=r"seed_ph/(?P<year>\d{4})")
    def seed_ph(self, request, year=None):
        """
        Seed recurring PH holidays for a given year.
        Skips duplicates (date is unique).
        """
        year = int(year)
        data_map = get_ph_recurring_holidays(year)
        created, skipped = [], []

        with transaction.atomic():
            # REGULAR
            for name, d in data_map["REGULAR"]:
                obj, was_created = Holiday.objects.get_or_create(
                    date=d,
                    defaults={
                        "name": name,
                        "type": Holiday.REGULAR,
                        "multiplier": PH_DEFAULT_MULTIPLIERS["REGULAR"],
                        "is_national": True,
                    },
                )
                (created if was_created else skipped).append(str(d))

            # SPECIAL
            for name, d in data_map["SPECIAL"]:
                obj, was_created = Holiday.objects.get_or_create(
                    date=d,
                    defaults={
                        "name": name,
                        "type": Holiday.SPECIAL,
                        "multiplier": PH_DEFAULT_MULTIPLIERS["SPECIAL"],
                        "is_national": True,
                    },
                )
                (created if was_created else skipped).append(str(d))

        return Response(
            {"year": year, "created_dates": created, "skipped_existing_dates": skipped},
            status=status.HTTP_201_CREATED,
        )


# ------------------------------
# Import TimeLogs from file
# ------------------------------
class TimeLogImportView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        ser = TimeLogImportSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        f = ser.validated_data["file"]

        opts = ImportOptions(
            employee_field=ser.validated_data["employee_field"],
            date_format=ser.validated_data["date_format"],
            time_format=ser.validated_data["time_format"],
            has_header=ser.validated_data["has_header"],
            dry_run=ser.validated_data["dry_run"],
        )

        result = import_timelogs(f.file, f.name, options=opts)

        return Response(
            {
                "message": "Dry run complete."
                if opts.dry_run
                else "Import complete.",
                "summary": {
                    "total_rows": result.total_rows,
                    "created": result.created,
                    "updated": result.updated,
                    "skipped": result.skipped,
                },
                "errors": result.errors[:100],  # cap to avoid huge payloads
            },
            status=status.HTTP_200_OK,
        )
