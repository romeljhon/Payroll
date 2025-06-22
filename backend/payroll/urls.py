from django.urls import path
from .views import GeneratePayrollView, PayrollSummaryView, Generate13thMonthView, PayslipPreviewView, BatchPayrollGenerationView

urlpatterns = [
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('generate-13th/', Generate13thMonthView.as_view(), name='generate-13th'),
    path('payslip/', PayslipPreviewView.as_view(), name='payslip-preview'),
    path('generate-batch/', BatchPayrollGenerationView.as_view(), name='generate-batch'), 
]
