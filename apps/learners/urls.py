from django.urls import path
from .views import BulkAttendanceView

urlpatterns = [
    path("attendance/", BulkAttendanceView.as_view(), name="bulk-attendance"),
]
