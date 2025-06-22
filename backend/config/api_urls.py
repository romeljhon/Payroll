# config/api_urls.py
from rest_framework.routers import DefaultRouter
from organization.views import BusinessViewSet, BranchViewSet
from employees.views import EmployeeViewSet
from payroll.views import PositionViewSet, SalaryComponentViewSet, SalaryStructureViewSet

router = DefaultRouter()
router.register('businesses', BusinessViewSet)
router.register('branches', BranchViewSet)
router.register('employees', EmployeeViewSet)
router.register('positions', PositionViewSet)
router.register('components', SalaryComponentViewSet)
router.register('structure', SalaryStructureViewSet)

urlpatterns = router.urls
