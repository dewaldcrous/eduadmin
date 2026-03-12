from django.urls import path
from .views import CurrentUserView, StaffListView, StaffDetailView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("staff/", StaffListView.as_view(), name="staff-list"),
    path("staff/<int:pk>/", StaffDetailView.as_view(), name="staff-detail"),
]
