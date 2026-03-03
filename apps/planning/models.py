from django.db import models
from django.conf import settings


class CurriculumOutcome(models.Model):
    subject = models.ForeignKey("schools.Subject", on_delete=models.CASCADE)
    grade = models.ForeignKey("schools.Grade", on_delete=models.CASCADE)
    code = models.CharField(max_length=30)  # e.g. "CAPS-MATH-2.3.1"
    description = models.TextField()
    term = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.code}: {self.description[:50]}"


class LessonPlan(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("pending", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("superseded", "Superseded"),
    ]
    PLAN_TYPES = [
        ("official", "Official"),
        ("personal", "Personal"),
    ]

    timetable_slot = models.ForeignKey(
        "schools.TimetableSlot",
        on_delete=models.CASCADE,
        related_name="lesson_plans",
    )
    plan_type = models.CharField(max_length=10, choices=PLAN_TYPES)
    status = models.CharField(max_length=15, choices=STATUS, default="draft")
    title = models.CharField(max_length=200)
    objectives = models.TextField()
    activities = models.TextField()
    differentiation = models.TextField(blank=True)
    resources_note = models.TextField(blank=True)
    curriculum_outcomes = models.ManyToManyField(CurriculumOutcome, blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="plans_submitted",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plans_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    parent_version = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (v{self.version})"

    def submit_for_approval(self):
        self.status = "pending"
        self.save()

    def approve(self, approver):
        from django.utils import timezone
        self.status = "approved"
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.save()

    def reject(self, approver, feedback):
        self.status = "rejected"
        self.approved_by = approver
        self.save()
        PlanApprovalLog.objects.create(
            lesson_plan=self, action="rejected",
            actioned_by=approver, feedback=feedback,
        )


class LessonDelivery(models.Model):
    COMPLETION = [
        ("full", "Full"),
        ("partial", "Partial"),
        ("not_done", "Not Done"),
    ]

    lesson_plan = models.OneToOneField(
        LessonPlan, on_delete=models.CASCADE, related_name="delivery"
    )
    completion = models.CharField(max_length=10, choices=COMPLETION)
    coverage_percent = models.PositiveIntegerField(default=100)
    delivered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="lessons_delivered",
    )
    delivered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lesson_plan.title} - {self.completion}"


class PlanApprovalLog(models.Model):
    ACTIONS = [
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("returned", "Returned"),
        ("rejected", "Rejected"),
    ]

    lesson_plan = models.ForeignKey(
        LessonPlan, on_delete=models.CASCADE, related_name="approval_logs"
    )
    action = models.CharField(max_length=15, choices=ACTIONS)
    actioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    feedback = models.TextField(blank=True)
    actioned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lesson_plan} - {self.action}"
