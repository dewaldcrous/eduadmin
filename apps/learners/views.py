from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db import transaction

from .models import AttendanceRecord
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
