from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal

from timekeeping.models import TimeLog
from .models import PayrollCycle, PayrollPolicy, Position, SalaryComponent, SalaryStructure, PayrollRecord
from employees.models import Employee
from .serializers import PayrollPolicySerializer, PositionSerializer, SalaryComponentSerializer, SalaryStructureSerializer, GeneratePayrollSerializer, PayrollSummarySerializer, PayslipComponentSerializer
from datetime import date
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema
from payroll.services.payroll_cycles import get_dynamic_cutoff

@extend_schema(tags=["Payroll"])
class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

@extend_schema(tags=["Payroll"])
class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer

@extend_schema(tags=["Payroll"])
class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer

@extend_schema(tags=["Payroll"])
class GeneratePayrollView(APIView):
    def post(self, request):
        serializer = GeneratePayrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee_id = serializer.validated_data['employee_id']
        month = serializer.validated_data['month']
        base_salary = serializer.validated_data['base_salary']
        cycle_type = serializer.validated_data['payroll_cycle']

        employee = get_object_or_404(Employee, id=employee_id)
        position = employee.position

        # 🔥 Get cutoff dates dynamically
        try:
            cutoff_start, cutoff_end = get_dynamic_cutoff(
                month, cycle_type, employee.branch.business
            )
        except PayrollCycle.DoesNotExist:
            return Response({
                "error": f"No payroll cycle of type {cycle_type} configured for this business."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch salary structure
        structures = SalaryStructure.objects.filter(position=position)
        generated = []

        for struct in structures:
            component = struct.component
            # Compute amount
            if struct.is_percentage:
                amount = (Decimal(struct.amount) / 100) * base_salary
            else:
                amount = struct.amount

            # Create/update PayrollRecord
            record, created = PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=component,
                defaults={
                    'amount': amount,
                    'is_13th_month': False,
                    'payroll_cycle': cycle_type  # 🔁 save cycle type
                }
            )

            generated.append({
                "component": component.name,
                "amount": str(amount),
                "type": component.component_type,
                "status": "created" if created else "updated"
            })

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month.strftime('%B %Y'),
            "cutoff": {
                "start": cutoff_start,
                "end": cutoff_end,
                "cycle_type": cycle_type
            },
            "records": generated
        }, status=status.HTTP_200_OK)

@extend_schema(tags=["Payroll"])    
class PayrollSummaryView(APIView):
    def get(self, request):
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month')

        if not employee_id or not month:
            return Response({"error": "employee_id and month are required."}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)
        records = PayrollRecord.objects.filter(employee=employee, month=month, is_13th_month=False)

        earnings = records.filter(component__component_type='EARNING').aggregate(total=Sum('amount'))['total'] or 0
        deductions = records.filter(component__component_type='DEDUCTION').aggregate(total=Sum('amount'))['total'] or 0

        serializer = PayrollSummarySerializer(records, many=True)

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month,
            "earnings": round(earnings, 2),
            "deductions": round(deductions, 2),
            "net_pay": round(earnings - deductions, 2),
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
        month = request.query_params.get("month")

        if not employee_id or not month:
            return Response({"error": "employee_id and month are required."}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)
        records = PayrollRecord.objects.filter(
            employee=employee,
            month=month
        ).order_by('component__component_type')

        earnings = sum(r.amount for r in records if r.component.component_type == "EARNING")
        deductions = sum(r.amount for r in records if r.component.component_type == "DEDUCTION")

        serializer = PayslipComponentSerializer(records, many=True)

        return Response({
            "employee": {
                "name": f"{employee.first_name} {employee.last_name}",
                "position": employee.position.name,
                "branch": employee.branch.name,
            },
            "month": month,
            "components": serializer.data,
            "total_earnings": float(round(earnings, 2)),
            "total_deductions": float(round(deductions, 2)),
            "net_pay": float(round(earnings - deductions, 2))
        })

