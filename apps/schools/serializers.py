from rest_framework import serializers
from .models import (
    School, Grade, Subject, Room, Classroom,
    Timetable, TimetableSlot, ClassTeacherAssignment,
)


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            "id", "name", "emis_number", "address",
            "province", "district", "phase", "principal",
        ]


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "school", "name", "grade_head"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "school", "name", "code", "hod"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "school", "name", "capacity", "room_type"]


class ClassroomSerializer(serializers.ModelSerializer):
    homeroom_teacher_name = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    learner_count = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = [
            "id", "school", "grade", "grade_name", "name", "room",
            "homeroom_teacher", "homeroom_teacher_name", "learner_count",
        ]

    def get_homeroom_teacher_name(self, obj):
        if obj.homeroom_teacher:
            return obj.homeroom_teacher.get_full_name()
        return None

    def get_grade_name(self, obj):
        return obj.grade.name

    def get_learner_count(self, obj):
        return obj.enrollments.count()


class TimetableSlotSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = [
            "id", "timetable", "day", "period",
            "start_time", "end_time",
            "teacher", "teacher_name",
            "classroom", "classroom_name",
            "subject", "subject_name",
            "room", "is_break",
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.get_full_name()
        return None

    def get_classroom_name(self, obj):
        return str(obj.classroom)

    def get_subject_name(self, obj):
        return obj.subject.name
