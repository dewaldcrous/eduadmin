from rest_framework import serializers
from .models import LessonPlan, LessonDelivery, PlanApprovalLog, CurriculumOutcome
from apps.accounts.serializer_mixins import AutoFillUserMixin


class CurriculumOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumOutcome
        fields = ["id", "subject", "grade", "code", "description", "term"]


class LessonPlanSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LessonPlan
        fields = [
            "id", "timetable_slot", "plan_type", "status",
            "title", "objectives", "activities", "differentiation",
            "resources_note", "curriculum_outcomes",
            "submitted_by", "submitted_by_name",
            "approved_by", "approved_by_name", "approved_at",
            "version", "parent_version",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "submitted_by", "submitted_by_name",
            "approved_by", "approved_by_name", "approved_at",
            "version", "created_at", "updated_at",
        ]
        auto_fill_fields = {
            "submitted_by": "user",
        }

    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return obj.submitted_by.get_full_name()
        return None

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None


class LessonDeliverySerializer(AutoFillUserMixin, serializers.ModelSerializer):
    delivered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LessonDelivery
        fields = [
            "id", "lesson_plan", "completion", "coverage_percent",
            "delivered_by", "delivered_by_name", "delivered_at",
        ]
        read_only_fields = ["delivered_by", "delivered_by_name", "delivered_at"]
        auto_fill_fields = {
            "delivered_by": "user",
        }

    def get_delivered_by_name(self, obj):
        if obj.delivered_by:
            return obj.delivered_by.get_full_name()
        return None


class PlanApprovalLogSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    actioned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PlanApprovalLog
        fields = [
            "id", "lesson_plan", "action", "feedback",
            "actioned_by", "actioned_by_name", "actioned_at",
        ]
        read_only_fields = ["actioned_by", "actioned_by_name", "actioned_at"]
        auto_fill_fields = {
            "actioned_by": "user",
        }

    def get_actioned_by_name(self, obj):
        if obj.actioned_by:
            return obj.actioned_by.get_full_name()
        return None
