from django.urls import path, include
from rest_framework.routers import DefaultRouter
from timekeeping.views import BulkTimeLogUploadView, TimeLogViewSet, HolidayViewSet

router = DefaultRouter()
router.register(r'timelogs', TimeLogViewSet)
router.register(r'holidays', HolidayViewSet, basename='holidays')

urlpatterns = [
    path('', include(router.urls)),
    path('timelogs/bulk/', BulkTimeLogUploadView.as_view(), name='bulk-timelog-upload'),  # 👈 Custom route
]