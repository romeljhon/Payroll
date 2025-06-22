from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Position, SalaryComponent, SalaryStructure, PayrollRecord
from employees.models import Employee, TimeLog
from .serializers import PositionSerializer, SalaryComponentSerializer, SalaryStructureSerializer, GeneratePayrollSerializer, PayrollSummarySerializer, PayslipComponentSerializer
from datetime import date
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema

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

        employee = get_object_or_404(Employee, id=employee_id)
        position = employee.position
        structures = SalaryStructure.objects.filter(position=position)

        generated = []

        for struct in structures:
            component = struct.component
            if struct.is_percentage:
                amount = (Decimal(struct.amount) / 100) * base_salary
            else:
                amount = struct.amount

            record, created = PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=component,
                defaults={'amount': amount, 'is_13th_month': False}
            )

            generated.append({
                "component": component.name,
                "amount": str(amount),
                "type": component.component_type,
                "status": "created" if created else "updated"
            })

        # 🕒 Handle Overtime
        try:
            ot_component = SalaryComponent.objects.get(code="OT")
        except SalaryComponent.DoesNotExist:
            ot_component = None

        if ot_component:
            logs = TimeLog.objects.filter(
                employee=employee,
                date__month=month.month,
                date__year=month.year
            )

            total_ot_hours = 0
            for log in logs:
                hours = log.duration_hours()
                if hours > 8:
                    total_ot_hours += hours - 8  # Overtime = hours beyond 8

            hourly_rate = base_salary / Decimal(160)
            ot_pay = hourly_rate * Decimal(total_ot_hours) * Decimal(1.25)  # 25% OT premium

            if total_ot_hours > 0:
                record, created = PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=ot_component,
                    defaults={'amount': round(ot_pay, 2), 'is_13th_month': False}
                )
                generated.append({
                    "component": ot_component.name,
                    "amount": str(round(ot_pay, 2)),
                    "type": "EARNING",
                    "status": "created" if created else "updated",
                    "hours": float(total_ot_hours)
                })

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "month": month.strftime('%B %Y'),
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
        base_salaries = request.data.get("base_salaries")

        if not month or not base_salaries:
            return Response({"error": "month and base_salaries are required."}, status=400)

        try:
            ot_component = SalaryComponent.objects.get(code="OT")
        except SalaryComponent.DoesNotExist:
            ot_component = None

        results = []

        for employee_id, base_salary in base_salaries.items():
            employee = get_object_or_404(Employee, id=employee_id)
            position = employee.position
            structures = SalaryStructure.objects.filter(position=position)

            # 🧾 Process salary structure
            for struct in structures:
                component = struct.component
                if struct.is_percentage:
                    amount = (Decimal(struct.amount) / 100) * Decimal(base_salary)
                else:
                    amount = struct.amount

                PayrollRecord.objects.update_or_create(
                    employee=employee,
                    month=month,
                    component=component,
                    defaults={'amount': amount, 'is_13th_month': False}
                )

            ot_hours = 0
            ot_amount = 0

            # 🕒 Process overtime
            if ot_component:
                logs = TimeLog.objects.filter(
                    employee=employee,
                    date__month=date.fromisoformat(month).month,
                    date__year=date.fromisoformat(month).year
                )

                for log in logs:
                    hours = log.duration_hours()
                    if hours > 8:
                        ot_hours += hours - 8

                if ot_hours > 0:
                    hourly_rate = Decimal(base_salary) / Decimal(160)
                    ot_amount = hourly_rate * Decimal(ot_hours) * Decimal(1.25)
                    PayrollRecord.objects.update_or_create(
                        employee=employee,
                        month=month,
                        component=ot_component,
                        defaults={'amount': round(ot_amount, 2), 'is_13th_month': False}
                    )

            results.append({
                "employee_id": employee.id,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "status": "processed",
                "base_salary": base_salary,
                "components_generated": structures.count() + (1 if ot_amount > 0 else 0),
                "overtime_hours": float(ot_hours),
                "overtime_pay": str(round(ot_amount, 2)) if ot_hours > 0 else "0.00"
            })

        return Response({
            "month": month,
            "total_processed": len(results),
            "results": results
        }, status=status.HTTP_200_OK)
