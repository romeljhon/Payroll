from django.urls import path, include
from rest_framework.routers import DefaultRouter

from organization.views import BusinessViewSet, BranchViewSet, WorkSchedulePolicyViewSet


router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'work-schedule-policies', WorkSchedulePolicyViewSet, basename='work-schedule-policy')

urlpatterns = [
    path('', include(router.urls)),  # 🔁 All auto-generated routes

]
