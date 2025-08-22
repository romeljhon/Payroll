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
    PayrollRecordViewSet  # ✅ ViewSet for PayrollRecord
)

# Initialize DRF router and register your ViewSet
router = DefaultRouter()
router.register(r'payroll/components', SalaryComponentViewSet, basename='salarycomponent')
router.register(r'payroll/structures', SalaryStructureViewSet, basename='salarystructure')
router.register(r'payroll/policies', PayrollPolicyViewSet, basename='payrollpolicy')
router.register(r'payroll/cycles', PayrollCycleViewSet, basename='payrollcycle')
router.register(r'payroll/records', PayrollRecordViewSet, basename='payrollrecord')  # ✅ Register PayrollRecord ViewSet

urlpatterns = [
    path('payroll/generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('payroll/summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('payroll/13th/', Generate13thMonthView.as_view(), name='generate-13th'),
    path('payroll/payslip/', PayslipPreviewView.as_view(), name='payslip-preview'),
    path('payroll/batch/', BatchPayrollGenerationView.as_view(), name='generate-batch'),

    path('', include(router.urls)),
]
