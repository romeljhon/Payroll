from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeLogViewSet, BulkTimeLogUploadView  # 👈 Import the bulk upload view

router = DefaultRouter()
router.register('timelogs', TimeLogViewSet)

urlpatterns = [
    path('', include(router.urls)),  # 🔁 All auto-generated routes
    path('timelogs/bulk/', BulkTimeLogUploadView.as_view(), name='bulk-timelog-upload'),  # 👈 Custom route
]
