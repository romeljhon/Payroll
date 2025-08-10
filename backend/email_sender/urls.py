from django.urls import path
from .views import SendSinglePayslipView

urlpatterns = [
    path("send-single-payslip/", SendSinglePayslipView.as_view(), name="send-single-payslip"),
]