from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from .models import LessonPlan, LessonDelivery, PlanApprovalLog
from .serializers import (
    LessonPlanListSerializer, LessonPlanDetailSerializer,
    SubmitPlanSerializer, ApprovePlanSerializer, DeliverLessonSerializer,
)
from apps.accounts.permissions import IsTeacherOrAbove, IsHODOrAbove


class LessonPlanListCreateView(generics.ListCreateAPIView):
    """List all plans for the current user, or create a new one."""
    permission_classes = [IsTeacherOrAbove]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LessonPlanDetailSerializer
        return LessonPlanListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LessonPlan.objects.select_related(
            "timetable_slot", "timetable_slot__teacher",
            "timetable_slot__subject", "timetable_slot__classroom",
            "timetable_slot__classroom__grade",
        ).order_by("-created_at")

        # Teachers see only their own plans
        if user.role == "teacher":
            qs = qs.filter(timetable_slot__teacher=user)
        # HODs see plans for their subject
        elif user.role == "hod":
            qs = qs.filter(timetable_slot__subject__hod=user)
        # Grade heads see plans for their grade
        elif user.role == "grade_head":
            qs = qs.filter(timetable_slot__classroom__grade__grade_head=user)
        # Management sees all for their school
        elif user.role in ["deputy", "principal", "admin"]:
            qs = qs.filter(timetable_slot__timetable__school=user.school)

        # Optional filters
        slot_id = self.request.query_params.get("slot")
        if slot_id:
            qs = qs.filter(timetable_slot_id=slot_id)

        plan_status = self.request.query_params.get("status")
        if plan_status:
            qs = qs.filter(status=plan_status)

        return qs


class LessonPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific plan."""
    permission_classes = [IsTeacherOrAbove]
    serializer_class = LessonPlanDetailSerializer

    def get_queryset(self):
        return LessonPlan.objects.select_related(
            "timetable_slot", "timetable_slot__teacher",
            "timetable_slot__subject", "timetable_slot__classroom",
            "timetable_slot__classroom__grade",
            "approved_by",
        ).prefetch_related("approval_logs", "curriculum_outcomes")


class WeeklyPlanView(APIView):
    """
    Get the weekly plan grid for a teacher.
    Returns plans organized by day and period for the active timetable.
    """
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        user = request.user
        teacher_id = request.query_params.get("teacher", user.id)

        # Only allow viewing other teachers if HOD or above
        if str(teacher_id) != str(user.id) and user.role == "teacher":
            teacher_id = user.id

        from apps.schools.models import TimetableSlot, Timetable

        # Get active timetable for the user's school
        timetable = Timetable.objects.filter(
            school=user.school, status="active"
        ).first()

        if not timetable:
            return Response({"error": "No active timetable found"}, status=404)

        # Get all slots for this teacher
        slots = TimetableSlot.objects.filter(
            timetable=timetable, teacher_id=teacher_id
        ).select_related("subject", "classroom", "classroom__grade").order_by("period")

        # Get all plans for these slots
        plans = LessonPlan.objects.filter(
            timetable_slot__in=slots
        ).select_related(
            "timetable_slot", "timetable_slot__subject",
            "timetable_slot__classroom", "timetable_slot__classroom__grade",
        )

        plan_map = {}
        for plan in plans:
            key = f"{plan.timetable_slot.day}-{plan.timetable_slot.period}"
            if key not in plan_map or plan.version > plan_map[key].version:
                plan_map[key] = plan

        # Build the weekly grid
        days = ["MON", "TUE", "WED", "THU", "FRI"]
        day_labels = {
            "MON": "Monday", "TUE": "Tuesday", "WED": "Wednesday",
            "THU": "Thursday", "FRI": "Friday",
        }

        weekly = []
        for day in days:
            day_slots = slots.filter(day=day).order_by("period")
            day_data = {
                "day": day,
                "label": day_labels[day],
                "periods": [],
            }
            for slot in day_slots:
                key = f"{day}-{slot.period}"
                plan = plan_map.get(key)
                period_data = {
                    "slot_id": slot.id,
                    "period": slot.period,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M"),
                    "subject": slot.subject.name,
                    "subject_code": slot.subject.code,
                    "classroom": str(slot.classroom),
                    "is_break": slot.is_break,
                    "plan": None,
                }
                if plan:
                    period_data["plan"] = {
                        "id": plan.id,
                        "title": plan.title,
                        "status": plan.status,
                        "objectives": plan.objectives,
                        "activities": plan.activities,
                        "differentiation": plan.differentiation,
                        "resources_note": plan.resources_note,
                        "plan_type": plan.plan_type,
                        "version": plan.version,
                        "has_delivery": hasattr(plan, "delivery"),
                        "has_reflection": hasattr(plan, "reflection"),
                    }
                day_data["periods"].append(period_data)
            weekly.append(day_data)

        # Summary stats
        total_slots = slots.filter(is_break=False).count()
        plans_done = len([p for p in plan_map.values() if p.status in ["approved", "draft", "pending"]])
        plans_approved = len([p for p in plan_map.values() if p.status == "approved"])

        return Response({
            "teacher_id": int(teacher_id),
            "teacher_name": request.user.get_full_name() if str(teacher_id) == str(user.id) else "",
            "timetable_id": timetable.id,
            "term": timetable.term,
            "year": timetable.year,
            "weekly": weekly,
            "stats": {
                "total_slots": total_slots,
                "plans_created": plans_done,
                "plans_approved": plans_approved,
                "plans_missing": total_slots - plans_done,
                "completion_rate": round((plans_done / total_slots) * 100) if total_slots > 0 else 0,
            },
        })


class SubmitPlanView(APIView):
    """Submit a plan for HOD approval."""
    permission_classes = [IsTeacherOrAbove]

    def post(self, request):
        serializer = SubmitPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            plan = LessonPlan.objects.get(id=serializer.validated_data["plan_id"])
        except LessonPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)

        if plan.status not in ["draft", "rejected"]:
            return Response(
                {"error": f"Cannot submit a plan with status '{plan.status}'"},
                status=400,
            )

        plan.submit_for_approval()
        PlanApprovalLog.objects.create(
            lesson_plan=plan, action="submitted",
            actioned_by=request.user,
        )

        return Response({"status": "submitted", "plan_id": plan.id})


class ApprovePlanView(APIView):
    """HOD approves, rejects, or returns a plan."""
    permission_classes = [IsHODOrAbove]

    def post(self, request):
        serializer = ApprovePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            plan = LessonPlan.objects.get(id=serializer.validated_data["plan_id"])
        except LessonPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)

        if plan.status != "pending":
            return Response(
                {"error": f"Cannot approve a plan with status '{plan.status}'"},
                status=400,
            )

        action = serializer.validated_data["action"]
        feedback = serializer.validated_data.get("feedback", "")

        if action == "approved":
            plan.approve(request.user)
        elif action in ["rejected", "returned"]:
            plan.reject(request.user, feedback)

        PlanApprovalLog.objects.create(
            lesson_plan=plan, action=action,
            actioned_by=request.user, feedback=feedback,
        )

        return Response({"status": action, "plan_id": plan.id})


class DeliverLessonView(APIView):
    """Mark a lesson as delivered (full, partial, not done)."""
    permission_classes = [IsTeacherOrAbove]

    def post(self, request):
        serializer = DeliverLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            plan = LessonPlan.objects.get(id=serializer.validated_data["plan_id"])
        except LessonPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)

        delivery, created = LessonDelivery.objects.update_or_create(
            lesson_plan=plan,
            defaults={
                "completion": serializer.validated_data["completion"],
                "coverage_percent": serializer.validated_data["coverage_percent"],
                "delivered_by": request.user,
            },
        )

        # Trigger carry-over if partial or not done
        if delivery.completion in ["partial", "not_done"]:
            try:
                from apps.reflections.services import create_carry_over
                create_carry_over(delivery, None)
            except Exception:
                pass

        return Response({
            "status": "delivered",
            "plan_id": plan.id,
            "completion": delivery.completion,
            "coverage_percent": delivery.coverage_percent,
        })


class PendingApprovalsView(generics.ListAPIView):
    """List all plans pending approval for the current HOD."""
    permission_classes = [IsHODOrAbove]
    serializer_class = LessonPlanListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LessonPlan.objects.filter(status="pending").select_related(
            "timetable_slot", "timetable_slot__teacher",
            "timetable_slot__subject", "timetable_slot__classroom",
            "timetable_slot__classroom__grade",
        ).order_by("created_at")

        if user.role == "hod":
            qs = qs.filter(timetable_slot__subject__hod=user)
        elif user.role == "grade_head":
            qs = qs.filter(timetable_slot__classroom__grade__grade_head=user)
        elif user.role in ["deputy", "principal", "admin"]:
            qs = qs.filter(timetable_slot__timetable__school=user.school)

        return qs
