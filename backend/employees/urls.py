from django.urls import path, include
from rest_framework.routers import DefaultRouter

from employees.views import EmployeeViewSet


router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),  # 🔁 All auto-generated routes

]
