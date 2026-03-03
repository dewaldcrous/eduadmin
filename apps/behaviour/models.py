from django.db import models
from django.conf import settings


class BehaviourLog(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="behaviour_logs",
    )
    timetable_slot = models.ForeignKey(
        "schools.TimetableSlot", on_delete=models.CASCADE
    )
    date = models.DateField()
    rating = models.PositiveIntegerField(default=3)  # 1-5
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="behaviour_recorded",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.learner} - {self.date} (Rating: {self.rating})"


class BehaviourFlag(models.Model):
    SEVERITIES = [
        ("minor", "Minor"),
        ("moderate", "Moderate"),
        ("serious", "Serious"),
        ("critical", "Critical"),
    ]
    CATEGORIES = [
        ("talking", "Talking"),
        ("phone", "Phone use"),
        ("late", "Late"),
        ("refused", "Refused to work"),
        ("disrespect", "Disrespect"),
        ("incomplete", "Incomplete work"),
        ("physical", "Physical"),
        ("participation", "Positive participation"),
        ("leadership", "Leadership"),
    ]

    log = models.ForeignKey(
        BehaviourLog, on_delete=models.CASCADE, related_name="flags"
    )
    category = models.CharField(max_length=20, choices=CATEGORIES)
    severity = models.CharField(max_length=10, choices=SEVERITIES)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.category} ({self.severity})"


class BehaviourIntervention(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interventions",
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="interventions_initiated",
    )
    intervention_type = models.CharField(max_length=100)
    date = models.DateField()
    outcome = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.learner} - {self.intervention_type}"


class BehaviourEscalation(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="escalations",
    )
    level = models.PositiveIntegerField()  # 1, 2, 3, 4
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.learner} - Level {self.level}"
