from django.contrib import admin
from .models import (
    LearnerProfile, Guardian, LearnerClassEnrollment,
    AttendanceRecord, SupportPlan,
)

admin.site.register([
    LearnerProfile, Guardian, LearnerClassEnrollment,
    AttendanceRecord, SupportPlan,
])
