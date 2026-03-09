from django.contrib import admin
from .models import (
    LearnerProfile, Guardian, LearnerClassEnrollment,
    AttendanceRecord, SupportPlan,
)


class GuardianInline(admin.TabularInline):
    model = Guardian
    extra = 0


@admin.register(LearnerProfile)
class LearnerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "date_of_birth", "home_language"]
    search_fields = ["user__first_name", "user__last_name"]
    inlines = [GuardianInline]


@admin.register(LearnerClassEnrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["learner", "classroom", "year"]
    list_filter = ["year", "classroom__grade"]


@admin.register(AttendanceRecord)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["learner", "date", "status", "timetable_slot"]
    list_filter = ["status", "date"]


admin.site.register([Guardian, SupportPlan])
