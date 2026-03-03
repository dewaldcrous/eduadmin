from django.db import models
from django.conf import settings


class LearnerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learner_profile",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    id_number = models.CharField(max_length=20, blank=True)
    home_language = models.CharField(max_length=50, blank=True)
    special_needs = models.TextField(blank=True)
    medical_notes = models.TextField(blank=True)

    def __str__(self):
        return str(self.user)


class Guardian(models.Model):
    learner = models.ForeignKey(
        LearnerProfile, on_delete=models.CASCADE, related_name="guardians"
    )
    name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.learner}"


class LearnerClassEnrollment(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    classroom = models.ForeignKey(
        "schools.Classroom", on_delete=models.CASCADE, related_name="enrollments"
    )
    year = models.PositiveIntegerField()
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["learner", "classroom", "year"]

    def __str__(self):
        return f"{self.learner} -> {self.classroom} ({self.year})"


class AttendanceRecord(models.Model):
    STATUS = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
    ]

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance",
    )
    timetable_slot = models.ForeignKey(
        "schools.TimetableSlot", on_delete=models.CASCADE
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS, default="present")
    absence_reason = models.TextField(blank=True)
    parent_notified = models.BooleanField(default=False)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_recorded",
    )
    # Bathroom Register
    bathroom_requested = models.BooleanField(default=False)
    bathroom_time_out = models.TimeField(null=True, blank=True)
    bathroom_time_in = models.TimeField(null=True, blank=True)
    bathroom_note = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["learner", "timetable_slot", "date"]

    def __str__(self):
        return f"{self.learner} - {self.date} ({self.status})"


class SupportPlan(models.Model):
    PLAN_TYPES = [
        ("iep", "IEP"),
        ("reading", "Reading"),
        ("maths", "Maths"),
    ]

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_plans",
    )
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="support_plans_created",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.learner} - {self.get_plan_type_display()}"
