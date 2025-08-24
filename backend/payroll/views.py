from rest_framework import viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.db import transaction
from payroll.utils import _period_bounds_for_month
from timekeeping.models import TimeLog
from .models import PayrollCycle, PayrollPolicy, PayrollRun, SalaryComponent, SalaryRate, SalaryStructure, PayrollRecord
from employees.models import Employee
from .serializers import PayrollPolicySerializer, PayrollRecordSerializer, PayrollRunSerializer, PayrollSummaryResponseSerializer, SalaryComponentSerializer, SalaryRateSerializer, SalaryStructureBulkCreateSerializer, SalaryStructureSerializer, GeneratePayrollSerializer, PayrollSummarySerializer, PayslipComponentSerializer, PayrollCycleSerializer
from datetime import date
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from common.filters import PayrollCycleFilter
from payroll.services.payroll_engine import generate_payroll_for_employee, generate_batch_payroll
from payroll.services.helpers import normalize_month
from payroll.utils import _date_in_cycle



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

@extend_schema(
    tags=["Payroll"],
    request={
        "application/json": {
            "example": {
                "employee_id": 123,
                "month": "2025-08",          # or "2025-08-01"
                "cycle_type": "SEMI_1",      # defaults to "MONTHLY" if omitted
                # "run_id": 10               # optional: attach to an existing PayrollRun
            }
        }
    },
    responses={200: dict}
)
class GeneratePayrollView(APIView):
    def post(self, request):
        employee_id = request.data.get("employee_id")
        month_param = request.data.get("month")
        cycle_type = str(request.data.get("cycle_type", "MONTHLY")).upper()
        run_id = request.data.get("run_id")

        # ✅ Validate required fields (no base_salary anymore)
        if not employee_id or not month_param:
            return Response(
                {"detail": "employee_id and month are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Parse month and fetch employee
        try:
            month = normalize_month(month_param)
            employee = Employee.objects.select_related("branch__business", "position").get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Invalid request: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Resolve business & payroll cycle
        business = getattr(getattr(employee, "branch", None), "business", None)
        if not business:
            return Response({"detail": "Employee must belong to a branch with a business."}, status=400)

        try:
            cycle = PayrollCycle.objects.get(business=business, cycle_type=cycle_type, is_active=True)
        except PayrollCycle.DoesNotExist:
            return Response(
                {"detail": f"No active PayrollCycle for business '{business.name}' and type '{cycle_type}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Get or create a PayrollRun (attach records to a run for audit)
        run = None
        if run_id:
            try:
                run = PayrollRun.objects.get(pk=run_id)
            except PayrollRun.DoesNotExist:
                return Response({"detail": "PayrollRun not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            run = PayrollRun.objects.create(
                business=business,
                month=month,
                payroll_cycle=cycle,
                status="PENDING",
                notes=f"Single-employee run for {employee_id}",
            )

        # ✅ Generate payroll using the NEW engine signature (SalaryRate-driven)
        try:
            result = generate_payroll_for_employee(
                employee=employee,
                month=month,
                cycle_type=cycle_type,
                run=run,
            )
            run.status = "COMPLETED"
            run.save(update_fields=["status"])
            return Response({"run_id": run.id, "result": result}, status=200)

        except Exception as e:
            # Common causes: missing SalaryRate for month; missing policy; etc.
            run.status = "PENDING"  # leave as PENDING for retry/debug
            run.notes = f"Error: {e}"
            run.save(update_fields=["status", "notes"])
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
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
        run_id = request.query_params.get('run')  # optional
        cycle_type = request.query_params.get('cycle_type') or request.query_params.get('payroll_cycle')  # optional
        include_13th = str(request.query_params.get('include_13th', 'false')).lower() in ('1', 'true', 'yes')

        if not employee_id or not month_param:
            return Response({"error": "employee_id and month are required."}, status=status.HTTP_400_BAD_REQUEST)

        # normalize month (YYYY-MM or YYYY-MM-DD -> first day of month)
        try:
            month = normalize_month(month_param)
        except Exception as e:
            return Response({"error": f"Invalid month: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        employee = get_object_or_404(Employee.objects.select_related("branch__business"), id=employee_id)

        qs = (
            PayrollRecord.objects
            .select_related('component', 'payroll_cycle', 'run')
            .filter(employee=employee, month=month)
        )

        if not include_13th:
            qs = qs.filter(is_13th_month=False)

        # Prefer narrowing by run (most precise), else by cycle_type
        if run_id:
            qs = qs.filter(run_id=run_id)
        elif cycle_type:
            cycle_type = str(cycle_type).upper()
            try:
                cycle = PayrollCycle.objects.get(
                    business=employee.branch.business,
                    cycle_type=cycle_type,
                    is_active=True
                )
            except PayrollCycle.DoesNotExist:
                return Response(
                    {"error": f"No active PayrollCycle '{cycle_type}' for this employee's business."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            qs = qs.filter(payroll_cycle=cycle)

        earnings = qs.filter(component__component_type='EARNING').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        deductions = qs.filter(component__component_type='DEDUCTION').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Uses your existing serializer
        serializer = PayrollSummarySerializer(qs, many=True)

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month,  # DRF renders date as ISO
            "run": int(run_id) if run_id else None,
            "cycle_type": str(cycle_type).upper() if cycle_type else None,
            "earnings": earnings,
            "deductions": deductions,
            "net_pay": earnings - deductions,
            "details": serializer.data,
        }, status=status.HTTP_200_OK)

@extend_schema(tags=["Payroll"])
class Generate13thMonthView(APIView):
    """
    POST body:
    {
      "employee_id": 123,
      "year": 2025,
      "cycle_type": "MONTHLY",   // optional, defaults to MONTHLY
      "run_id": 10               // optional, attach to existing run; else a December run is created
    }
    """
    def post(self, request):
        employee_id = request.data.get("employee_id")
        year = request.data.get("year")
        cycle_type = str(request.data.get("cycle_type", "MONTHLY")).upper()
        run_id = request.data.get("run_id")

        if not employee_id or not year:
            return Response({"error": "employee_id and year are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate year
        try:
            year = int(year)
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
            dec_month = date(year, 12, 1)
        except Exception:
            return Response({"error": "Invalid year."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch employee & business
        employee = get_object_or_404(
            Employee.objects.select_related("branch__business"),
            id=employee_id
        )
        business = getattr(employee.branch, "business", None)
        if not business:
            return Response({"error": "Employee must belong to a branch with a business."}, status=status.HTTP_400_BAD_REQUEST)

        # Components (must exist)
        basic_component = get_object_or_404(SalaryComponent, code="BASIC")
        thirteenth_component = get_object_or_404(SalaryComponent, code="13TH")

        # Resolve cycle (FK required on PayrollRecord)
        try:
            cycle = PayrollCycle.objects.get(business=business, cycle_type=cycle_type, is_active=True)
        except PayrollCycle.DoesNotExist:
            return Response(
                {"error": f"No active PayrollCycle '{cycle_type}' for this business."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create a December run
        run = None
        if run_id:
            run = get_object_or_404(PayrollRun, pk=run_id)
            if run.business_id != business.id or run.month != dec_month or run.payroll_cycle_id != cycle.id:
                # Not strictly required, but safer to avoid attaching to a mismatched run
                return Response(
                    {"error": "Provided run does not match employee business / December month / chosen cycle."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Create a run for December of the given year
            run, _ = PayrollRun.objects.get_or_create(
                business=business,
                month=dec_month,
                payroll_cycle=cycle,
                defaults={"status": "PENDING", "notes": f"13th month run for {year}"}
            )

        # Sum BASIC for the whole year (exclude prior 13th records)
        total_basic = (
            PayrollRecord.objects
            .filter(
                employee=employee,
                component=basic_component,
                month__range=(start_date, end_date),
                is_13th_month=False
            )
            .aggregate(total=Sum('amount'))['total']
            or Decimal("0.00")
        )

        thirteenth_month_pay = (total_basic / Decimal("12")).quantize(Decimal("0.01"))

        # Upsert 13th month record for December + chosen cycle, attach to run
        record, created = PayrollRecord.objects.update_or_create(
            employee=employee,
            component=thirteenth_component,
            month=dec_month,
            payroll_cycle=cycle,
            defaults={
                "amount": thirteenth_month_pay,
                "is_13th_month": True,
                "run": run
            }
        )

        # Mark run completed if we just created it for this purpose (optional rule)
        if run.status == "PENDING":
            run.status = "COMPLETED"
            run.save(update_fields=["status"])

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "year": year,
            "cycle_type": cycle_type,
            "run_id": run.id,
            "13th_month": str(thirteenth_month_pay),
            "status": "created" if created else "updated",
        }, status=status.HTTP_200_OK)
    
@extend_schema(tags=["Payroll"])
class PayslipPreviewView(APIView):
    """
    GET params:
      - employee_id: int (required)
      - month: YYYY-MM or YYYY-MM-DD (required; normalized to 1st of month)
      - run: int (optional; preferred to pinpoint a specific batch)
      - cycle_type: "SEMI_1" | "SEMI_2" | "MONTHLY" (optional fallback)
      - include_13th: true|false (default: false)
    """
    def get(self, request):
        employee_id = request.query_params.get("employee_id")
        month_param = request.query_params.get("month")
        run_id = request.query_params.get('run')
        cycle_type = request.query_params.get('cycle_type') or request.query_params.get('payroll_cycle')
        include_13th = str(request.query_params.get('include_13th', 'false')).lower() in ('1','true','yes')

        if not employee_id or not month_param:
            return Response({"error": "employee_id and month are required."}, status=400)

        try:
            month = normalize_month(month_param)
        except Exception as e:
            return Response({"error": f"Invalid month: {e}"}, status=400)

        employee = get_object_or_404(
            Employee.objects.select_related("position", "branch__business"),
            id=employee_id
        )
        business = getattr(employee.branch, "business", None)
        if not business:
            return Response({"error": "Employee must belong to a branch with a business."}, status=400)

        qs = (
            PayrollRecord.objects
            .select_related('component', 'payroll_cycle', 'run')
            .filter(employee=employee, month=month)
            .order_by('component__component_type', 'component__name', 'id')
        )

        if not include_13th:
            qs = qs.filter(is_13th_month=False)

        used_cycle_type = None

        # Prefer narrowing by run (most precise)
        if run_id:
            qs = qs.filter(run_id=run_id)
        elif cycle_type:
            used_cycle_type = str(cycle_type).upper()
            try:
                cycle = PayrollCycle.objects.get(business=business, cycle_type=used_cycle_type, is_active=True)
            except PayrollCycle.DoesNotExist:
                return Response({"error": f"No active PayrollCycle '{used_cycle_type}' for this business."}, status=400)
            qs = qs.filter(payroll_cycle=cycle)
        else:
            # If both halves exist, require disambiguation
            cycle_counts = qs.values('payroll_cycle__cycle_type').distinct().count()
            if cycle_counts > 1:
                return Response(
                    {"error": "Multiple cycles found for this month. Provide ?run=<id> or &cycle_type=SEMI_1/SEMI_2/MONTHLY."},
                    status=400
                )

        earnings = qs.filter(component__component_type="EARNING").aggregate(total=Sum('amount'))['total'] or Decimal("0.00")
        deductions = qs.filter(component__component_type="DEDUCTION").aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        serializer = PayslipComponentSerializer(qs, many=True)

        return Response({
            "employee": {
                "name": f"{employee.first_name} {employee.last_name}",
                "position": getattr(employee.position, "name", None),
                "branch": getattr(employee.branch, "name", None),
            },
            "month": month,
            "run": int(run_id) if run_id else None,
            "cycle_type": used_cycle_type,
            "components": serializer.data,
            "total_earnings": earnings,
            "total_deductions": deductions,
            "net_pay": earnings - deductions,
        }, status=200)

@extend_schema(tags=["Payroll"])
class BatchPayrollGenerationView(APIView):
    """
    POST body (preferred):
    {
      "employee_ids": [1,2,3],
      "month": "2025-08",           // or "2025-08-01"
      "cycle_type": "SEMI_1",       // or legacy: "payroll_cycle"
      // "run_id": 10                // optional: attach to existing run
    }

    Legacy payload supported (treated as overrides):
    {
      "base_salaries": { "1": "25000.00", "2": "30000.00" },
      "month": "2025-08",
      "cycle_type": "MONTHLY"
    }
    """
    def post(self, request):
        # 1) Parse month
        month_param = request.data.get("month")
        if not month_param:
            return Response({"detail": "month is required"}, status=400)
        try:
            month = normalize_month(month_param)
        except Exception as e:
            return Response({"detail": f"Invalid month: {e}"}, status=400)

        # 2) Cycle type (accept legacy key)
        cycle_type = str(
            request.data.get("cycle_type") or request.data.get("payroll_cycle") or "MONTHLY"
        ).upper()

        # 3) Employees: prefer employee_ids, else derive from base_salaries keys
        employee_ids = request.data.get("employee_ids")
        base_salaries = request.data.get("base_salaries")  # legacy

        if not employee_ids and not base_salaries:
            return Response(
                {"detail": "Provide either employee_ids or base_salaries"},
                status=400,
            )

        if not employee_ids and base_salaries:
            try:
                # normalize keys to ints
                employee_ids = [int(k) for k in base_salaries.keys()]
            except Exception:
                return Response({"detail": "base_salaries keys must be employee IDs"}, status=400)

        # Optional overrides from legacy base_salaries (for simulation); values left as-is
        salary_overrides = None
        if base_salaries:
            try:
                salary_overrides = {int(k): base_salaries[k] for k in base_salaries}
            except Exception:
                return Response({"detail": "Invalid base_salaries mapping"}, status=400)

        # 4) Build/resolve PayrollRun (so you always get run_id)
        #    Assumes single business (your current scope). Uses first employee to resolve business.
        run = None
        run_id = request.data.get("run_id")
        if run_id:
            try:
                run = PayrollRun.objects.get(pk=run_id)
            except PayrollRun.DoesNotExist:
                return Response({"detail": "PayrollRun not found."}, status=404)
        else:
            # Infer business from first employee
            try:
                first_emp = (
                    Employee.objects.select_related("branch__business")
                    .only("id", "branch__business_id")
                    .get(id=employee_ids[0])
                )
                business = first_emp.branch.business
            except Employee.DoesNotExist:
                return Response({"detail": "First employee not found"}, status=404)
            except Exception as e:
                return Response({"detail": str(e)}, status=400)

            try:
                cycle = PayrollCycle.objects.get(business=business, cycle_type=cycle_type, is_active=True)
            except PayrollCycle.DoesNotExist:
                return Response(
                    {"detail": f"No active PayrollCycle for business '{business.name}' and type '{cycle_type}'."},
                    status=400,
                )

            run = PayrollRun.objects.create(
                business=business,
                month=month,
                payroll_cycle=cycle,
                status="PENDING",
                notes=f"Batch run for {len(employee_ids)} employees",
            )

        # 5) Call the NEW engine (SalaryRate-driven)
        try:
            results = generate_batch_payroll(
                month=month,
                cycle_type=cycle_type,
                employee_ids=employee_ids,
                salary_overrides=salary_overrides,  # optional
                run=run,
            )
            run.status = "COMPLETED"
            run.save(update_fields=["status"])

            return Response(
                {
                    "run_id": run.id,
                    "month": month.isoformat(),
                    "cycle_type": cycle_type,
                    "processed": len(results),
                    "results": results,
                },
                status=200,
            )
        except Exception as e:
            run.status = "PENDING"
            run.notes = f"Error: {e}"
            run.save(update_fields=["status", "notes"])
            return Response({"detail": str(e)}, status=400)
        
@extend_schema(tags=["Payroll"])
class PayrollCycleViewSet(viewsets.ModelViewSet):
    """
    CRUD for payroll cycles + helpers:

    Via your router (e.g., /payroll/cycles/):

    - GET  /payroll/cycles/?business=1&cycle_type=SEMI_1
    - GET  /payroll/cycles/containing/?date=2025-08-14&business=1
    - GET  /payroll/cycles/period/?year=2025&month=8&business=1
    - POST /payroll/cycles/{id}/activate/
    - POST /payroll/cycles/{id}/deactivate/
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
        """
        Return cycles (from the filtered queryset) whose *current period* contains the given date.
        Note: We check both the period anchored to the given date's month and the previous month
        to correctly handle wrap-around cutoffs (e.g., 26→10).
        """
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
        Compute concrete [start_date, end_date] for each cycle in a given (year, month),
        anchored to that month (wrap-around handled).
        Query params (required): year=YYYY, month=1..12
        Optional: business=<id> (via filterset)
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

        # For readability
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

@extend_schema(tags=["Payroll"])
class SalaryRateViewSet(viewsets.ModelViewSet):
    queryset = SalaryRate.objects.select_related("employee").all()
    serializer_class = SalaryRateSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["employee__first_name", "employee__last_name"]
    ordering_fields = ["start_date", "amount"]
    ordering = ["-start_date"]
    filterset_fields = ["employee", "start_date", "end_date"]

@extend_schema(tags=["Payroll"])
class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.select_related("business", "payroll_cycle").all()
    serializer_class = PayrollRunSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["business__name", "payroll_cycle__name", "payroll_cycle__cycle_type", "notes"]
    ordering_fields = ["generated_at", "month", "id"]
    ordering = ["-generated_at"]
    filterset_fields = ["business", "month", "payroll_cycle", "status"]

    def perform_create(self, serializer):
        # Default new runs to PENDING (you can flip to COMPLETED after generation)
        serializer.save(status=serializer.validated_data.get("status", "PENDING"))

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """
        Quick totals for a run: earnings, deductions, net, and record count.
        """
        run = self.get_object()
        records = PayrollRecord.objects.select_related("component").filter(run=run)

        total_earnings = Decimal("0.00")
        total_deductions = Decimal("0.00")

        for r in records:
            if r.component.component_type == "EARNING":
                total_earnings += r.amount
            else:
                total_deductions += r.amount

        data = {
            "run_id": run.id,
            "business": run.business.name,
            "month": run.month.isoformat(),
            "cycle": {
                "id": run.payroll_cycle_id,
                "name": run.payroll_cycle.name,
                "type": run.payroll_cycle.cycle_type,
            },
            "counts": {
                "records": records.count(),
            },
            "totals": {
                "earnings": str(total_earnings),
                "deductions": str(total_deductions),
                "net": str(total_earnings - total_deductions),
            },
        }
        return Response(data)