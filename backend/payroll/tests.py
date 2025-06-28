from decimal import Decimal
from datetime import date, datetime
from employees.models import Employee
from payroll.models import SalaryStructure, SalaryComponent, PayrollCycle
from payroll.services.payroll_cycles import get_dynamic_cutoff
from timekeeping.models import TimeLog

def dry_run_generate_payroll(employee_id: int, base_salary: Decimal, month: date, payroll_cycle: str = "SEMI_1"):
    employee = Employee.objects.get(id=employee_id)
    position = employee.position
    business = employee.branch.business
    policy = business.payroll_policy

    try:
        cutoff_start, cutoff_end = get_dynamic_cutoff(month, payroll_cycle, business)
    except PayrollCycle.DoesNotExist:
        return {"error": f"No payroll cycle of type {payroll_cycle} for business {business.name}"}

    daily_rate = base_salary / policy.standard_working_days
    hourly_rate = daily_rate / Decimal(8)
    minute_rate = hourly_rate / Decimal(60)

    fixed = []
    structures = SalaryStructure.objects.filter(position=position)
    for struct in structures:
        amount = (Decimal(struct.amount) / 100 * base_salary) if struct.is_percentage else struct.amount
        fixed.append({
            "component": struct.component.name,
            "amount": round(amount, 2),
            "type": struct.component.component_type,
            "source": "SalaryStructure"
        })

    logs = TimeLog.objects.filter(employee=employee, date__range=(cutoff_start, cutoff_end))
    time_components = []

    for log in logs:
        analyzed = []
        schedule = employee.branch.work_schedule
        expected_in = schedule.time_in
        expected_out = schedule.time_out

        # LATE
        if log.time_in and expected_in and (log.time_in > expected_in):
            late_minutes = (datetime.combine(log.date, log.time_in) - datetime.combine(log.date, expected_in)).seconds / 60
            if late_minutes > policy.grace_minutes:
                time_components.append({
                    "component": "LATE",
                    "amount": round(Decimal(late_minutes) * policy.late_penalty_per_minute, 2),
                    "type": "DEDUCTION",
                    "source": "TimeLog",
                    "log_date": str(log.date)
                })

        # OT
        if log.ot_hours:
            time_components.append({
                "component": "OT",
                "amount": round(Decimal(log.ot_hours) * hourly_rate * policy.ot_multiplier, 2),
                "type": "EARNING",
                "source": "TimeLog",
                "log_date": str(log.date)
            })

        # Holiday OT
        if log.holiday and log.ot_hours:
            mult = policy.holiday_regular_multiplier if log.holiday.type == "REGULAR" else policy.holiday_special_multiplier
            comp = f"HOLIDAY_{log.holiday.type}"
            time_components.append({
                "component": comp,
                "amount": round(Decimal(log.ot_hours) * hourly_rate * mult, 2),
                "type": "EARNING",
                "source": "Holiday OT",
                "log_date": str(log.date)
            })

    all_components = fixed + time_components
    earnings = sum(c["amount"] for c in all_components if c["type"] == "EARNING")
    deductions = sum(c["amount"] for c in all_components if c["type"] == "DEDUCTION")

    return {
        "employee": f"{employee.first_name} {employee.last_name}",
        "cutoff_start": cutoff_start,
        "cutoff_end": cutoff_end,
        "base_salary": base_salary,
        "earnings": round(earnings, 2),
        "deductions": round(deductions, 2),
        "net_pay": round(earnings - deductions, 2),
        "components": all_components
    }
