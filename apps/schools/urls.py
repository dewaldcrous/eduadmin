from django.urls import path
from .views import MyTimetableSlotsView, ClassroomListView, GradeListView, SubjectListView

urlpatterns = [
    path("my-slots/", MyTimetableSlotsView.as_view(), name="my-slots"),
    path("classrooms/", ClassroomListView.as_view(), name="classroom-list"),
    path("grades/", GradeListView.as_view(), name="grade-list"),
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
]
