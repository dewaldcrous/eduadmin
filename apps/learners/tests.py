import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.schools.models import (
    School, Timetable, TimetableSlot, Grade, Classroom, Subject,
)


class AttendanceAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create school structure
        self.school = School.objects.create(
            name="Test School",
            emis_number="000001",
            province="GP",
            district="GDE",
            phase="high",
        )
        self.teacher = User.objects.create_user(
            username="teacher1",
            password="pass",
            role="teacher",
            school=self.school,
        )
        self.learner1 = User.objects.create_user(
            username="learner1",
            password="pass",
            role="learner",
            school=self.school,
        )
        self.learner2 = User.objects.create_user(
            username="learner2",
            password="pass",
            role="learner",
            school=self.school,
        )

        grade = Grade.objects.create(school=self.school, name="Grade 10")
        subject = Subject.objects.create(
            school=self.school, name="Maths", code="MATH"
        )
        classroom = Classroom.objects.create(
            school=self.school, grade=grade, name="10A"
        )
        timetable = Timetable.objects.create(
            school=self.school, term=1, year=2026
        )
        self.slot = TimetableSlot.objects.create(
            timetable=timetable,
            day="MON",
            period=1,
            start_time="08:00",
            end_time="08:45",
            teacher=self.teacher,
            classroom=classroom,
            subject=subject,
        )

        self.client.force_authenticate(user=self.teacher)

    def test_bulk_attendance_saves_all_records(self):
        response = self.client.post(
            "/api/v1/learners/attendance/",
            {
                "timetable_slot": self.slot.id,
                "date": "2026-03-01",
                "records": [
                    {"learner": self.learner1.id, "status": "present"},
                    {
                        "learner": self.learner2.id,
                        "status": "absent",
                        "absence_reason": "Sick",
                    },
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["saved"], 2)

    def test_unauthenticated_request_is_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/v1/learners/attendance/", {})
        self.assertEqual(response.status_code, 401)

    def test_learner_role_cannot_save_attendance(self):
        self.client.force_authenticate(user=self.learner1)
        response = self.client.post(
            "/api/v1/learners/attendance/",
            {
                "timetable_slot": self.slot.id,
                "date": "2026-03-01",
                "records": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_teacher_from_another_school_cannot_save_attendance(self):
        """SCHOOL ISOLATION: staff from School B cannot write to School A."""
        other_school = School.objects.create(
            name="Other School",
            emis_number="000002",
            province="GP",
            district="GDE",
            phase="high",
        )
        other_teacher = User.objects.create_user(
            username="other_teacher",
            password="pass",
            role="teacher",
            school=other_school,
        )
        self.client.force_authenticate(user=other_teacher)

        response = self.client.post(
            "/api/v1/learners/attendance/",
            {
                "timetable_slot": self.slot.id,
                "date": "2026-03-01",
                "records": [
                    {"learner": self.learner1.id, "status": "present"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_teacher_without_school_is_blocked(self):
        """Users with no school assigned cannot access any module."""
        unassigned = User.objects.create_user(
            username="no_school",
            password="pass",
            role="teacher",
            school=None,
        )
        self.client.force_authenticate(user=unassigned)

        response = self.client.post(
            "/api/v1/learners/attendance/",
            {
                "timetable_slot": self.slot.id,
                "date": "2026-03-01",
                "records": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_get_attendance_only_returns_own_school(self):
        """GET requests only return data from the user's own school."""
        from apps.learners.models import AttendanceRecord

        # Create attendance at this school
        AttendanceRecord.objects.create(
            learner=self.learner1,
            timetable_slot=self.slot,
            date="2026-03-01",
            status="present",
            recorded_by=self.teacher,
        )

        response = self.client.get(
            "/api/v1/learners/attendance/",
            {"slot": self.slot.id, "date": "2026-03-01"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        # Teacher from another school sees nothing
        other_school = School.objects.create(
            name="Other School 2",
            emis_number="000003",
            province="GP",
            district="GDE",
            phase="high",
        )
        other_teacher = User.objects.create_user(
            username="other_teacher2",
            password="pass",
            role="teacher",
            school=other_school,
        )
        self.client.force_authenticate(user=other_teacher)

        response = self.client.get(
            "/api/v1/learners/attendance/",
            {"slot": self.slot.id, "date": "2026-03-01"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)
