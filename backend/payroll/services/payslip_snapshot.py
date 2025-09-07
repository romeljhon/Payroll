# payroll/services/payslip_snapshot.py
from __future__ import annotations

from decimal import Decimal
from datetime import date
from typing import Dict, List, Optional

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from employees.models import Employee
from payroll.models import PayrollRecord, SalaryComponent, PayrollCycle, PayrollRun


def _normalize_month(value) -> date:
    """Accept date or 'YYYY-MM' / 'YYYY-MM-DD' and return first day of that month."""
    if isinstance(value, date):
        return value.replace(day=1)
    d = parse_date(str(value))
    if d:
        return d.replace(day=1)
    year, month = map(int, str(value).split("-")[:2])
    return date(year, month, 1)


def get_employee_payslip_snapshot(
    employee_id: int,
    month: date | str,
    cycle_type: Optional[str] = None,   # ✅ moved before run_id for compatibility
    run_id: Optional[int] = None,
    include_13th: bool = False,
) -> Dict:
    """
    Read finalized payroll line-items for one employee in a given month,
    filtered by a specific run (preferred) or a cycle_type (SEMI_1|SEMI_2|MONTHLY).

    Returns:
      {
        "employee_id", "employee_name", "employee_email",
        "month", "payroll_cycle", "run_id",
        "rows": [ { "component", "type", "amount" }, ... ],
        "totals": { "earnings", "deductions", "net_pay" }
      }
    """
    # Normalize inputs
    month = _normalize_month(month)

    # Employee & business
    employee = get_object_or_404(
        Employee.objects.select_related("branch__business"),
        pk=employee_id
    )
    business = getattr(employee.branch, "business", None)
    if not business:
        raise ValueError("Employee must belong to a branch with a business.")

    # Base queryset (month + employee)
    qs = (
        PayrollRecord.objects
        .select_related("component", "employee", "payroll_cycle", "run")
        .filter(employee_id=employee_id, month=month)
        .order_by("component__component_type", "component__name", "id")
    )
    if not include_13th:
        qs = qs.filter(is_13th_month=False)

    used_cycle_type: Optional[str] = None
    used_run_id: Optional[int] = None

    # Prefer narrowing by run (precise)
    if run_id is not None:
        run = get_object_or_404(
            PayrollRun.objects.select_related("payroll_cycle", "business"),
            pk=run_id
        )
        if run.business_id != business.id:
            raise ValueError("Run belongs to a different business.")
        if run.month != month:
            raise ValueError("Run month does not match requested month.")
        qs = qs.filter(run_id=run.id)
        used_run_id = run.id
        used_cycle_type = run.payroll_cycle.cycle_type

    # Else by cycle_type
    elif cycle_type:
        used_cycle_type = str(cycle_type).upper()
        cycle = get_object_or_404(
            PayrollCycle,
            business=business,
            cycle_type=used_cycle_type,
            is_active=True,
        )
        qs = qs.filter(payroll_cycle=cycle)

    # Else infer cycle if unambiguous
    else:
        distinct_cycles = qs.values_list("payroll_cycle__cycle_type", flat=True).distinct()
        count = distinct_cycles.count()
        if count > 1:
            raise ValueError("Multiple cycles found for this employee/month. Provide run_id or cycle_type.")
        if count == 1:
            used_cycle_type = distinct_cycles.first()

    # Build rows and totals
    rows: List[Dict] = []
    earnings = Decimal("0.00")
    deductions = Decimal("0.00")

    for r in qs:
        rows.append({
            "component": r.component.name,
            "type": r.component.component_type,  # 'EARNING' or 'DEDUCTION'
            "amount": r.amount,
        })
        if r.component.component_type == SalaryComponent.EARNING:
            earnings += r.amount
        else:
            deductions += r.amount

    net = earnings - deductions

    # Identity
    emp_name = f"{employee.first_name} {employee.last_name}".strip()
    emp_email = getattr(employee, "email", None)

    return {
        "employee_id": employee_id,
        "employee_name": emp_name,
        "employee_email": emp_email,
        "month": month,
        "payroll_cycle": used_cycle_type,  # keep key name consistent for email/pdf
        "run_id": used_run_id,
        "rows": rows,
        "totals": {
            "earnings": earnings,
            "deductions": deductions,
            "net_pay": net,
        },
    }
