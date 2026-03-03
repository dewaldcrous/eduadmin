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
