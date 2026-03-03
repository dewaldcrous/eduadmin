from django.db import models
from django.conf import settings


class LessonReflection(models.Model):
    WEEK_RATINGS = [
        ("difficult", "Difficult"),
        ("mixed", "Mixed"),
        ("good", "Good"),
        ("excellent", "Excellent"),
    ]

    lesson_plan = models.OneToOneField(
        "planning.LessonPlan",
        on_delete=models.CASCADE,
        related_name="reflection",
    )
    what_went_well = models.TextField(blank=True)
    what_was_challenging = models.TextField(blank=True)
    needs_revisiting = models.TextField(blank=True)
    do_differently = models.TextField(blank=True)
    engagement_rating = models.PositiveIntegerField(default=5)  # 1-10
    flagged_learners = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="flagged_in_reflections"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reflections_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reflection: {self.lesson_plan.title}"


class ToDoTask(models.Model):
    TYPES = [
        ("content", "Content"),
        ("admin", "Admin"),
        ("learner", "Learner"),
        ("resource", "Resource"),
        ("communication", "Communication"),
    ]
    PRIORITY = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]
    STATUS = [
        ("open", "Open"),
        ("done", "Done"),
        ("carried", "Carried Over"),
    ]

    reflection = models.ForeignKey(
        LessonReflection, on_delete=models.CASCADE, related_name="todos"
    )
    description = models.TextField()
    task_type = models.CharField(max_length=20, choices=TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY, default="medium")
    status = models.CharField(max_length=10, choices=STATUS, default="open")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.priority}] {self.description[:50]}"


class CarryOverPackage(models.Model):
    PKG_STATUS = [
        ("active", "Active"),
        ("resolved", "Resolved"),
        ("partial", "Partial"),
    ]

    origin_lesson = models.ForeignKey(
        "planning.LessonPlan",
        on_delete=models.CASCADE,
        related_name="carry_overs_from",
    )
    destination_lesson = models.ForeignKey(
        "planning.LessonPlan",
        on_delete=models.SET_NULL,
        null=True,
        related_name="carry_overs_to",
    )
    content_items = models.JSONField(default=list)
    open_tasks = models.ManyToManyField(ToDoTask, blank=True)
    reflection_notes = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=PKG_STATUS, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Carry-over: {self.origin_lesson} -> {self.destination_lesson}"
