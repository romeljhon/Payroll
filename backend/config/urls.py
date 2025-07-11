from django.contrib import admin
from django.urls import path, include

# 👇 Import drf-spectacular views
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ✅ OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # 🔧 Your actual app routes
    path('payroll/accounts/', include('accounts.urls')),
    path('payroll/api/', include('config.api_urls')),
    path('payroll/employees/', include('employees.urls')),
    path('payroll/', include('payroll.urls')),
]
