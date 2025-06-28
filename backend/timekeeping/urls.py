from django.urls import path, include
from rest_framework.routers import DefaultRouter
from timekeeping.views import BulkTimeLogUploadView, TimeLogViewSet
from .views import BulkTimeLogUploadView  # 👈 Import the bulk upload view

router = DefaultRouter()
router.register('timelogs', TimeLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('timelogs/bulk/', BulkTimeLogUploadView.as_view(), name='bulk-timelog-upload'),  # 👈 Custom route
]