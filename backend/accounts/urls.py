from django.urls import path
from .views import LoginView, LogoutView, PasswordChangeView

urlpatterns = [
    path('login/', LoginView.as_view(), name='api-login'),
    path('logout/', LogoutView.as_view(), name='api-logout'),
    path('password-change/', PasswordChangeView.as_view(), name='api-password-change'),
]
