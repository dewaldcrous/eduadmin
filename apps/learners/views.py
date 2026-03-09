from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q

from .models import AttendanceRecord, LearnerProfile, LearnerClassEnrollment, SupportPlan
from .serializers import (
    LearnerListSerializer, LearnerDetailSerializer,
    AttendanceRecordSerializer, BulkAttendanceSaveSerializer,
    SupportPlanSerializer,
)
from apps.accounts.models import User
from apps.accounts.permissions import IsTeacherOrAbove, IsHODOrAbove


class LearnerListView(generics.ListAPIView):
    """List learners. Filter by classroom, grade, or search."""
    permission_classes = [IsTeacherOrAbove]
    serializer_class = LearnerListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(role="learner", school=user.school).select_related(
            "learner_profile"
        ).prefetch_related(
            "enrollments", "enrollments__classroom", "enrollments__classroom__grade"
        ).order_by("last_name", "first_name")

        # Filter by classroom
        classroom = self.request.query_params.get("classroom")
        if classroom:
            qs = qs.filter(enrollments__classroom_id=classroom)

        # Filter by grade
        grade = self.request.query_params.get("grade")
        if grade:
            qs = qs.filter(enrollments__classroom__grade_id=grade)

        # Search
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search)
            )

        # For teachers, only show learners in their classes
        if user.role == "teacher":
            from apps.schools.models import TimetableSlot, Timetable
            timetable = Timetable.objects.filter(school=user.school, status="active").first()
            if timetable:
                classroom_ids = TimetableSlot.objects.filter(
                    timetable=timetable, teacher=user
                ).values_list("classroom_id", flat=True).distinct()
                qs = qs.filter(enrollments__classroom_id__in=classroom_ids)

        return qs.distinct()


class LearnerDetailView(generics.RetrieveAPIView):
    """Get full detail for a single learner."""
    permission_classes = [IsTeacherOrAbove]
    serializer_class = LearnerDetailSerializer

    def get_queryset(self):
        return User.objects.filter(role="learner").select_related(
            "learner_profile"
        ).prefetch_related(
            "enrollments", "enrollments__classroom", "enrollments__classroom__grade",
            "learner_profile__guardians", "attendance", "support_plans",
        )


class ClassRosterView(APIView):
    """Get all learners in a specific classroom with summary stats."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request, classroom_id):
        enrollments = LearnerClassEnrollment.objects.filter(
            classroom_id=classroom_id
        ).select_related(
            "learner", "learner__learner_profile", "classroom", "classroom__grade"
        ).order_by("learner__last_name", "learner__first_name")

        learners = []
        for e in enrollments:
            learner = e.learner
            total = AttendanceRecord.objects.filter(
                learner=learner, timetable_slot__classroom_id=classroom_id
            ).count()
            present = AttendanceRecord.objects.filter(
                learner=learner, timetable_slot__classroom_id=classroom_id,
                status__in=["present", "late"]
            ).count()
            absent = AttendanceRecord.objects.filter(
                learner=learner, timetable_slot__classroom_id=classroom_id,
                status="absent"
            ).count()

            profile = None
            try:
                profile = {
                    "home_language": learner.learner_profile.home_language,
                    "special_needs": learner.learner_profile.special_needs,
                }
            except LearnerProfile.DoesNotExist:
                pass

            learners.append({
                "id": learner.id,
                "first_name": learner.first_name,
                "last_name": learner.last_name,
                "username": learner.username,
                "attendance_rate": round((present / total) * 100, 1) if total > 0 else None,
                "absent_count": absent,
                "total_records": total,
                "profile": profile,
            })

        return Response({
            "classroom_id": classroom_id,
            "classroom": str(enrollments[0].classroom) if enrollments else "",
            "grade": enrollments[0].classroom.grade.name if enrollments else "",
            "count": len(learners),
            "learners": learners,
        })


class LearnerAttendanceHistoryView(APIView):
    """Get full attendance history for a learner."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request, learner_id):
        records = AttendanceRecord.objects.filter(
            learner_id=learner_id
        ).select_related(
            "timetable_slot", "timetable_slot__subject",
            "timetable_slot__classroom", "timetable_slot__classroom__grade",
            "recorded_by",
        ).order_by("-date", "-timetable_slot__period")

        # Optional date filter
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        if date_from:
            records = records.filter(date__gte=date_from)
        if date_to:
            records = records.filter(date__lte=date_to)

        data = []
        for r in records[:100]:
            data.append({
                "id": r.id,
                "date": r.date,
                "day": r.timetable_slot.get_day_display(),
                "period": r.timetable_slot.period,
                "subject": r.timetable_slot.subject.name,
                "classroom": str(r.timetable_slot.classroom),
                "status": r.status,
                "absence_reason": r.absence_reason,
                "recorded_by": r.recorded_by.get_full_name() if r.recorded_by else None,
            })

        return Response(data)


class SupportPlanListCreateView(generics.ListCreateAPIView):
    """List and create support plans for a learner."""
    permission_classes = [IsTeacherOrAbove]
    serializer_class = SupportPlanSerializer

    def get_queryset(self):
        learner_id = self.kwargs.get("learner_id")
        return SupportPlan.objects.filter(learner_id=learner_id).order_by("-is_active", "-start_date")

    def perform_create(self, serializer):
        serializer.save(
            learner_id=self.kwargs["learner_id"],
            created_by=self.request.user,
        )


class BulkAttendanceView(APIView):
    permission_classes = [IsTeacherOrAbove]

    def post(self, request):
        serializer = BulkAttendanceSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        records_data = serializer.validated_data["records"]
        slot_id = serializer.validated_data["timetable_slot"]
        date = serializer.validated_data["date"]

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
        slot_id = request.query_params.get("slot")
        date = request.query_params.get("date")
        records = AttendanceRecord.objects.filter(
            timetable_slot_id=slot_id, date=date
        ).select_related("learner")
        return Response(AttendanceRecordSerializer(records, many=True).data)
