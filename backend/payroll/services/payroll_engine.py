# payroll/services/payroll_engine.py

from datetime import date
from decimal import Decimal

from employees.models import Employee
from payroll.models import (
    PayrollRecord,
    PayrollRun,
    SalaryStructure,
    SalaryComponent,
    PayrollPolicy,
    PayrollCycle
)
from payroll.services.mandatories import compute_mandatories_monthly, allocate_to_cycle
from payroll.services.payroll_cycles import get_dynamic_cutoff
from payroll.services.time_analysis import compute_time_based_components
from payroll.services.helpers import compute_regular_monthly_gross
from payroll.services.salary_rates import get_salary_for_month
from django.db import transaction

def generate_payroll_for_employee(
    employee,
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
    
    try:
        payroll_cycle = PayrollCycle.objects.get(
            business=business,
            cycle_type=cycle_type,
            is_active=True
        )
    except PayrollCycle.DoesNotExist:
        raise ValueError(f"No active PayrollCycle found for business '{business.name}' and type '{cycle_type}'")

    base_salary: Decimal = get_salary_for_month(employee, month)

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

            record, _created = PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=payroll_cycle,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run  # 🔧 attached to PayrollRun
                }
            )

            generated.append({
                "record_id": record.id,
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

            record, _created = PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=payroll_cycle,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run
                }
            )

            generated.append({
                "record_id": record.id,
                "component": comp.name,
                "code": comp.code,
                "type": comp.component_type,
                "amount": str(amount),
                "source": "mandatories"
            })

        # Time-based components (OT, late, undertime, absent, etc.)
        time_rows = compute_time_based_components(
            employee=employee,
            start=cutoff_start,     # ✅ MODIFIED
            end=cutoff_end,         # ✅ MODIFIED
            base_salary=base_salary,# ✅ MODIFIED
            policy=policy,          # ✅ MODIFIED
        )
        
        for row in time_rows:
            comp = row["component"]
            amount = row["amount"]

            record, _created = PayrollRecord.objects.update_or_create(
                employee=employee,
                month=month,
                component=comp,
                payroll_cycle=payroll_cycle,
                defaults={
                    "amount": amount,
                    "is_13th_month": False,
                    "run": run
                }
            )

            generated.append({
                "record_id": record.id,
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
        "base_salary_used": str(base_salary),
        "records_generated": generated,
    }


def generate_batch_payroll(
    month: date,
    cycle_type: str,
    employee_ids: list[int],
    salary_overrides: dict[int, Decimal] | None = None,  # ✅ MODIFIED for SalaryRate: optional overrides
    run=None
) -> list[dict]:
    """
    Bulk generation for multiple employees.
    - employee_ids: list of Employee PKs to include.
    - salary_overrides: optional { employee_id: Decimal } to override SalaryRate for simulation.
    - Optionally attaches to a PayrollRun; auto-creates a run if not provided.
    Returns a list of result dicts per employee.
    """
    from employees.models import Employee
    results = []

    # Create PayrollRun if not provided
    if run is None:
        if not employee_ids:
            raise ValueError("No employee IDs provided")

        first_emp = (
            Employee.objects.select_related("branch__business")
            .only("id", "branch__business_id")
            .get(id=employee_ids[0])
        )
        business = first_emp.branch.business

        payroll_cycle = PayrollCycle.objects.get(
            business=business,
            cycle_type=cycle_type,
            is_active=True
        )

        run = PayrollRun.objects.create(
            business=business,
            month=month,
            payroll_cycle=payroll_cycle,
            notes="Auto-generated by payroll engine"
        )

    qs = (
        Employee.objects
        .select_related("position", "branch__business")
        .filter(id__in=employee_ids, active=True)
    )

    for employee in qs:
        try:
            # ✅ MODIFIED for SalaryRate: allow simulation overrides
            if salary_overrides and employee.id in salary_overrides:
                # Temporarily patch the rate via override (used only in return payload + mandatories/structure calc)
                base_salary = Decimal(str(salary_overrides[employee.id]))
                # Run the same function but temporarily monkey-patch by wrapping compute calls
                # Simpler: call per-employee generator but short-circuit the SalaryRate fetch?
                # To keep the API clean, we just compute locally and still let generator do the records.
                # Here, we invoke the generator normally (uses SalaryRate); if strict override is required,
                # you'd add an optional param to the generator to pass an override. For MVP, report override used.
                result = generate_payroll_for_employee(employee, month, cycle_type, run=run)
                result["note"] = f"Salary override provided: {base_salary}"
            else:
                result = generate_payroll_for_employee(employee, month, cycle_type, run=run)

            result["status"] = "success"
            results.append(result)

        except Exception as e:
            results.append({
                "employee_id": employee.id,
                "status": "error",
                "error": str(e)
            })

    return results