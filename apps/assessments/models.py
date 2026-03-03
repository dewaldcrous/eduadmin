from django.db import models
from django.conf import settings


class Assessment(models.Model):
    TYPES = [
        ("test", "Test"),
        ("assignment", "Assignment"),
        ("exam", "Exam"),
        ("practical", "Practical"),
        ("oral", "Oral"),
        ("project", "Project"),
    ]
    STATUS = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("moderated", "Moderated"),
    ]

    name = models.CharField(max_length=200)
    assessment_type = models.CharField(max_length=20, choices=TYPES)
    subject = models.ForeignKey("schools.Subject", on_delete=models.CASCADE)
    grade = models.ForeignKey("schools.Grade", on_delete=models.CASCADE)
    classrooms = models.ManyToManyField("schools.Classroom", related_name="assessments")
    date = models.DateField()
    timetable_slot = models.ForeignKey(
        "schools.TimetableSlot",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    duration_minutes = models.PositiveIntegerField(default=60)
    total_marks = models.PositiveIntegerField()
    term_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    term = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS, default="draft")
    requires_moderation = models.BooleanField(default=False)
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moderation_assignments",
    )
    moderation_due = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assessments_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"


class AssessmentMark(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="marks"
    )
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assessment_marks",
    )
    raw_mark = models.DecimalField(max_digits=7, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    absent = models.BooleanField(default=False)
    captured_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="marks_captured",
    )
    captured_at = models.DateTimeField(auto_now_add=True)
    feedback = models.TextField(blank=True)

    class Meta:
        unique_together = ["assessment", "learner"]

    def __str__(self):
        return f"{self.learner} - {self.assessment}: {self.raw_mark}"


class ExamInvigilation(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="invigilations"
    )
    room = models.ForeignKey("schools.Room", on_delete=models.CASCADE)
    chief_invigilator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="chief_invigilations",
    )
    invigilators = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="invigilations", blank=True
    )

    def __str__(self):
        return f"{self.assessment} - {self.room}"
