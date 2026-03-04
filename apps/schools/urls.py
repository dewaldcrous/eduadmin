from django.urls import path
from .views import (
    MyTimetableSlotsView, SearchTimetableSlotsView,
    MyClassroomsView, MyLearnersView, SearchLearnersView,
    HomeroomView, BulkUploadView, BulkUploadTemplateView,
)

urlpatterns = [
    # Bulk upload
    path("bulk-upload/", BulkUploadView.as_view(), name="bulk-upload"),
    path("bulk-upload/template/", BulkUploadTemplateView.as_view(), name="bulk-upload-template"),

    # Teacher-scoped endpoints
    path("my-slots/", MyTimetableSlotsView.as_view(), name="my-timetable-slots"),
    path("my-classrooms/", MyClassroomsView.as_view(), name="my-classrooms"),
    path("my-learners/", MyLearnersView.as_view(), name="my-learners"),
    path("my-homeroom/", HomeroomView.as_view(), name="my-homeroom"),

    # Exception-based search
    path("search/slots/", SearchTimetableSlotsView.as_view(), name="search-slots"),
    path("search/learners/", SearchLearnersView.as_view(), name="search-learners"),
]
