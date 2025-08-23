from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GeneratePayrollView,
    PayrollSummaryView,
    Generate13thMonthView,
    PayslipPreviewView,
    BatchPayrollGenerationView,
    PayrollPolicyViewSet,
    SalaryComponentViewSet,
    SalaryStructureViewSet,
    PayrollCycleViewSet,  # ✅ ViewSet for PayrollPolicy
    PayrollRecordViewSet,  # ✅ ViewSet for PayrollRecord
    SalaryRateViewSet,
    PayrollRunViewSet
)

# Initialize DRF router and register your ViewSet
router = DefaultRouter()
router.register(r'components', SalaryComponentViewSet, basename='salarycomponent')
router.register(r'structures', SalaryStructureViewSet, basename='salarystructure')
router.register(r'policies', PayrollPolicyViewSet, basename='payrollpolicy')
router.register(r'cycles', PayrollCycleViewSet, basename='payrollcycle')
router.register(r'records', PayrollRecordViewSet, basename='payrollrecord')
router.register(r'salary-rates', SalaryRateViewSet, basename='salaryrate')
router.register(r'runs', PayrollRunViewSet, basename='payrollrun')

urlpatterns = [
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('13th/', Generate13thMonthView.as_view(), name='generate-13th'),
    path('payslip/', PayslipPreviewView.as_view(), name='payslip-preview'),
    path('batch/', BatchPayrollGenerationView.as_view(), name='generate-batch'),

    path('', include(router.urls)),
]
