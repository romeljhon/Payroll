from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.db import transaction
from timekeeping.models import TimeLog
from .models import PayrollCycle, PayrollPolicy, SalaryComponent, SalaryStructure, PayrollRecord
from employees.models import Employee
from .serializers import PayrollPolicySerializer, PayrollSummaryResponseSerializer, SalaryComponentSerializer, SalaryStructureSerializer, GeneratePayrollSerializer, PayrollSummarySerializer, PayslipComponentSerializer
from datetime import date
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema
from payroll.services.payroll_cycles import get_dynamic_cutoff
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle
from django.utils.dateparse import parse_date



@extend_schema(tags=["Payroll"])
class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer

@extend_schema(tags=["Payroll"])
class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer


def normalize_month(value) -> date:
    """
    Accepts date or string 'YYYY-MM' / 'YYYY-MM-DD' and returns first day of that month.
    """
    if isinstance(value, date):
        return value.replace(day=1)
    d = parse_date(value)
    if d:
        return d.replace(day=1)
    year, month = map(int, str(value).split("-")[:2])
    return date(year, month, 1)

def compute_regular_monthly_gross(position, base_salary: Decimal) -> Decimal:
    """
    Compute monthly 'regular' gross (BASIC + other EARNING items from SalaryStructure).
    Uses base_salary + position's structures. Excludes time-based items (OT/holiday).
    """
    total = Decimal("0.00")
    from payroll.models import SalaryStructure, SalaryComponent
    structures = SalaryStructure.objects.filter(position=position).select_related("component")
    for s in structures:
        amt = (Decimal(s.amount) / Decimal("100.00")) * base_salary if s.is_percentage else Decimal(s.amount)
        if s.component.component_type == SalaryComponent.EARNING:
            total += amt
    return total.quantize(Decimal("0.01"))

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
        # Input
        employee_id = request.data.get("employee_id")
        base_salary_raw = request.data.get("base_salary")
        month_param = request.data.get("month")
        cycle_type = request.data.get("cycle_type", "MONTHLY")

        if not employee_id or not base_salary_raw or not month_param:
            return Response({"error": "employee_id, base_salary, and month are required."}, status=400)

        try:
            month = normalize_month(month_param)
        except Exception as e:
            return Response({"error": f"Invalid month: {e}"}, status=400)

        try:
            base_salary = Decimal(str(base_salary_raw))
        except (InvalidOperation, TypeError, ValueError):
            return Response({"error": "base_salary must be a valid number."}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)

        # Guards
        if not employee.branch or not getattr(employee.branch, "business", None):
            return Response({"error": "Employee must belong to a branch with a business."}, status=400)
        if not employee.position:
            return Response({"error": "Employee must have a position."}, status=400)

        # Cutoff (wrap-aware)
        try:
            cutoff_start, cutoff_end = get_dynamic_cutoff(month, cycle_type, employee.branch.business)
        except PayrollCycle.DoesNotExist:
            return Response({"error": f"No payroll cycle '{cycle_type}' found for this business."}, status=400)

        generated = []
        policy = getattr(employee.branch.business, "payroll_policy", None)

        with transaction.atomic():
            # Fixed components from SalaryStructure
            structures = SalaryStructure.objects.filter(position=employee.position).select_related("component")
            for struct in structures:
                component = struct.component
                amount = (Decimal(struct.amount) / Decimal("100")) * base_salary if struct.is_percentage else Decimal(struct.amount)

                _, created = PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=component,
                    payroll_cycle=cycle_type,  # in lookup (unique key)
                    defaults={"amount": amount.quantize(Decimal("0.01")), "is_13th_month": False},
                )
                generated.append({
                    "component": component.name,
                    "code": component.code,
                    "type": component.component_type,
                    "amount": str(amount.quantize(Decimal("0.01"))),
                    "status": "created" if created else "updated",
                })

            # PH Mandatories (monthly basis, allocated to cycle)
            gross_monthly = compute_regular_monthly_gross(employee.position, base_salary)
            monthly = compute_mandatories_monthly(gross_monthly, policy)
            per_cycle = allocate_to_cycle(monthly, cycle_type)
            comp_map = {c.code: c for c in SalaryComponent.objects.filter(code__in=per_cycle.keys())}

            mandatory_rows = []
            for code, amt in per_cycle.items():
                comp = comp_map.get(code)
                if not comp:
                    continue
                _, created = PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=comp,
                    payroll_cycle=cycle_type,
                    defaults={"amount": amt, "is_13th_month": False},
                )
                mandatory_rows.append({
                    "component": comp.name,
                    "code": comp.code,
                    "type": comp.component_type,
                    "amount": str(amt),
                    "status": "created" if created else "updated",
                })

        # Response
        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month.strftime("%B %Y"),
            "cutoff": {"start": cutoff_start, "end": cutoff_end, "cycle_type": cycle_type},
            "regular_gross_monthly": str(gross_monthly),
            "records": generated + mandatory_rows,
        }, status=200)
    
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
        payroll_cycle = request.data.get("payroll_cycle", "MONTHLY")

        if not month_param or not base_salaries:
            return Response({"error": "month and base_salaries are required."}, status=400)

        try:
            month = normalize_month(month_param)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        results = []

        # policy-driven defaults (fallbacks)
        DEFAULT_WORKING_DAYS = Decimal("22")
        DEFAULT_OT_MULTIPLIER = Decimal("1.25")
        HOLIDAY_MULTIPLIERS = {'REGULAR': Decimal('2.0'), 'SPECIAL': Decimal('1.3')}

        # Cache frequently used components by code
        comp_by_code = {c.code: c for c in SalaryComponent.objects.filter(code__in=["OT", "LATE", "UNDERTIME", "ABSENT", "HOLIDAY_REGULAR", "HOLIDAY_SPECIAL"])}

        for employee_id, base_salary in base_salaries.items():
            employee = get_object_or_404(Employee, id=employee_id)
            position = employee.position

            try:
                cutoff_start, cutoff_end = get_dynamic_cutoff(month, payroll_cycle, employee.branch.business)
            except Exception:
                results.append({
                    "employee_id": employee.id,
                    "error": f"No payroll cycle '{payroll_cycle}' found for business"
                })
                continue

            # Use policy if available
            policy = getattr(employee.branch.business, "payroll_policy", None)
            working_days = getattr(policy, "standard_working_days", DEFAULT_WORKING_DAYS) or DEFAULT_WORKING_DAYS
            ot_multiplier = getattr(policy, "ot_multiplier", DEFAULT_OT_MULTIPLIER) or DEFAULT_OT_MULTIPLIER

            daily_rate = Decimal(base_salary) / Decimal(working_days)
            hourly_rate = daily_rate / Decimal(8)
            minute_rate = hourly_rate / Decimal(60)

            # Fixed Salary Structure
            structures = SalaryStructure.objects.filter(position=position).select_related("component")
            for struct in structures:
                component = struct.component
                amount = (Decimal(struct.amount) / Decimal(100)) * Decimal(base_salary) if struct.is_percentage else struct.amount

                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=component,
                    payroll_cycle=payroll_cycle,  # 👈 include in lookup
                    defaults={
                        'amount': amount.quantize(Decimal("0.01")) if isinstance(amount, Decimal) else round(Decimal(amount), 2),
                        'is_13th_month': False,
                    }
                )

            # Time-based components in cutoff
            timelogs = TimeLog.objects.filter(employee=employee, date__range=(cutoff_start, cutoff_end))

            total_ot = timelogs.aggregate(Sum('ot_hours'))['ot_hours__sum'] or 0
            total_late = timelogs.aggregate(Sum('late_minutes'))['late_minutes__sum'] or 0
            total_undertime = timelogs.aggregate(Sum('undertime_minutes'))['undertime_minutes__sum'] or 0
            total_absents = timelogs.filter(is_absent=True).count()

            # OT
            if (c := comp_by_code.get("OT")):
                ot_amount = Decimal(total_ot) * hourly_rate * Decimal(ot_multiplier)
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=c,
                    payroll_cycle=payroll_cycle,
                    defaults={'amount': ot_amount.quantize(Decimal("0.01")), 'is_13th_month': False}
                )

            # Late
            if (c := comp_by_code.get("LATE")):
                late_amount = Decimal(total_late) * minute_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=c,
                    payroll_cycle=payroll_cycle,
                    defaults={'amount': late_amount.quantize(Decimal("0.01")), 'is_13th_month': False}
                )

            # Undertime
            if (c := comp_by_code.get("UNDERTIME")):
                undertime_amount = Decimal(total_undertime) * minute_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=c,
                    payroll_cycle=payroll_cycle,
                    defaults={'amount': undertime_amount.quantize(Decimal("0.01")), 'is_13th_month': False}
                )

            # Absences
            if (c := comp_by_code.get("ABSENT")):
                absent_amount = Decimal(total_absents) * daily_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=c,
                    payroll_cycle=payroll_cycle,
                    defaults={'amount': absent_amount.quantize(Decimal("0.01")), 'is_13th_month': False}
                )

            # Holidays OT in cutoff
            holiday_totals = {}
            for log in timelogs:
                if log.holiday and log.ot_hours:
                    h_type = log.holiday.type  # 'REGULAR' or 'SPECIAL'
                    multiplier = HOLIDAY_MULTIPLIERS.get(h_type)
                    if multiplier:
                        amount = hourly_rate * Decimal(log.ot_hours) * multiplier
                        holiday_totals[h_type] = holiday_totals.get(h_type, Decimal("0.00")) + amount

            for h_type, amount in holiday_totals.items():
                code = f"HOLIDAY_{h_type}"
                c = comp_by_code.get(code)
                if not c:
                    continue
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=c,
                    payroll_cycle=payroll_cycle,
                    defaults={'amount': amount.quantize(Decimal("0.01")), 'is_13th_month': False}
                )

            results.append({
                "employee_id": employee.id,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "cutoff_start": str(cutoff_start),
                "cutoff_end": str(cutoff_end),
                "base_salary": str(base_salary),
                "status": "success"
            })

        return Response({
            "month": month,
            "payroll_cycle": payroll_cycle,
            "processed": len(results),
            "results": results
        }, status=200)

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
