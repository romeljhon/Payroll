# payroll/services/payslip_snapshot.py
from __future__ import annotations

from decimal import Decimal
from datetime import date
from typing import Dict, List, Optional

from django.shortcuts import get_object_or_404
from django.db.models import Sum

from employees.models import Employee
from payroll.models import PayrollRecord, SalaryComponent, PayrollCycle, PayrollRun


def get_employee_payslip_snapshot(
    employee_id: int,
    month: date,
    run_id: Optional[int] = None,            # ✅ MODIFIED: prefer run pinning
    cycle_type: Optional[str] = None,        # ✅ MODIFIED: fallback to cycle type
    include_13th: bool = False,              # ✅ MODIFIED: default exclude 13th
) -> Dict:
    """
    Read finalized payroll line-items for one employee in a given month,
    filtered by a specific run (preferred) or a cycle_type (SEMI_1|SEMI_2|MONTHLY).

    Returns a dict suitable for rendering or PDF export:
      {
        "employee_id", "employee_name", "employee_email",
        "month", "cycle_type", "run_id",
        "rows": [ { "component", "type", "amount" }, ... ],
        "totals": { "earnings", "deductions", "net_pay" }
      }
    """
    # Fetch employee (and business for cycle resolution)
    employee = get_object_or_404(
        Employee.objects.select_related("branch__business"),
        pk=employee_id
    )
    business = getattr(employee.branch, "business", None)
    if not business:
        # Keep consistent with your API behavior
        raise ValueError("Employee must belong to a branch with a business.")

    # Base queryset
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

    # Narrow by run first (most precise)
    if run_id is not None:
        qs = qs.filter(run_id=run_id)
        used_run_id = run_id
    elif cycle_type:
        used_cycle_type = str(cycle_type).upper()
        cycle = get_object_or_404(
            PayrollCycle,
            business=business,
            cycle_type=used_cycle_type,
            is_active=True,
        )
        qs = qs.filter(payroll_cycle=cycle)
    else:
        # No run/cycle specified: if multiple cycles exist in this month, require disambiguation
        distinct_cycles = qs.values_list("payroll_cycle__cycle_type", flat=True).distinct()
        if distinct_cycles.count() > 1:
            raise ValueError("Multiple cycles found for this employee/month. Provide run_id or cycle_type.")

        used_cycle_type = distinct_cycles.first() if distinct_cycles.exists() else None

    rows: List[Dict] = []
    earnings = Decimal("0.00")
    deductions = Decimal("0.00")

    for r in qs:
        rows.append({
            "component": r.component.name,
            "type": r.component.component_type,  # 'EARNING' or 'DEDUCTION'
            "amount": r.amount,                  # Decimal is fine for internal usage
        })
        if r.component.component_type == SalaryComponent.EARNING:
            earnings += r.amount
        else:
            deductions += r.amount

    net = earnings - deductions

    # Identity (use employee we already fetched; don’t rely on qs[0])
    emp_name = f"{employee.first_name} {employee.last_name}".strip()
    emp_email = getattr(employee, "email", None)

    return {
        "employee_id": employee_id,
        "employee_name": emp_name,
        "employee_email": emp_email,
        "month": month,
        "cycle_type": used_cycle_type,   # ✅ MODIFIED: standardized key
        "run_id": used_run_id,           # ✅ MODIFIED
        "rows": rows,
        "totals": {
            "earnings": earnings,
            "deductions": deductions,
            "net_pay": net,
        },
    }
