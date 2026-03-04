from rest_framework import serializers
from .models import AttendanceRecord, LearnerProfile, SupportPlan
from apps.accounts.serializer_mixins import AutoFillUserMixin


class AttendanceRecordSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "learner", "learner_name", "timetable_slot",
            "date", "status", "absence_reason", "parent_notified",
            "bathroom_requested", "bathroom_time_out",
            "bathroom_time_in", "bathroom_note",
            "recorded_by", "recorded_by_name",
        ]
        read_only_fields = ["recorded_by", "recorded_by_name"]
        auto_fill_fields = {
            "recorded_by": "user",
        }

    def get_learner_name(self, obj):
        return obj.learner.get_full_name()

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name()
        return None


class BulkAttendanceSaveSerializer(serializers.Serializer):
    """Used to save all learners in one request - the bulk capture API."""
    timetable_slot = serializers.IntegerField()
    date = serializers.DateField()
    records = AttendanceRecordSerializer(many=True)


class SupportPlanSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportPlan
        fields = [
            "id", "learner", "plan_type", "description",
            "start_date", "end_date", "is_active",
            "created_by", "created_by_name",
        ]
        read_only_fields = ["created_by", "created_by_name"]
        auto_fill_fields = {
            "created_by": "user",
        }

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None
