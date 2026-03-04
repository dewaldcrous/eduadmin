from rest_framework import serializers
from .models import LessonReflection, ToDoTask, CarryOverPackage
from apps.accounts.serializer_mixins import AutoFillUserMixin


class ToDoTaskSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ToDoTask
        fields = [
            "id", "reflection", "description", "task_type",
            "priority", "status",
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


class LessonReflectionSerializer(AutoFillUserMixin, serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    todos = ToDoTaskSerializer(many=True, read_only=True)

    class Meta:
        model = LessonReflection
        fields = [
            "id", "lesson_plan",
            "what_went_well", "what_was_challenging",
            "needs_revisiting", "do_differently",
            "engagement_rating", "flagged_learners",
            "todos",
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


class CarryOverPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarryOverPackage
        fields = [
            "id", "origin_lesson", "destination_lesson",
            "content_items", "open_tasks", "reflection_notes",
            "status", "created_at",
        ]
        read_only_fields = ["created_at"]
