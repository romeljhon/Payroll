from django.urls import path, include
from rest_framework.routers import DefaultRouter

from organization.views import BusinessViewSet, BranchViewSet


router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),  # 🔁 All auto-generated routes

]
