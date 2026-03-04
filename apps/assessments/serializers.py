from rest_framework import serializers
from .models import Assessment, AssessmentMark, ExamInvigilation
from apps.accounts.serializer_mixins import AutoFillUserMixin


class AssessmentSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id", "name", "assessment_type", "subject", "grade",
            "classrooms", "date", "timetable_slot",
            "duration_minutes", "total_marks", "term_weight",
            "term", "year", "status",
            "requires_moderation", "moderator", "moderation_due",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["created_by", "created_by_name", "created_at"]
        auto_fill_fields = {
            "created_by": "user",
        }

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class AssessmentMarkSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    captured_by_name = serializers.SerializerMethodField()
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentMark
        fields = [
            "id", "assessment", "learner", "learner_name",
            "raw_mark", "percentage", "absent", "feedback",
            "captured_by", "captured_by_name", "captured_at",
        ]
        read_only_fields = ["captured_by", "captured_by_name", "captured_at"]
        auto_fill_fields = {
            "captured_by": "user",
        }

    def get_captured_by_name(self, obj):
        if obj.captured_by:
            return obj.captured_by.get_full_name()
        return None

    def get_learner_name(self, obj):
        return obj.learner.get_full_name()


class ExamInvigilationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamInvigilation
        fields = [
            "id", "assessment", "room",
            "chief_invigilator", "invigilators",
        ]
