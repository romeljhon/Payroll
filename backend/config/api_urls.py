# config/api_urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

from organization.views import BusinessViewSet, BranchViewSet, WorkSchedulePolicyViewSet
from employees.views import EmployeeViewSet
from payroll.views import BatchPayrollGenerationView, Generate13thMonthView, GeneratePayrollView, PayrollSummaryView, PayslipPreviewView, SalaryComponentViewSet, SalaryStructureViewSet, PayrollCycleViewSet, PayrollRecordViewSet, PayrollPolicyViewSet, SalaryRateViewSet, PayrollRunViewSet
from positions.views import PositionViewSet
from timekeeping.views import TimeLogViewSet, HolidayViewSet
from timekeeping.views import TimeLogImportView
from email_sender.views import SendSinglePayslipView

router = DefaultRouter()
router.register('businesses', BusinessViewSet)
router.register('branches', BranchViewSet)
router.register('work-schedule-policies', WorkSchedulePolicyViewSet)
router.register('employees', EmployeeViewSet)
router.register('positions', PositionViewSet)
router.register('components', SalaryComponentViewSet)
router.register('structure', SalaryStructureViewSet)
router.register('timekeeping', TimeLogViewSet)
router.register('holidays', HolidayViewSet)
router.register('payrollcycle', PayrollCycleViewSet)
router.register('policy', PayrollPolicyViewSet)
router.register('records', PayrollRecordViewSet)
router.register('salary-rates', SalaryRateViewSet)
router.register('payroll-runs', PayrollRunViewSet)

urlpatterns = [
    # Non-ViewSet endpoints go here:
    path('email/send-single-payslip/', SendSinglePayslipView.as_view(), name='send-single-payslip'),
    path('timelogs/import/', TimeLogImportView.as_view(), name='timelog-import'),
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('13th/', Generate13thMonthView.as_view(), name='generate-13th'),
    path('payslip/', PayslipPreviewView.as_view(), name='payslip-preview'),
    path('batch/', BatchPayrollGenerationView.as_view(), name='generate-batch'),
]

# Include router-generated endpoints
urlpatterns += router.urls
