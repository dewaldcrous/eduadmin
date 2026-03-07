from rest_framework import serializers
from .models import LessonPlan, LessonDelivery, PlanApprovalLog, CurriculumOutcome, LessonPlanAttachment


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


class LessonPlanAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    class Meta:
        model = LessonPlanAttachment
        fields = ["id", "file_name", "file_type", "file_size", "description", "url", "uploaded_by", "uploaded_by_name", "uploaded_at"]
    def get_url(self, obj):
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None


class LessonPlanListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    slot_day = serializers.CharField(source="timetable_slot.day", read_only=True)
    slot_period = serializers.IntegerField(source="timetable_slot.period", read_only=True)
    has_delivery = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    class Meta:
        model = LessonPlan
        fields = ["id", "title", "status", "plan_type", "version", "slot_day", "slot_period", "teacher_name", "subject_name", "classroom_name", "has_delivery", "attachment_count", "created_at", "updated_at"]
    def get_teacher_name(self, obj):
        return obj.timetable_slot.teacher.get_full_name() if obj.timetable_slot.teacher else None
    def get_subject_name(self, obj):
        return obj.timetable_slot.subject.name
    def get_classroom_name(self, obj):
        return str(obj.timetable_slot.classroom)
    def get_has_delivery(self, obj):
        return hasattr(obj, "delivery")
    def get_attachment_count(self, obj):
        return obj.attachments.count()


class LessonPlanDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    slot_day = serializers.CharField(source="timetable_slot.day", read_only=True)
    slot_period = serializers.IntegerField(source="timetable_slot.period", read_only=True)
    approval_logs = PlanApprovalLogSerializer(many=True, read_only=True)
    delivery = LessonDeliverySerializer(read_only=True)
    attachments = LessonPlanAttachmentSerializer(many=True, read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    class Meta:
        model = LessonPlan
        fields = ["id", "timetable_slot", "plan_type", "status", "title", "objectives", "activities", "differentiation", "resources_note", "submitted_by", "approved_by", "approved_by_name", "approved_at", "version", "slot_day", "slot_period", "teacher_name", "subject_name", "classroom_name", "approval_logs", "delivery", "attachments", "created_at", "updated_at"]
        read_only_fields = ["submitted_by", "approved_by", "approved_at", "version", "status", "created_at", "updated_at"]
    def get_teacher_name(self, obj):
        return obj.timetable_slot.teacher.get_full_name() if obj.timetable_slot.teacher else None
    def get_subject_name(self, obj):
        return obj.timetable_slot.subject.name
    def get_classroom_name(self, obj):
        return str(obj.timetable_slot.classroom)
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None
    def create(self, validated_data):
        validated_data["submitted_by"] = self.context["request"].user
        validated_data["status"] = "draft"
        return LessonPlan.objects.create(**validated_data)


class SubmitPlanSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()

class ApprovePlanSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=["approved", "rejected", "returned"])
    feedback = serializers.CharField(required=False, default="")

class DeliverLessonSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    completion = serializers.ChoiceField(choices=["full", "partial", "not_done"])
    coverage_percent = serializers.IntegerField(min_value=0, max_value=100, default=100)
