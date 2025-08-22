from rest_framework import viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.db import transaction
from payroll.utils import _period_bounds_for_month
from timekeeping.models import TimeLog
from .models import PayrollCycle, PayrollPolicy, SalaryComponent, SalaryStructure, PayrollRecord
from employees.models import Employee
from .serializers import PayrollPolicySerializer, PayrollRecordSerializer, PayrollSummaryResponseSerializer, SalaryComponentSerializer, SalaryStructureBulkCreateSerializer, SalaryStructureSerializer, GeneratePayrollSerializer, PayrollSummarySerializer, PayslipComponentSerializer, PayrollCycleSerializer
from datetime import date
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema
from payroll.services.payroll_cycles import get_dynamic_cutoff
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from common.filters import PayrollCycleFilter
from payroll.services.payroll_engine import generate_payroll_for_employee, generate_batch_payroll
from payroll.services.helpers import normalize_month, compute_regular_monthly_gross



@extend_schema(tags=["Payroll"])
class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer

@extend_schema(tags=["Payroll"])
class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer

    def create(self, request, *args, **kwargs):
        serializer = SalaryStructureBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "Salary structures created successfully"}, status=status.HTTP_201_CREATED)


def upsert_mandatories(employee, month, cycle_type, gross_monthly: Decimal, policy):
    """
    Compute PH mandatories on a MONTHLY basis, allocate to the given cycle,
    and upsert them as PayrollRecord rows using component codes.
    """
    from payroll.models import PayrollRecord, SalaryComponent
    monthly = compute_mandatories_monthly(gross_monthly, policy)
    per_cycle = allocate_to_cycle(monthly, cycle_type, split=(Decimal("0.50"), Decimal("0.50")))
    comp_map = {c.code: c for c in SalaryComponent.objects.filter(code__in=per_cycle.keys())}

    for code, amount in per_cycle.items():
        comp = comp_map.get(code)
        if not comp:
            continue
        PayrollRecord.objects.update_or_create(
            employee=employee,
            month=month,
            component=comp,
            payroll_cycle=cycle_type,   # include cycle in lookup (unique key!)
            defaults={"amount": amount, "is_13th_month": False},
        )

@extend_schema(tags=["Payroll"])
class GeneratePayrollView(APIView):
    def post(self, request):
        employee_id = request.data.get("employee_id")
        base_salary = request.data.get("base_salary")
        month_param = request.data.get("month")
        cycle_type = request.data.get("cycle_type", "MONTHLY")

        if not employee_id or not base_salary or not month_param:
            return Response({"error": "employee_id, base_salary, and month are required."}, status=400)

        try:
            from payroll.views import normalize_month
            month = normalize_month(month_param)
            from employees.models import Employee
            employee = Employee.objects.get(id=employee_id)
            salary = Decimal(str(base_salary))
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        try:
            result = generate_payroll_for_employee(employee, salary, month, cycle_type)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
@extend_schema(
    tags=["Payroll"],
    parameters=[
        {"name": "employee_id", "in": "query", "required": True, "schema": {"type": "integer"}},
        {"name": "month", "in": "query", "required": True, "schema": {"type": "string", "format": "date"}},
    ],
    responses=PayrollSummaryResponseSerializer
)
class PayrollSummaryView(APIView):
    def get(self, request):
        employee_id = request.query_params.get('employee_id')
        month_param = request.query_params.get('month')

        if not employee_id or not month_param:
            return Response({"error": "employee_id and month are required."}, status=400)

        try:
            month = normalize_month(month_param)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)
        records = PayrollRecord.objects.filter(employee=employee, month=month, is_13th_month=False)

        earnings = records.filter(component__component_type='EARNING').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        deductions = records.filter(component__component_type='DEDUCTION').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        serializer = PayrollSummarySerializer(records, many=True)

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month,  # returns ISO date (first day)
            "earnings": earnings,
            "deductions": deductions,
            "net_pay": earnings - deductions,
            "details": serializer.data
        })

@extend_schema(tags=["Payroll"])
class Generate13thMonthView(APIView):
    def post(self, request):
        employee_id = request.data.get("employee_id")
        year = request.data.get("year")

        if not employee_id or not year:
            return Response({"error": "employee_id and year are required."}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)
        basic_component = get_object_or_404(SalaryComponent, code="BASIC")
        thirteenth_component = get_object_or_404(SalaryComponent, code="13TH")

        start_date = date(int(year), 1, 1)
        end_date = date(int(year), 12, 31)

        total_basic = PayrollRecord.objects.filter(
            employee=employee,
            component=basic_component,
            month__range=(start_date, end_date),
            is_13th_month=False
        ).aggregate(total=Sum('amount'))['total'] or 0

        thirteenth_month_pay = round(total_basic / 12, 2)

        # Save 13th month record
        record, created = PayrollRecord.objects.update_or_create(
            employee=employee,
            component=thirteenth_component,
            month=date(int(year), 12, 1),  # Fixed to Dec
            defaults={
                'amount': thirteenth_month_pay,
                'is_13th_month': True
            }
        )

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "year": year,
            "13th_month": float(thirteenth_month_pay),
            "status": "created" if created else "updated"
        })
    
