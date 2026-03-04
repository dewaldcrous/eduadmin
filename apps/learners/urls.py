from django.urls import path
from .views import (
    BulkAttendanceView,
    MarkAllPresentView,
    MarkAllPresentWithExceptionsView,
)

urlpatterns = [
    path("attendance/", BulkAttendanceView.as_view(), name="bulk-attendance"),
    path("attendance/mark-all-present/", MarkAllPresentView.as_view(), name="mark-all-present"),
    path("attendance/mark-present-with-exceptions/", MarkAllPresentWithExceptionsView.as_view(), name="mark-present-exceptions"),
]
