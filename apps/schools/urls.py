from django.urls import path
from .views import (
    MyTimetableSlotsView, ClassroomListView, GradeListView, SubjectListView,
    TimetableListView, TimetableDetailView, TimetableSlotView, TeacherListView,
    SubjectDetailView, GradeDetailView, ClassroomManageView, TimetableConfigView,
)

urlpatterns = [
    # Teacher's own slots
    path("my-slots/", MyTimetableSlotsView.as_view(), name="my-slots"),

    # Reference data
    path("classrooms/", ClassroomListView.as_view(), name="classroom-list"),
    path("classrooms/create/", ClassroomManageView.as_view(), name="classroom-create"),
    path("classrooms/<int:pk>/", ClassroomManageView.as_view(), name="classroom-detail"),
    path("grades/", GradeListView.as_view(), name="grade-list"),
    path("grades/create/", GradeDetailView.as_view(), name="grade-create"),
    path("grades/<int:pk>/", GradeDetailView.as_view(), name="grade-detail"),
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("subjects/<int:pk>/", SubjectDetailView.as_view(), name="subject-detail"),
    path("teachers/", TeacherListView.as_view(), name="teacher-list"),

    # Timetable management
    path("timetables/", TimetableListView.as_view(), name="timetable-list"),
    path("timetables/<int:pk>/", TimetableDetailView.as_view(), name="timetable-detail"),
    path("timetables/<int:pk>/config/", TimetableConfigView.as_view(), name="timetable-config"),
    path("timetables/<int:timetable_id>/slots/", TimetableSlotView.as_view(), name="timetable-slot-create"),
    path("timetables/<int:timetable_id>/slots/<int:slot_id>/", TimetableSlotView.as_view(), name="timetable-slot-detail"),
]
