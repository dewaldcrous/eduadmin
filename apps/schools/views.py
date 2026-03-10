from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from apps.accounts.permissions import IsTeacherOrAbove
from .models import TimetableSlot, Timetable, Classroom, Grade, Subject


class MyTimetableSlotsView(APIView):
    """Return current user's timetable slots for the active timetable."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        user = request.user
        timetable = Timetable.objects.filter(
            school=user.school, status="active"
        ).first()

        if not timetable:
            return Response({"error": "No active timetable", "slots": []})

        # For teachers, return their slots. For management, return all.
        if user.role == "teacher":
            slots = TimetableSlot.objects.filter(
                timetable=timetable, teacher=user
            )
        elif user.role == "hod":
            slots = TimetableSlot.objects.filter(
                timetable=timetable, subject__hod=user
            )
        elif user.role == "grade_head":
            slots = TimetableSlot.objects.filter(
                timetable=timetable, classroom__grade__grade_head=user
            )
        else:
            slots = TimetableSlot.objects.filter(timetable=timetable)

        slots = slots.select_related(
            "teacher", "subject", "classroom", "classroom__grade", "room"
        ).order_by("day", "period")

        day_order = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4}

        data = []
        for slot in slots:
            data.append({
                "id": slot.id,
                "day": slot.day,
                "day_label": slot.get_day_display(),
                "day_order": day_order.get(slot.day, 0),
                "period": slot.period,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "subject": slot.subject.name,
                "subject_code": slot.subject.code,
                "classroom": str(slot.classroom),
                "classroom_id": slot.classroom.id,
                "grade": slot.classroom.grade.name,
                "teacher": slot.teacher.get_full_name() if slot.teacher else None,
                "teacher_id": slot.teacher.id if slot.teacher else None,
                "room": str(slot.room) if slot.room else None,
                "is_break": slot.is_break,
            })

        return Response({
            "timetable_id": timetable.id,
            "term": timetable.term,
            "year": timetable.year,
            "slot_count": len(data),
            "slots": data,
        })


class ClassroomListView(APIView):
    """Return classrooms for the user's school."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        user = request.user
        classrooms = Classroom.objects.filter(
            school=user.school
        ).select_related("grade", "room").order_by("grade__name", "name")

        data = []
        for c in classrooms:
            data.append({
                "id": c.id,
                "name": str(c),
                "grade": c.grade.name,
                "grade_id": c.grade.id,
                "room": str(c.room) if c.room else None,
            })
        return Response(data)


class GradeListView(APIView):
    """Return grades for the user's school."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        grades = Grade.objects.filter(
            school=request.user.school
        ).order_by("name")
        return Response([
            {"id": g.id, "name": g.name, "grade_head": g.grade_head.get_full_name() if g.grade_head else None}
            for g in grades
        ])


class SubjectListView(APIView):
    """Return subjects for the user's school."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        subjects = Subject.objects.filter(
            school=request.user.school
        ).order_by("name")
        return Response([
            {"id": s.id, "name": s.name, "code": s.code, "hod": s.hod.get_full_name() if s.hod else None}
            for s in subjects
        ])
