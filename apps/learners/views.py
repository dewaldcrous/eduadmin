from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db import transaction

from .models import AttendanceRecord, LearnerClassEnrollment
from .serializers import BulkAttendanceSaveSerializer, AttendanceRecordSerializer
from apps.accounts.permissions import IsStaffOfSchool
from apps.schools.models import TimetableSlot


class BulkAttendanceView(APIView):
    permission_classes = [IsStaffOfSchool]

    def post(self, request):
        """Save attendance for all learners in a class at once."""
        serializer = BulkAttendanceSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        records_data = serializer.validated_data["records"]
        slot_id = serializer.validated_data["timetable_slot"]
        date = serializer.validated_data["date"]

        # SCHOOL ISOLATION: verify the timetable slot belongs to user's school
        try:
            slot = TimetableSlot.objects.select_related(
                "classroom__school"
            ).get(id=slot_id)
        except TimetableSlot.DoesNotExist:
            return Response(
                {"error": "Timetable slot not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if slot.classroom.school != request.user.school:
            raise PermissionDenied(
                "You cannot record attendance for another school."
            )

        with transaction.atomic():
            saved = []
            for record in records_data:
                obj, _ = AttendanceRecord.objects.update_or_create(
                    learner=record["learner"],
                    timetable_slot_id=slot_id,
                    date=date,
                    defaults={
                        "status": record.get("status", "present"),
                        "absence_reason": record.get("absence_reason", ""),
                        "recorded_by": request.user,
                    },
                )
                saved.append(obj.id)

        return Response({"saved": len(saved)}, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Get attendance for a class on a specific date (own school only)."""
        slot_id = request.query_params.get("slot")
        date = request.query_params.get("date")

        # SCHOOL ISOLATION: only return records from user's school
        records = AttendanceRecord.objects.filter(
            timetable_slot_id=slot_id,
            date=date,
            timetable_slot__classroom__school=request.user.school,
        ).select_related("learner")

        return Response(AttendanceRecordSerializer(records, many=True).data)


class MarkAllPresentView(APIView):
    """
    Mark ALL learners in a class as present for a given slot and date.
    One-tap attendance for classes with full attendance.

    POST /api/v1/learners/attendance/mark-all-present/
    {
        "timetable_slot": 1,
        "date": "2026-03-04"
    }
    """
    permission_classes = [IsStaffOfSchool]

    def post(self, request):
        slot_id = request.data.get("timetable_slot")
        date = request.data.get("date")

        if not slot_id or not date:
            return Response(
                {"error": "timetable_slot and date are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify slot belongs to user's school
        try:
            slot = TimetableSlot.objects.select_related(
                "classroom__school"
            ).get(id=slot_id)
        except TimetableSlot.DoesNotExist:
            return Response(
                {"error": "Timetable slot not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if slot.classroom.school != request.user.school:
            raise PermissionDenied(
                "You cannot record attendance for another school."
            )

        # Get all enrolled learners for this classroom
        enrollments = LearnerClassEnrollment.objects.filter(
            classroom=slot.classroom,
            year=slot.timetable.year,
        ).select_related("learner")

        with transaction.atomic():
            saved = []
            for enrollment in enrollments:
                obj, _ = AttendanceRecord.objects.update_or_create(
                    learner=enrollment.learner,
                    timetable_slot=slot,
                    date=date,
                    defaults={
                        "status": "present",
                        "absence_reason": "",
                        "recorded_by": request.user,
                    },
                )
                saved.append(obj.id)

        return Response(
            {
                "saved": len(saved),
                "message": f"All {len(saved)} learners marked present.",
            },
            status=status.HTTP_201_CREATED,
        )


class MarkAllPresentWithExceptionsView(APIView):
    """
    Mark ALL learners as present EXCEPT those listed as exceptions.
    Perfect for classes where most are present but a few are absent/late.

    POST /api/v1/learners/attendance/mark-present-with-exceptions/
    {
        "timetable_slot": 1,
        "date": "2026-03-04",
        "exceptions": [
            {"learner": 5, "status": "absent", "absence_reason": "Sick"},
            {"learner": 12, "status": "late", "absence_reason": ""},
            {"learner": 23, "status": "absent", "absence_reason": "Family emergency"}
        ]
    }
    """
    permission_classes = [IsStaffOfSchool]

    def post(self, request):
        slot_id = request.data.get("timetable_slot")
        date = request.data.get("date")
        exceptions = request.data.get("exceptions", [])

        if not slot_id or not date:
            return Response(
                {"error": "timetable_slot and date are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify slot belongs to user's school
        try:
            slot = TimetableSlot.objects.select_related(
                "classroom__school"
            ).get(id=slot_id)
        except TimetableSlot.DoesNotExist:
            return Response(
                {"error": "Timetable slot not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if slot.classroom.school != request.user.school:
            raise PermissionDenied(
                "You cannot record attendance for another school."
            )

        # Build a lookup of exception learner IDs
        exception_map = {}
        for exc in exceptions:
            learner_id = exc.get("learner")
            if learner_id:
                exception_map[learner_id] = {
                    "status": exc.get("status", "absent"),
                    "absence_reason": exc.get("absence_reason", ""),
                }

        # Get all enrolled learners
        enrollments = LearnerClassEnrollment.objects.filter(
            classroom=slot.classroom,
            year=slot.timetable.year,
        ).select_related("learner")

        present_count = 0
        exception_count = 0

        with transaction.atomic():
            for enrollment in enrollments:
                learner = enrollment.learner

                if learner.id in exception_map:
                    # This learner is an exception (absent/late)
                    exc_data = exception_map[learner.id]
                    AttendanceRecord.objects.update_or_create(
                        learner=learner,
                        timetable_slot=slot,
                        date=date,
                        defaults={
                            "status": exc_data["status"],
                            "absence_reason": exc_data["absence_reason"],
                            "recorded_by": request.user,
                        },
                    )
                    exception_count += 1
                else:
                    # Everyone else is present
                    AttendanceRecord.objects.update_or_create(
                        learner=learner,
                        timetable_slot=slot,
                        date=date,
                        defaults={
                            "status": "present",
                            "absence_reason": "",
                            "recorded_by": request.user,
                        },
                    )
                    present_count += 1

        return Response(
            {
                "total": present_count + exception_count,
                "present": present_count,
                "exceptions": exception_count,
                "message": (
                    f"{present_count} marked present, "
                    f"{exception_count} marked as exceptions."
                ),
            },
            status=status.HTTP_201_CREATED,
        )
