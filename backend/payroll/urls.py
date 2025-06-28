from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GeneratePayrollView,
    PayrollSummaryView,
    Generate13thMonthView,
    PayslipPreviewView,
    BatchPayrollGenerationView,
    PayrollPolicyViewSet,  # ✅ ViewSet for PayrollPolicy
)

# Initialize DRF router and register your ViewSet
router = DefaultRouter()
router.register(r'payroll-policies', PayrollPolicyViewSet, basename='payrollpolicy')

urlpatterns = [
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('generate-13th/', Generate13thMonthView.as_view(), name='generate-13th'),
    path('payslip/', PayslipPreviewView.as_view(), name='payslip-preview'),
    path('generate-batch/', BatchPayrollGenerationView.as_view(), name='generate-batch'),

    # DRF ViewSet URLs
    path('', include(router.urls)),
]
