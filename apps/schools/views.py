from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from apps.accounts.permissions import IsTeacherOrAbove, IsHODOrAbove
from apps.accounts.models import User
from .models import TimetableSlot, Timetable, TimetableConfig, Classroom, Grade, Subject


# ─── TIMETABLE MANAGEMENT ───────────────────────────────────────────────────


class TimetableListView(APIView):
    """List all timetables for the school, create new timetable."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        user = request.user
        timetables = Timetable.objects.filter(
            school=user.school
        ).order_by("-year", "-term")

        data = []
        for tt in timetables:
            slot_count = tt.slots.count()
            data.append({
                "id": tt.id,
                "name": f"Term {tt.term} {tt.year}",
                "term": tt.term,
                "year": tt.year,
                "status": tt.status,
                "slot_count": slot_count,
                "created_by": tt.created_by.get_full_name() if tt.created_by else None,
                "created_at": tt.created_at.isoformat() if tt.created_at else None,
            })
        return Response(data)

    def post(self, request):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "")
        term = request.data.get("term")
        year = request.data.get("year")

        if not term or not year:
            return Response({"error": "Term and year are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate
        exists = Timetable.objects.filter(
            school=request.user.school, term=term, year=year
        ).exists()
        if exists:
            return Response({"error": f"Timetable for Term {term} {year} already exists"}, status=status.HTTP_400_BAD_REQUEST)

        timetable = Timetable.objects.create(
            school=request.user.school,
            term=term,
            year=year,
            status="draft",
            created_by=request.user,
        )
        return Response({
            "id": timetable.id,
            "name": f"Term {timetable.term} {timetable.year}",
            "term": timetable.term,
            "year": timetable.year,
            "status": timetable.status,
        }, status=status.HTTP_201_CREATED)


class TimetableDetailView(APIView):
    """Get timetable with all slots, update status, delete."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request, pk):
        try:
            timetable = Timetable.objects.get(id=pk, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        slots = TimetableSlot.objects.filter(
            timetable=timetable
        ).select_related("teacher", "subject", "classroom", "classroom__grade", "room")

        day_order = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4}

        slot_data = []
        for slot in slots:
            slot_data.append({
                "id": slot.id,
                "day": slot.day,
                "day_label": slot.get_day_display(),
                "day_order": day_order.get(slot.day, 0),
                "period": slot.period,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "teacher_id": slot.teacher.id if slot.teacher else None,
                "teacher_name": slot.teacher.get_full_name() if slot.teacher else None,
                "subject_id": slot.subject.id,
                "subject_name": slot.subject.name,
                "subject_code": slot.subject.code,
                "classroom_id": slot.classroom.id,
                "classroom_name": str(slot.classroom),
                "grade": slot.classroom.grade.name,
                "room": str(slot.room) if slot.room else None,
                "is_break": slot.is_break,
            })

        # Sort by day then period
        slot_data.sort(key=lambda x: (x["day_order"], x["period"]))

        # Get unique teachers, subjects, classrooms for this timetable
        teachers_in_timetable = set()
        subjects_in_timetable = set()
        classrooms_in_timetable = set()

        for slot in slots:
            if slot.teacher:
                teachers_in_timetable.add(slot.teacher.id)
            subjects_in_timetable.add(slot.subject.id)
            classrooms_in_timetable.add(slot.classroom.id)

        return Response({
            "id": timetable.id,
            "name": f"Term {timetable.term} {timetable.year}",
            "term": timetable.term,
            "year": timetable.year,
            "status": timetable.status,
            "slot_count": len(slot_data),
            "slots": slot_data,
            "stats": {
                "total_slots": len(slot_data),
                "teachers": len(teachers_in_timetable),
                "subjects": len(subjects_in_timetable),
                "classrooms": len(classrooms_in_timetable),
            },
        })

    def patch(self, request, pk):
        """Update timetable status (activate/archive)."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            timetable = Timetable.objects.get(id=pk, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status == "active":
            timetable.activate()
        elif new_status in ["draft", "archived"]:
            timetable.status = new_status
            timetable.save()
        else:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"id": timetable.id, "status": timetable.status})

    def delete(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            timetable = Timetable.objects.get(id=pk, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        if timetable.status == "active":
            return Response({"error": "Cannot delete active timetable"}, status=status.HTTP_400_BAD_REQUEST)

        timetable.delete()
        return Response({"deleted": True})


class TimetableSlotView(APIView):
    """Create, update, delete timetable slots."""
    permission_classes = [IsTeacherOrAbove]

    def post(self, request, timetable_id):
        """Create a new slot."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            timetable = Timetable.objects.get(id=timetable_id, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        day = request.data.get("day")
        period = request.data.get("period")
        teacher_id = request.data.get("teacher_id")
        subject_id = request.data.get("subject_id")
        classroom_id = request.data.get("classroom_id")
        start_time = request.data.get("start_time", "07:45")
        end_time = request.data.get("end_time", "08:30")

        if not all([day, period, subject_id, classroom_id]):
            return Response({"error": "day, period, subject_id, classroom_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check for conflicts
        teacher_conflict = TimetableSlot.objects.filter(
            timetable=timetable, day=day, period=period, teacher_id=teacher_id
        ).exists() if teacher_id else False

        classroom_conflict = TimetableSlot.objects.filter(
            timetable=timetable, day=day, period=period, classroom_id=classroom_id
        ).exists()

        if teacher_conflict:
            return Response({"error": "Teacher already has a slot at this time"}, status=status.HTTP_400_BAD_REQUEST)
        if classroom_conflict:
            return Response({"error": "Classroom already has a slot at this time"}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime
        slot = TimetableSlot.objects.create(
            timetable=timetable,
            day=day,
            period=period,
            start_time=datetime.strptime(start_time, "%H:%M").time(),
            end_time=datetime.strptime(end_time, "%H:%M").time(),
            teacher_id=teacher_id,
            subject_id=subject_id,
            classroom_id=classroom_id,
        )

        return Response({
            "id": slot.id,
            "day": slot.day,
            "period": slot.period,
            "teacher_id": slot.teacher_id,
            "subject_id": slot.subject_id,
            "classroom_id": slot.classroom_id,
        }, status=status.HTTP_201_CREATED)

    def put(self, request, timetable_id, slot_id=None):
        """Update a slot."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        slot_id = slot_id or request.data.get("slot_id")
        try:
            slot = TimetableSlot.objects.get(id=slot_id, timetable_id=timetable_id)
        except TimetableSlot.DoesNotExist:
            return Response({"error": "Slot not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update fields
        if "day" in request.data:
            slot.day = request.data["day"]
        if "period" in request.data:
            slot.period = request.data["period"]
        if "teacher_id" in request.data:
            slot.teacher_id = request.data["teacher_id"]
        if "subject_id" in request.data:
            slot.subject_id = request.data["subject_id"]
        if "classroom_id" in request.data:
            slot.classroom_id = request.data["classroom_id"]
        if "start_time" in request.data:
            from datetime import datetime
            slot.start_time = datetime.strptime(request.data["start_time"], "%H:%M").time()
        if "end_time" in request.data:
            from datetime import datetime
            slot.end_time = datetime.strptime(request.data["end_time"], "%H:%M").time()

        slot.save()

        return Response({
            "id": slot.id,
            "day": slot.day,
            "period": slot.period,
            "teacher_id": slot.teacher_id,
            "subject_id": slot.subject_id,
            "classroom_id": slot.classroom_id,
        })

    def delete(self, request, timetable_id, slot_id=None):
        """Delete a slot."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        slot_id = slot_id or request.data.get("slot_id")
        try:
            slot = TimetableSlot.objects.get(id=slot_id, timetable_id=timetable_id)
        except TimetableSlot.DoesNotExist:
            return Response({"error": "Slot not found"}, status=status.HTTP_404_NOT_FOUND)

        slot.delete()
        return Response({"deleted": True})


class TeacherListView(APIView):
    """List all teachers for the school with their subjects."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request):
        teachers = User.objects.filter(
            school=request.user.school,
            role__in=["teacher", "hod", "grade_head"]
        ).order_by("last_name", "first_name")

        data = []
        for t in teachers:
            # Get subjects this teacher teaches from timetable slots
            subject_ids = TimetableSlot.objects.filter(
                teacher=t
            ).values_list("subject_id", flat=True).distinct()

            subjects = Subject.objects.filter(id__in=subject_ids)
            subject_codes = [s.code for s in subjects]

            data.append({
                "id": t.id,
                "name": t.get_full_name(),
                "username": t.username,
                "role": t.role,
                "subjects": subject_codes,
            })

        return Response(data)


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

    def post(self, request):
        """Create a new subject."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "").strip()
        code = request.data.get("code", "").strip().upper()

        if not name or not code:
            return Response({"error": "Name and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        if Subject.objects.filter(school=request.user.school, code=code).exists():
            return Response({"error": f"Subject with code {code} already exists"}, status=status.HTTP_400_BAD_REQUEST)

        subject = Subject.objects.create(
            school=request.user.school,
            name=name,
            code=code,
            hod_id=request.data.get("hod_id"),
        )

        return Response({
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "hod": subject.hod.get_full_name() if subject.hod else None,
        }, status=status.HTTP_201_CREATED)


class SubjectDetailView(APIView):
    """Update or delete a subject."""
    permission_classes = [IsHODOrAbove]

    def put(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            subject = Subject.objects.get(id=pk, school=request.user.school)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            subject.name = request.data["name"]
        if "code" in request.data:
            subject.code = request.data["code"].upper()
        if "hod_id" in request.data:
            subject.hod_id = request.data["hod_id"]

        subject.save()

        return Response({
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "hod": subject.hod.get_full_name() if subject.hod else None,
        })

    def delete(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            subject = Subject.objects.get(id=pk, school=request.user.school)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        subject.delete()
        return Response({"deleted": True})


class GradeDetailView(APIView):
    """Create, update or delete grades."""
    permission_classes = [IsHODOrAbove]

    def post(self, request):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if Grade.objects.filter(school=request.user.school, name=name).exists():
            return Response({"error": f"Grade {name} already exists"}, status=status.HTTP_400_BAD_REQUEST)

        grade = Grade.objects.create(
            school=request.user.school,
            name=name,
            grade_head_id=request.data.get("grade_head_id"),
        )

        return Response({
            "id": grade.id,
            "name": grade.name,
            "grade_head": grade.grade_head.get_full_name() if grade.grade_head else None,
        }, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            grade = Grade.objects.get(id=pk, school=request.user.school)
        except Grade.DoesNotExist:
            return Response({"error": "Grade not found"}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            grade.name = request.data["name"]
        if "grade_head_id" in request.data:
            grade.grade_head_id = request.data["grade_head_id"]

        grade.save()

        return Response({
            "id": grade.id,
            "name": grade.name,
            "grade_head": grade.grade_head.get_full_name() if grade.grade_head else None,
        })

    def delete(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            grade = Grade.objects.get(id=pk, school=request.user.school)
        except Grade.DoesNotExist:
            return Response({"error": "Grade not found"}, status=status.HTTP_404_NOT_FOUND)

        grade.delete()
        return Response({"deleted": True})


class ClassroomManageView(APIView):
    """Create, update or delete classrooms."""
    permission_classes = [IsHODOrAbove]

    def post(self, request):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "").strip()
        grade_id = request.data.get("grade_id")

        if not name or not grade_id:
            return Response({"error": "Name and grade_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grade = Grade.objects.get(id=grade_id, school=request.user.school)
        except Grade.DoesNotExist:
            return Response({"error": "Grade not found"}, status=status.HTTP_404_NOT_FOUND)

        classroom = Classroom.objects.create(
            school=request.user.school,
            grade=grade,
            name=name,
            homeroom_teacher_id=request.data.get("homeroom_teacher_id"),
        )

        return Response({
            "id": classroom.id,
            "name": str(classroom),
            "grade": grade.name,
            "grade_id": grade.id,
            "homeroom_teacher": classroom.homeroom_teacher.get_full_name() if classroom.homeroom_teacher else None,
        }, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            classroom = Classroom.objects.get(id=pk, school=request.user.school)
        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            classroom.name = request.data["name"]
        if "grade_id" in request.data:
            try:
                grade = Grade.objects.get(id=request.data["grade_id"], school=request.user.school)
                classroom.grade = grade
            except Grade.DoesNotExist:
                pass
        if "homeroom_teacher_id" in request.data:
            classroom.homeroom_teacher_id = request.data["homeroom_teacher_id"]

        classroom.save()

        return Response({
            "id": classroom.id,
            "name": str(classroom),
            "grade": classroom.grade.name,
            "grade_id": classroom.grade.id,
            "homeroom_teacher": classroom.homeroom_teacher.get_full_name() if classroom.homeroom_teacher else None,
        })

    def delete(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            classroom = Classroom.objects.get(id=pk, school=request.user.school)
        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

        classroom.delete()
        return Response({"deleted": True})


class TimetableConfigView(APIView):
    """Get/set timetable configuration (cycle days, periods)."""
    permission_classes = [IsTeacherOrAbove]

    def get(self, request, pk):
        try:
            timetable = Timetable.objects.get(id=pk, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        # Try to get config from TimetableConfig model
        try:
            config = timetable.config
            cycle_type = config.cycle_type
            days_count = config.num_days
            periods_per_day = config.periods_per_day
        except TimetableConfig.DoesNotExist:
            # Default values if no config exists
            cycle_type = "week"
            days_count = 5
            periods_per_day = 7

        # Get period times from existing slots or use defaults
        slots = TimetableSlot.objects.filter(timetable=timetable)
        periods = []
        for p in range(1, periods_per_day + 1):
            slot = slots.filter(period=p).first()
            if slot:
                periods.append({
                    "period": p,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M"),
                })
            else:
                # Default period times
                start_hour = 7 + (p - 1)
                periods.append({
                    "period": p,
                    "start_time": f"{start_hour:02d}:45",
                    "end_time": f"{start_hour + 1:02d}:30",
                })

        return Response({
            "id": timetable.id,
            "cycle_type": cycle_type,
            "days_count": days_count,
            "periods": periods,
        })

    def put(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            timetable = Timetable.objects.get(id=pk, school=request.user.school)
        except Timetable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

        cycle_type = request.data.get("cycle_type", "week")
        days_count = request.data.get("days_count", 5)
        periods = request.data.get("periods", [])

        # Create or update TimetableConfig
        config, created = TimetableConfig.objects.update_or_create(
            timetable=timetable,
            defaults={
                "cycle_type": cycle_type,
                "num_days": days_count,
                "periods_per_day": len(periods) if periods else 7,
            }
        )

        # Update period times for existing slots
        from datetime import datetime
        for pt in periods:
            period = pt.get("period")
            start_time = pt.get("start_time")
            end_time = pt.get("end_time")

            if period and start_time and end_time:
                TimetableSlot.objects.filter(
                    timetable=timetable, period=period
                ).update(
                    start_time=datetime.strptime(start_time, "%H:%M").time(),
                    end_time=datetime.strptime(end_time, "%H:%M").time(),
                )

        return Response({
            "id": timetable.id,
            "cycle_type": config.cycle_type,
            "days_count": config.num_days,
            "periods": periods,
        })
