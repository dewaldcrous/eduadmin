from rest_framework import serializers
from .models import BehaviourLog, BehaviourFlag, BehaviourEscalation
from apps.accounts.serializer_mixins import AutoFillUserMixin


class BehaviourFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviourFlag
        fields = ["id", "category", "severity", "notes"]


class BehaviourLogSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    learner_name = serializers.SerializerMethodField()
    flags = BehaviourFlagSerializer(many=True, read_only=True)

    class Meta:
        model = BehaviourLog
        fields = [
            "id", "learner", "learner_name", "timetable_slot",
            "date", "rating", "flags",
            "recorded_by", "recorded_by_name", "created_at",
        ]
        read_only_fields = ["recorded_by", "recorded_by_name", "created_at"]
        auto_fill_fields = {
            "recorded_by": "user",
        }

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name()
        return None

    def get_learner_name(self, obj):
        return obj.learner.get_full_name()


class BehaviourEscalationSerializer(serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = BehaviourEscalation
        fields = [
            "id", "learner", "learner_name", "level",
            "triggered_at", "resolved", "resolved_at",
        ]

    def get_learner_name(self, obj):
        return obj.learner.get_full_name()