@extend_schema(tags=["Payroll"])
class BatchPayrollGenerationView(APIView):
    def post(self, request):
        month = request.data.get("month")
        base_salaries = request.data.get("base_salaries")  # { employee_id: base_salary }
        payroll_cycle = request.data.get("payroll_cycle", "MONTHLY")

        if not month or not base_salaries:
            return Response({"error": "month and base_salaries are required."}, status=400)

        results = []

        # Constants
        working_days = Decimal(22)
        ot_multiplier = Decimal('1.25')
        holiday_multipliers = {
            'REGULAR': Decimal('2.0'),
            'SPECIAL': Decimal('1.3')
        }

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

            daily_rate = Decimal(base_salary) / working_days
            hourly_rate = daily_rate / 8
            minute_rate = hourly_rate / 60

            # 🧱 Fixed Salary Structure
            structures = SalaryStructure.objects.filter(position=position)
            for struct in structures:
                component = struct.component
                amount = (Decimal(struct.amount) / 100) * Decimal(base_salary) if struct.is_percentage else struct.amount

                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=component,
                    defaults={
                        'amount': round(amount, 2),
                        'is_13th_month': False,
                        'payroll_cycle': payroll_cycle
                    }
                )

            # ⏱ Time-based Additions/Deductions
            timelogs = TimeLog.objects.filter(employee=employee, date__range=(cutoff_start, cutoff_end))

            total_ot = timelogs.aggregate(Sum('ot_hours'))['ot_hours__sum'] or 0
            total_late = timelogs.aggregate(Sum('late_minutes'))['late_minutes__sum'] or 0
            total_undertime = timelogs.aggregate(Sum('undertime_minutes'))['undertime_minutes__sum'] or 0
            total_absents = timelogs.filter(is_absent=True).count()

            # OT
            try:
                ot_component = SalaryComponent.objects.get(code="OT")
                ot_amount = Decimal(total_ot) * hourly_rate * ot_multiplier
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=ot_component,
                    defaults={
                        'amount': round(ot_amount, 2),
                        'is_13th_month': False,
                        'payroll_cycle': payroll_cycle
                    }
                )
            except SalaryComponent.DoesNotExist:
                pass

            # Late
            try:
                late_component = SalaryComponent.objects.get(code="LATE")
                late_amount = Decimal(total_late) * minute_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=late_component,
                    defaults={
                        'amount': round(late_amount, 2),
                        'is_13th_month': False,
                        'payroll_cycle': payroll_cycle
                    }
                )
            except SalaryComponent.DoesNotExist:
                pass

            # Undertime
            try:
                undertime_component = SalaryComponent.objects.get(code="UNDERTIME")
                undertime_amount = Decimal(total_undertime) * minute_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=undertime_component,
                    defaults={
                        'amount': round(undertime_amount, 2),
                        'is_13th_month': False,
                        'payroll_cycle': payroll_cycle
                    }
                )
            except SalaryComponent.DoesNotExist:
                pass

            # Absences
            try:
                absent_component = SalaryComponent.objects.get(code="ABSENT")
                absent_amount = Decimal(total_absents) * daily_rate
                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=absent_component,
                    defaults={
                        'amount': round(absent_amount, 2),
                        'is_13th_month': False,
                        'payroll_cycle': payroll_cycle
                    }
                )
            except SalaryComponent.DoesNotExist:
                pass

            # Holidays
            holiday_totals = {}
            for log in timelogs:
                if log.holiday and log.ot_hours:
                    h_type = log.holiday.type  # 'REGULAR' or 'SPECIAL'
                    multiplier = holiday_multipliers.get(h_type)
                    if multiplier:
                        amount = hourly_rate * Decimal(log.ot_hours) * multiplier
                        holiday_totals[h_type] = holiday_totals.get(h_type, 0) + amount

            for h_type, amount in holiday_totals.items():
                try:
                    component = SalaryComponent.objects.get(code=f"HOLIDAY_{h_type}")
                    PayrollRecord.objects.update_or_create(
                        employee=employee,
                        month=month,
                        component=component,
                        defaults={
                            'amount': round(amount, 2),
                            'is_13th_month': False,
                            'payroll_cycle': payroll_cycle
                        }
                    )
                except SalaryComponent.DoesNotExist:
                    continue

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
        }, status=status.HTTP_200_OK)

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
