from rest_framework import serializers
from .models import LessonPlan, LessonDelivery, PlanApprovalLog, CurriculumOutcome


class CurriculumOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumOutcome
        fields = ["id", "code", "description", "term", "subject", "grade"]


class PlanApprovalLogSerializer(serializers.ModelSerializer):
    actioned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PlanApprovalLog
        fields = ["id", "action", "actioned_by", "actioned_by_name", "feedback", "actioned_at"]

    def get_actioned_by_name(self, obj):
        return obj.actioned_by.get_full_name() if obj.actioned_by else None


class LessonDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonDelivery
        fields = ["id", "completion", "coverage_percent", "delivered_by", "delivered_at"]
        read_only_fields = ["delivered_by", "delivered_at"]


class LessonPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views and weekly planner."""
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    slot_day = serializers.CharField(source="timetable_slot.day", read_only=True)
    slot_period = serializers.IntegerField(source="timetable_slot.period", read_only=True)
    slot_start = serializers.TimeField(source="timetable_slot.start_time", read_only=True)
    slot_end = serializers.TimeField(source="timetable_slot.end_time", read_only=True)
    has_delivery = serializers.SerializerMethodField()
    has_reflection = serializers.SerializerMethodField()

    class Meta:
        model = LessonPlan
        fields = [
            "id", "title", "status", "plan_type", "version",
            "slot_day", "slot_period", "slot_start", "slot_end",
            "teacher_name", "subject_name", "classroom_name",
            "has_delivery", "has_reflection",
            "created_at", "updated_at",
        ]

    def get_teacher_name(self, obj):
        teacher = obj.timetable_slot.teacher
        return teacher.get_full_name() if teacher else None

    def get_subject_name(self, obj):
        return obj.timetable_slot.subject.name

    def get_classroom_name(self, obj):
        return str(obj.timetable_slot.classroom)

    def get_has_delivery(self, obj):
        return hasattr(obj, "delivery")

    def get_has_reflection(self, obj):
        return hasattr(obj, "reflection")


class LessonPlanDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for create/update/read."""
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    slot_day = serializers.CharField(source="timetable_slot.day", read_only=True)
    slot_period = serializers.IntegerField(source="timetable_slot.period", read_only=True)
    slot_start = serializers.TimeField(source="timetable_slot.start_time", read_only=True)
    slot_end = serializers.TimeField(source="timetable_slot.end_time", read_only=True)
    approval_logs = PlanApprovalLogSerializer(many=True, read_only=True)
    delivery = LessonDeliverySerializer(read_only=True)
    curriculum_outcomes = CurriculumOutcomeSerializer(many=True, read_only=True)
    curriculum_outcome_ids = serializers.PrimaryKeyRelatedField(
        queryset=CurriculumOutcome.objects.all(),
        many=True, write_only=True, required=False,
        source="curriculum_outcomes",
    )
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LessonPlan
        fields = [
            "id", "timetable_slot", "plan_type", "status", "title",
            "objectives", "activities", "differentiation", "resources_note",
            "curriculum_outcomes", "curriculum_outcome_ids",
            "submitted_by", "approved_by", "approved_by_name", "approved_at",
            "version", "parent_version",
            "slot_day", "slot_period", "slot_start", "slot_end",
            "teacher_name", "subject_name", "classroom_name",
            "approval_logs", "delivery",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "submitted_by", "approved_by", "approved_at",
            "version", "status", "created_at", "updated_at",
        ]

    def get_teacher_name(self, obj):
        teacher = obj.timetable_slot.teacher
        return teacher.get_full_name() if teacher else None

    def get_subject_name(self, obj):
        return obj.timetable_slot.subject.name

    def get_classroom_name(self, obj):
        return str(obj.timetable_slot.classroom)

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def create(self, validated_data):
        outcomes = validated_data.pop("curriculum_outcomes", [])
        validated_data["submitted_by"] = self.context["request"].user
        validated_data["status"] = "draft"
        plan = LessonPlan.objects.create(**validated_data)
        if outcomes:
            plan.curriculum_outcomes.set(outcomes)
        return plan


class SubmitPlanSerializer(serializers.Serializer):
    """Submit a plan for HOD approval."""
    plan_id = serializers.IntegerField()


class ApprovePlanSerializer(serializers.Serializer):
    """Approve or reject a plan."""
    plan_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=["approved", "rejected", "returned"])
    feedback = serializers.CharField(required=False, default="")


class DeliverLessonSerializer(serializers.Serializer):
    """Mark a lesson as delivered."""
    plan_id = serializers.IntegerField()
    completion = serializers.ChoiceField(choices=["full", "partial", "not_done"])
    coverage_percent = serializers.IntegerField(min_value=0, max_value=100, default=100)
