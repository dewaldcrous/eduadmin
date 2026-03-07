from django.urls import path
from .views import (
    LessonPlanListCreateView, LessonPlanDetailView,
    WeeklyPlanView, SubmitPlanView, ApprovePlanView,
    DeliverLessonView, PendingApprovalsView,
    AttachmentUploadView, AttachmentListView, AttachmentDeleteView,
    ImportPlansFromExcelView, ExportPlansView,
)

urlpatterns = [
    # CRUD
    path("", LessonPlanListCreateView.as_view(), name="plan-list-create"),
    path("<int:pk>/", LessonPlanDetailView.as_view(), name="plan-detail"),

    # Weekly view
    path("weekly/", WeeklyPlanView.as_view(), name="weekly-plan"),

    # Workflow
    path("submit/", SubmitPlanView.as_view(), name="plan-submit"),
    path("approve/", ApprovePlanView.as_view(), name="plan-approve"),
    path("deliver/", DeliverLessonView.as_view(), name="plan-deliver"),
    path("pending/", PendingApprovalsView.as_view(), name="plan-pending"),

    # Attachments
    path("<int:plan_id>/attachments/", AttachmentUploadView.as_view(), name="attachment-upload"),
    path("<int:plan_id>/attachments/list/", AttachmentListView.as_view(), name="attachment-list"),
    path("attachments/<int:pk>/delete/", AttachmentDeleteView.as_view(), name="attachment-delete"),

    # Import / Export
    path("import/", ImportPlansFromExcelView.as_view(), name="plan-import"),
    path("export/", ExportPlansView.as_view(), name="plan-export"),
]
