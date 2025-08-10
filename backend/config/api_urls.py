# config/api_urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

from organization.views import BusinessViewSet, BranchViewSet
from employees.views import EmployeeViewSet
from payroll.views import SalaryComponentViewSet, SalaryStructureViewSet
from positions.views import PositionViewSet
from timekeeping.views import TimeLogViewSet
from email_sender.views import SendSinglePayslipView

router = DefaultRouter()
router.register('businesses', BusinessViewSet)
router.register('branches', BranchViewSet)
router.register('employees', EmployeeViewSet)
router.register('positions', PositionViewSet)
router.register('components', SalaryComponentViewSet)
router.register('structure', SalaryStructureViewSet)
router.register('timekeeping', TimeLogViewSet)

urlpatterns = [
    # Non-ViewSet endpoints go here:
    path('email/send-single-payslip/', SendSinglePayslipView.as_view(), name='send-single-payslip'),
]

# Include router-generated endpoints
urlpatterns += router.urls
