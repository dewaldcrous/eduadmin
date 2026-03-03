from django.contrib import admin
from .models import (
    School, Grade, Subject, Room, Classroom,
    ClassTeacherAssignment, Timetable, TimetableSlot, TeacherAvailability,
)

admin.site.register([
    School, Grade, Subject, Room, Classroom,
    ClassTeacherAssignment, Timetable, TimetableSlot, TeacherAvailability,
])
