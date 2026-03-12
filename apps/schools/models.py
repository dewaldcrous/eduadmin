from django.db import models
from django.conf import settings


class School(models.Model):
    PHASES = [
        ("primary", "Primary"),
        ("high", "High School"),
        ("tertiary", "Tertiary"),
    ]

    name = models.CharField(max_length=200)
    emis_number = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    phase = models.CharField(max_length=20, choices=PHASES)
    principal = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="principal_of",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="subjects")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    hod = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hod_subjects",
    )

    class Meta:
        unique_together = ["school", "code"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Grade(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="grades")
    name = models.CharField(max_length=20)
    grade_head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grade_head_of",
    )

    def __str__(self):
        return f"{self.school.name} - {self.name}"


class Room(models.Model):
    ROOM_TYPES = [
        ("classroom", "Classroom"),
        ("lab", "Laboratory"),
        ("hall", "Hall"),
        ("gym", "Gymnasium"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="rooms")
    name = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=30)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default="classroom")

    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"


class Classroom(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="classrooms")
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="classrooms")
    name = models.CharField(max_length=20)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    homeroom_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homeroom_classes",
        help_text="The teacher responsible for this class as homeroom/register teacher.",
    )

    def __str__(self):
        return f"{self.grade.name} {self.name}"


class ClassTeacherAssignment(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teaching_assignments"
    )
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    term = models.PositiveIntegerField()
    year = models.PositiveIntegerField()

    class Meta:
        unique_together = ["teacher", "classroom", "subject", "term", "year"]

    def __str__(self):
        return f"{self.teacher} -> {self.classroom} ({self.subject})"


class Timetable(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="timetables")
    term = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS, default="draft")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["school", "term", "year"]

    def __str__(self):
        return f"{self.school.name} - Term {self.term}/{self.year} ({self.status})"

    def activate(self):
        """Set to active, archive any previous active timetable."""
        Timetable.objects.filter(
            school=self.school, term=self.term, year=self.year, status="active"
        ).update(status="archived")
        self.status = "active"
        self.save()


class TimetableSlot(models.Model):
    # Support both week-based (MON-FRI) and cycle-based (D1-D8) scheduling
    DAYS = [
        ("MON", "Monday"),
        ("TUE", "Tuesday"),
        ("WED", "Wednesday"),
        ("THU", "Thursday"),
        ("FRI", "Friday"),
        ("SAT", "Saturday"),
        ("SUN", "Sunday"),
        # Cycle days for schools that don't follow a standard week
        ("D1", "Day 1"),
        ("D2", "Day 2"),
        ("D3", "Day 3"),
        ("D4", "Day 4"),
        ("D5", "Day 5"),
        ("D6", "Day 6"),
        ("D7", "Day 7"),
        ("D8", "Day 8"),
    ]

    timetable = models.ForeignKey(
        Timetable, on_delete=models.CASCADE, related_name="slots"
    )
    day = models.CharField(max_length=3, choices=DAYS)
    period = models.PositiveIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="slots",
    )
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    is_break = models.BooleanField(default=False)

    class Meta:
        unique_together = ["timetable", "day", "period", "classroom"]

    def __str__(self):
        return f"{self.day} P{self.period}: {self.subject} - {self.classroom}"


class TimetableConfig(models.Model):
    """Configuration for a timetable (cycle type, periods, etc.)"""
    CYCLE_TYPES = [
        ("week", "Weekly (Mon-Fri)"),
        ("cycle", "Cycle Days (Day 1-N)"),
    ]

    timetable = models.OneToOneField(
        Timetable, on_delete=models.CASCADE, related_name="config"
    )
    cycle_type = models.CharField(max_length=10, choices=CYCLE_TYPES, default="week")
    num_days = models.PositiveIntegerField(default=5)  # 5 for week, 6-8 for cycles
    periods_per_day = models.PositiveIntegerField(default=7)

    def __str__(self):
        return f"Config for {self.timetable}"


class TeacherAvailability(models.Model):
    AVAILABILITY_CHOICES = [
        ("available", "Available"),
        ("unavailable", "Unavailable"),
        ("preferred", "Preferred"),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability",
    )
    day = models.CharField(max_length=3, choices=TimetableSlot.DAYS)
    period = models.PositiveIntegerField()
    availability = models.CharField(
        max_length=15, choices=AVAILABILITY_CHOICES, default="available"
    )

    class Meta:
        unique_together = ["teacher", "day", "period"]
