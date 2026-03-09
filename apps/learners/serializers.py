from rest_framework import serializers
from .models import LearnerProfile, Guardian, LearnerClassEnrollment, AttendanceRecord, SupportPlan
from apps.accounts.models import User


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ["id", "name", "relationship", "phone", "email", "is_primary"]


class LearnerProfileSerializer(serializers.ModelSerializer):
    guardians = GuardianSerializer(many=True, read_only=True)
    class Meta:
        model = LearnerProfile
        fields = ["id", "date_of_birth", "id_number", "home_language", "special_needs", "medical_notes", "guardians"]


class SupportPlanSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    class Meta:
        model = SupportPlan
        fields = ["id", "plan_type", "description", "start_date", "end_date", "created_by", "created_by_name", "is_active"]
        read_only_fields = ["created_by"]
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class LearnerListSerializer(serializers.ModelSerializer):
    classroom = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    home_language = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "email", "classroom", "grade", "attendance_rate", "home_language"]

    def get_classroom(self, obj):
        e = obj.enrollments.select_related("classroom", "classroom__grade").first()
        return {"id": e.classroom.id, "name": str(e.classroom)} if e else None

    def get_grade(self, obj):
        e = obj.enrollments.select_related("classroom__grade").first()
        return {"id": e.classroom.grade.id, "name": e.classroom.grade.name} if e else None

    def get_attendance_rate(self, obj):
        total = AttendanceRecord.objects.filter(learner=obj).count()
        if total == 0:
            return None
        present = AttendanceRecord.objects.filter(learner=obj, status__in=["present", "late"]).count()
        return round((present / total) * 100, 1)

    def get_home_language(self, obj):
        try:
            return obj.learner_profile.home_language
        except LearnerProfile.DoesNotExist:
            return None


class LearnerDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    guardians = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()
    support_plans = serializers.SerializerMethodField()
    attendance_summary = serializers.SerializerMethodField()
    recent_attendance = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "email", "phone", "profile", "guardians", "enrollments", "support_plans", "attendance_summary", "recent_attendance"]

    def get_profile(self, obj):
        try:
            return LearnerProfileSerializer(obj.learner_profile).data
        except LearnerProfile.DoesNotExist:
            return None

    def get_guardians(self, obj):
        try:
            return GuardianSerializer(obj.learner_profile.guardians.all(), many=True).data
        except LearnerProfile.DoesNotExist:
            return []

    def get_enrollments(self, obj):
        return [{"id": e.id, "classroom": str(e.classroom), "grade": e.classroom.grade.name, "year": e.year}
                for e in obj.enrollments.select_related("classroom", "classroom__grade").order_by("-year")]

    def get_support_plans(self, obj):
        return SupportPlanSerializer(SupportPlan.objects.filter(learner=obj, is_active=True), many=True).data

    def get_attendance_summary(self, obj):
        total = AttendanceRecord.objects.filter(learner=obj).count()
        if total == 0:
            return {"total": 0, "present": 0, "absent": 0, "late": 0, "rate": None}
        p = AttendanceRecord.objects.filter(learner=obj, status="present").count()
        a = AttendanceRecord.objects.filter(learner=obj, status="absent").count()
        l = AttendanceRecord.objects.filter(learner=obj, status="late").count()
        return {"total": total, "present": p, "absent": a, "late": l, "rate": round(((p + l) / total) * 100, 1)}

    def get_recent_attendance(self, obj):
        records = AttendanceRecord.objects.filter(learner=obj).select_related(
            "timetable_slot", "timetable_slot__subject"
        ).order_by("-date", "-timetable_slot__period")[:20]
        return [{"id": r.id, "date": r.date, "status": r.status, "subject": r.timetable_slot.subject.name,
                 "period": r.timetable_slot.period, "absence_reason": r.absence_reason} for r in records]


class AttendanceRecordSerializer(serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()
    class Meta:
        model = AttendanceRecord
        fields = ["id", "learner", "learner_name", "timetable_slot", "date", "status", "absence_reason",
                  "parent_notified", "bathroom_requested", "bathroom_time_out", "bathroom_time_in", "bathroom_note"]
        read_only_fields = ["recorded_by"]
    def get_learner_name(self, obj):
        return obj.learner.get_full_name()


class BulkAttendanceSaveSerializer(serializers.Serializer):
    timetable_slot = serializers.IntegerField()
    date = serializers.DateField()
    records = AttendanceRecordSerializer(many=True)
