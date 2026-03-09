from django.urls import path
from .views import (
    LearnerListView, LearnerDetailView, ClassRosterView,
    LearnerAttendanceHistoryView, SupportPlanListCreateView,
    BulkAttendanceView,
)

urlpatterns = [
    path("", LearnerListView.as_view(), name="learner-list"),
    path("<int:pk>/", LearnerDetailView.as_view(), name="learner-detail"),
    path("classroom/<int:classroom_id>/roster/", ClassRosterView.as_view(), name="class-roster"),
    path("<int:learner_id>/attendance/", LearnerAttendanceHistoryView.as_view(), name="learner-attendance"),
    path("<int:learner_id>/support-plans/", SupportPlanListCreateView.as_view(), name="learner-support-plans"),
    path("attendance/", BulkAttendanceView.as_view(), name="bulk-attendance"),
]
