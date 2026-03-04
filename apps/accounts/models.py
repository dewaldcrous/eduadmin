from django.contrib.auth.models import AbstractUser
from django.db import models

db_constraint=False

class User(AbstractUser):
    ROLES = [
        ("teacher", "Teacher"),
        ("hod", "Head of Department"),
        ("grade_head", "Grade Head"),
        ("deputy", "Deputy Principal"),
        ("principal", "Principal"),
        ("admin", "Administrator"),
        ("learner", "Learner"),
        ("parent", "Parent/Guardian"),
    ]


    role = models.CharField(max_length=20, choices=ROLES, default="teacher")
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff",
        db_constraint=False,
    )
    phone = models.CharField(max_length=20, blank=True)
    profile_photo = models.ImageField(upload_to="profiles/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_teacher(self):
        return self.role == "teacher"

    @property
    def is_hod(self):
        return self.role == "hod"

    @property
    def is_management(self):
        return self.role in ["deputy", "principal", "admin"]


class UserPreference(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="preferences"
    )
    notification_email = models.BooleanField(default=True)
    notification_push = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=False)

    def __str__(self):
        return f"Preferences for {self.user}"
