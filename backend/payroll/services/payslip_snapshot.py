# payroll/services/payslip_snapshot.py
from decimal import Decimal
from datetime import date
from typing import Dict, List
from django.db.models import Prefetch
from payroll.models import PayrollRecord, SalaryComponent

def get_employee_payslip_snapshot(employee_id: int, month: date, payroll_cycle: str) -> Dict:
    """
    Reads finalized payroll line-items from PayrollRecord for one employee.
    Returns rows + totals for emailing/printing.
    """
    qs = (
        PayrollRecord.objects
        .select_related("component", "employee")
        .filter(employee_id=employee_id, month=month, payroll_cycle=payroll_cycle)
        .order_by("component__component_type", "component__name")
    )

    rows: List[Dict] = []
    earnings = Decimal("0.00")
    deductions = Decimal("0.00")

    for r in qs:
        rows.append({
            "component": r.component.name,
            "type": r.component.component_type,  # EARNING / DEDUCTION
            "amount": r.amount,
        })
        if r.component.component_type == SalaryComponent.EARNING:
            earnings += r.amount
        else:
            deductions += r.amount

    net = earnings - deductions

    # Basic identity
    employee = qs[0].employee if qs else None
    emp_name = f"{employee.first_name} {employee.last_name}" if employee else ""
    emp_email = getattr(employee, "email", None)

    return {
        "employee_id": employee_id,
        "employee_name": emp_name,
        "employee_email": emp_email,
        "month": month,
        "payroll_cycle": payroll_cycle,
        "rows": rows,
        "totals": {
            "earnings": earnings,
            "deductions": deductions,
            "net_pay": net,
        },
    }
