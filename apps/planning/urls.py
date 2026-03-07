from django.urls import path
from .views import (
    LessonPlanListCreateView, LessonPlanDetailView,
    WeeklyPlanView, SubmitPlanView, ApprovePlanView,
    DeliverLessonView, PendingApprovalsView,
)

urlpatterns = [
    path("", LessonPlanListCreateView.as_view(), name="plan-list-create"),
    path("<int:pk>/", LessonPlanDetailView.as_view(), name="plan-detail"),
    path("weekly/", WeeklyPlanView.as_view(), name="weekly-plan"),
    path("submit/", SubmitPlanView.as_view(), name="plan-submit"),
    path("approve/", ApprovePlanView.as_view(), name="plan-approve"),
    path("deliver/", DeliverLessonView.as_view(), name="plan-deliver"),
    path("pending/", PendingApprovalsView.as_view(), name="plan-pending"),
]