@extend_schema(tags=["Payroll"])
class PayslipPreviewView(APIView):
    def get(self, request):
        employee_id = request.query_params.get("employee_id")
        month_param = request.query_params.get("month")

        if not employee_id or not month_param:
            return Response({"error": "employee_id and month are required."}, status=400)

        try:
            month = normalize_month(month_param)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)
        records = PayrollRecord.objects.filter(
            employee=employee,
            month=month
        ).select_related('component').order_by('component__component_type', 'component__name')

        earnings = sum((r.amount for r in records if r.component.component_type == "EARNING"), start=Decimal("0.00"))
        deductions = sum((r.amount for r in records if r.component.component_type == "DEDUCTION"), start=Decimal("0.00"))

        serializer = PayslipComponentSerializer(records, many=True)

        return Response({
            "employee": {
                "name": f"{employee.first_name} {employee.last_name}",
                "position": getattr(employee.position, "name", None),
                "branch": getattr(employee.branch, "name", None),
            },
            "month": month,
            "components": serializer.data,
            "total_earnings": earnings,
            "total_deductions": deductions,
            "net_pay": earnings - deductions
        })

@extend_schema(tags=["Payroll"])
class BatchPayrollGenerationView(APIView):
    def post(self, request):
        month_param = request.data.get("month")
        base_salaries = request.data.get("base_salaries")  # { employee_id: base_salary }
        cycle_type = request.data.get("payroll_cycle", "MONTHLY")

        if not month_param or not base_salaries:
            return Response({"error": "month and base_salaries are required."}, status=400)

        try:
            from payroll.views import normalize_month
            month = normalize_month(month_param)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        results = generate_batch_payroll(base_salaries, month, cycle_type)

        return Response({
            "month": month,
            "payroll_cycle": cycle_type,
            "processed": len(results),
            "results": results
        })
@extend_schema(tags=["Payroll"])    
class PayrollCycleViewSet(viewsets.ModelViewSet):
    """
    CRUD for payroll cycles + helpful helpers:

    - GET  /payroll-cycles/?business=1&cycle_type=SEMI_1
    - GET  /payroll-cycles/containing/?date=2025-08-14&business=1
    - GET  /payroll-cycles/period/?year=2025&month=8&business=1
    - POST /payroll-cycles/{id}/activate/
    - POST /payroll-cycles/{id}/deactivate/
    """
    queryset = PayrollCycle.objects.select_related("business").all().order_by("business_id", "name")
    serializer_class = PayrollCycleSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = PayrollCycleFilter
    search_fields = ["name", "business__name", "cycle_type"]
    ordering_fields = ["business_id", "name", "cycle_type", "is_active"]
    ordering = ["business_id", "name"]

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        obj = self.get_object()
        if not obj.is_active:
            obj.is_active = True
            obj.save(update_fields=["is_active"])
        return Response({"status": "activated", "id": obj.id})

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        obj = self.get_object()
        if obj.is_active:
            obj.is_active = False
            obj.save(update_fields=["is_active"])
        return Response({"status": "deactivated", "id": obj.id})

    @action(detail=False, methods=["get"])
    def containing(self, request):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"detail": "Query param `date` is required (YYYY-MM-DD)."}, status=400)
        try:
            target = date.fromisoformat(date_str)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        qs = self.filter_queryset(self.get_queryset())
        matches = [c for c in qs if _date_in_cycle(c.start_day, c.end_day, target)]
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def period(self, request):
        """
        Compute concrete period bounds for each cycle for a given month.
        Query params:
          - year=YYYY (required)
          - month=1..12 (required)
          - business=<id> (optional)
        """
        try:
            year = int(request.query_params.get("year"))
            month = int(request.query_params.get("month"))
            if not (1 <= month <= 12):
                raise ValueError
        except (TypeError, ValueError):
            return Response({"detail": "Provide valid `year` and `month` query params."}, status=400)

        qs = self.filter_queryset(self.get_queryset())
        out = []
        for c in qs:
            start_dt, end_dt = _period_bounds_for_month(year, month, c.start_day, c.end_day)
            out.append({
                "id": c.id,
                "business": c.business_id,
                "name": c.name,
                "cycle_type": c.cycle_type,
                "is_active": c.is_active,
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
            })

        # Optional: order by start_date then name for readability
        out.sort(key=lambda x: (x["start_date"], x["name"]))
        return Response(out)

@extend_schema(tags=["Payroll"])
class PayrollPolicyViewSet(viewsets.ModelViewSet):
    queryset = PayrollPolicy.objects.select_related('business').all()
    serializer_class = PayrollPolicySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        business_id = self.request.query_params.get('business')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

@extend_schema(tags=["Payroll"])
class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer