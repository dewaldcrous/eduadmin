from rest_framework import serializers
from .models import AttendanceRecord, LearnerProfile


class AttendanceRecordSerializer(serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "learner", "learner_name", "timetable_slot",
            "date", "status", "absence_reason", "parent_notified",
            "bathroom_requested", "bathroom_time_out",
            "bathroom_time_in", "bathroom_note",
        ]
        read_only_fields = ["recorded_by"]

    def get_learner_name(self, obj):
        return obj.learner.get_full_name()


class BulkAttendanceSaveSerializer(serializers.Serializer):
    """Used to save all learners in one request - the bulk capture API."""
    timetable_slot = serializers.IntegerField()
    date = serializers.DateField()
    records = AttendanceRecordSerializer(many=True)
