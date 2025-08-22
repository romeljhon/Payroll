# payroll/services/payroll_engine.py

from datetime import date
from decimal import Decimal

from payroll.models import (
    PayrollRecord,
    SalaryStructure,
    SalaryComponent,
    PayrollPolicy,
)
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle
from payroll.services.payroll_cycles import get_dynamic_cutoff
from payroll.services.time_analysis import compute_time_based_components
from payroll.services.helpers import compute_regular_monthly_gross
from django.db import transaction

def generate_payroll_for_employee(
    employee,
    base_salary: Decimal,
    month: date,
    cycle_type: str,
    run=None
) -> dict:
    """
    Core payroll generator: builds PayrollRecords for an employee in a given month + cycle.
    Optionally attaches to a PayrollRun instance.
    """
    if not employee.position or not employee.branch or not employee.branch.business:
        raise ValueError("Employee must be assigned to a branch, position, and business.")

    business = employee.branch.business
    policy = getattr(business, "payroll_policy", None)

    try:
        cutoff_start, cutoff_end = get_dynamic_cutoff(month, cycle_type, business)
    except Exception as e:
        raise ValueError(f"Unable to compute cutoff: {e}")

    with transaction.atomic():
        generated = []

        # Fixed salary components from SalaryStructure
        structures = SalaryStructure.objects.filter(position=employee.position).select_related("component")
        for struct in structures:
            comp = struct.component
            amount = (
                (Decimal(struct.amount) / Decimal("100")) * base_salary
                if struct.is_percentage else
                Decimal(struct.amount)
            ).quantize(Decimal("0.01"))

            PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=cycle_type,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run  # 🔧 attached to PayrollRun
                }
            )

            generated.append({
                "component": comp.name,
                "code": comp.code,
                "type": comp.component_type,
                "amount": str(amount),
                "source": "structure"
            })

        # Mandatories
        gross_monthly = compute_regular_monthly_gross(employee.position, base_salary)
        monthly_mandatories = compute_mandatories_monthly(gross_monthly, policy)
        allocated = allocate_to_cycle(monthly_mandatories, cycle_type)
        components = SalaryComponent.objects.filter(code__in=allocated.keys())
        comp_map = {c.code: c for c in components}

        for code, amount in allocated.items():
            comp = comp_map.get(code)
            if not comp:
                continue

            PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=cycle_type,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run
                }
            )

            generated.append({
                "component": comp.name,
                "code": comp.code,
                "type": comp.component_type,
                "amount": str(amount),
                "source": "mandatories"
            })

        # Time-based components (OT, late, undertime, absent, etc.)
        time_rows = compute_time_based_components(employee, month)
        for row in time_rows:
            comp = row["component"]
            amount = row["amount"]

            PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=cycle_type,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run
                }
            )

            generated.append({
                "component": comp.name,
                "code": comp.code,
                "type": comp.component_type,
                "amount": str(amount),
                "source": "time-analysis"
            })

    return {
        "employee_id": employee.id,
        "employee_name": f"{employee.first_name} {employee.last_name}",
        "month": month.strftime("%Y-%m"),
        "cycle_type": cycle_type,
        "cutoff": {
            "start": cutoff_start,
            "end": cutoff_end,
        },
        "records_generated": generated,
    }


def generate_batch_payroll(
    base_salaries: dict,
    month: date,
    cycle_type: str,
    run=None
) -> list[dict]:
    """
    Bulk generation for multiple employees.
    base_salaries = { employee_id: base_salary }
    Optional: attach to a PayrollRun.
    Returns list of result dicts per employee.
    """
    from employees.models import Employee
    results = []

    for emp_id, raw_salary in base_salaries.items():
        try:
            employee = Employee.objects.select_related("position", "branch__business").get(id=emp_id)
            base_salary = Decimal(str(raw_salary))
            result = generate_payroll_for_employee(employee, base_salary, month, cycle_type, run=run)
            result["status"] = "success"
            results.append(result)
        except Exception as e:
            results.append({
                "employee_id": emp_id,
                "status": "error",
                "error": str(e)
            })

    return results
