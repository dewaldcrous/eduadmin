from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from .models import TimetableSlot, Classroom
from .serializers import TimetableSlotSerializer, ClassroomSerializer
from apps.accounts.permissions import IsStaffOfSchool, IsHODOrAbove
from apps.accounts.models import User
from apps.learners.models import LearnerClassEnrollment


class BulkUploadView(APIView):
    """
    Upload an Excel file to bulk-import data into any module.
    The file can contain multiple sheets, each mapping to a module.

    POST /api/v1/schools/bulk-upload/
    Content-Type: multipart/form-data
    Body: file=<your_excel_file.xlsx>

    Valid sheet names (one per tab):
        staff, grades, subjects, rooms, classrooms,
        learners, guardians, enrollments, timetable_slots,
        curriculum_outcomes, assessments, assessment_marks

    Returns detailed results per sheet with row-level error reporting.
    """
    permission_classes = [IsStaffOfSchool]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "No file uploaded. Send an Excel file as 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file type
        if not file.name.endswith((".xlsx", ".xls")):
            return Response(
                {"error": "Only .xlsx and .xls files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        school = request.user.school
        from .services.bulk_upload import process_upload

        results = process_upload(file, school, request.user)

        # Calculate totals
        total_created = sum(r.get("created", 0) for r in results)
        total_updated = sum(r.get("updated", 0) for r in results)
        total_errors = sum(len(r.get("errors", [])) for r in results)

        return Response({
            "summary": {
                "sheets_processed": len(results),
                "total_created": total_created,
                "total_updated": total_updated,
                "total_errors": total_errors,
            },
            "details": results,
        })


class BulkUploadTemplateView(APIView):
    """
    GET /api/v1/schools/bulk-upload/template/
    Returns the expected column headers for each sheet.
    Use this to build your Excel template.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        templates = {
            "staff": {
                "columns": ["username", "first_name", "last_name", "email", "role", "phone", "password"],
                "required": ["username", "first_name", "last_name", "role"],
                "notes": "Valid roles: teacher, hod, grade_head, deputy, principal, admin. Default password: EduAdmin2026!",
            },
            "grades": {
                "columns": ["name", "grade_head_username"],
                "required": ["name"],
                "notes": "e.g. 'Grade 8', 'Grade 9'. grade_head_username must match a staff member.",
            },
            "subjects": {
                "columns": ["name", "code", "hod_username"],
                "required": ["name", "code"],
                "notes": "code is a short unique identifier e.g. 'MATH', 'ENG'.",
            },
            "rooms": {
                "columns": ["name", "capacity", "room_type"],
                "required": ["name"],
                "notes": "room_type: classroom, lab, hall, gym. Default capacity: 30.",
            },
            "classrooms": {
                "columns": ["name", "grade_name", "room_name", "homeroom_teacher_username"],
                "required": ["name", "grade_name"],
                "notes": "name is e.g. '10A'. grade_name must match an existing grade.",
            },
            "learners": {
                "columns": ["username", "first_name", "last_name", "email", "date_of_birth",
                             "id_number", "home_language", "special_needs", "medical_notes"],
                "required": ["username", "first_name", "last_name"],
                "notes": "date_of_birth format: YYYY-MM-DD. Default password: Learner2026!",
            },
            "guardians": {
                "columns": ["learner_username", "guardian_name", "relationship", "phone", "email", "is_primary"],
                "required": ["learner_username", "guardian_name", "relationship", "phone"],
                "notes": "is_primary: true/false. Learner must exist first.",
            },
            "enrollments": {
                "columns": ["learner_username", "classroom_name", "year"],
                "required": ["learner_username", "classroom_name", "year"],
                "notes": "Links a learner to a classroom for a specific year.",
            },
            "timetable_slots": {
                "columns": ["day", "period", "start_time", "end_time", "teacher_username",
                             "classroom_name", "subject_code", "room_name", "is_break"],
                "required": ["day", "period", "start_time", "end_time", "teacher_username",
                             "classroom_name", "subject_code"],
                "notes": "day: MON/TUE/WED/THU/FRI. Time format: HH:MM. Creates active timetable if none exists.",
            },
            "curriculum_outcomes": {
                "columns": ["subject_code", "grade_name", "code", "description", "term"],
                "required": ["subject_code", "grade_name", "code", "description", "term"],
                "notes": "code e.g. 'CAPS-MATH-1.1'. term: 1-4.",
            },
            "assessments": {
                "columns": ["name", "assessment_type", "subject_code", "grade_name", "date",
                             "duration_minutes", "total_marks", "term_weight", "term", "year"],
                "required": ["name", "assessment_type", "subject_code", "grade_name",
                             "date", "total_marks", "term", "year"],
                "notes": "assessment_type: test, assignment, exam, practical, oral, project. date: YYYY-MM-DD.",
            },
            "assessment_marks": {
                "columns": ["assessment_name", "learner_username", "raw_mark", "absent", "feedback"],
                "required": ["assessment_name", "learner_username", "raw_mark"],
                "notes": "absent: true/false. Percentage auto-calculated from raw_mark and total_marks.",
            },
        }

        return Response({
            "instructions": (
                "Create an Excel file with one or more sheets. "
                "Name each sheet exactly as shown below (case-insensitive). "
                "The first row of each sheet must be the column headers. "
                "Import order matters: staff → grades → subjects → rooms → "
                "classrooms → learners → guardians → enrollments → timetable_slots."
            ),
            "templates": templates,
        })


class MyTimetableSlotsView(APIView):
    """
    Returns timetable slots that belong to the logged-in teacher.
    Teachers see only their own slots.
    HODs see slots for their subject across all teachers.
    Grade heads see slots for their grade across all teachers.
    Deputies/Principals/Admins see all slots in their school.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        user = request.user
        school = user.school

        # Base: only active timetable, own school
        slots = TimetableSlot.objects.filter(
            timetable__school=school,
            timetable__status="active",
        ).select_related("teacher", "classroom__grade", "subject", "room")

        # Scope by role
        if user.role == "teacher":
            # Teachers see only their own slots
            slots = slots.filter(teacher=user)

        elif user.role == "hod":
            # HODs see all slots for subjects they oversee
            hod_subjects = user.hod_subjects.values_list("id", flat=True)
            slots = slots.filter(subject_id__in=hod_subjects)

        elif user.role == "grade_head":
            # Grade heads see all slots for grades they oversee
            grade_ids = user.grade_head_of.values_list("id", flat=True)
            slots = slots.filter(classroom__grade_id__in=grade_ids)

        # Deputies, principals, admins see everything (no extra filter)

        # Optional day filter
        day = request.query_params.get("day")
        if day:
            slots = slots.filter(day=day.upper())

        serializer = TimetableSlotSerializer(slots.order_by("day", "period"), many=True)
        return Response(serializer.data)


class SearchTimetableSlotsView(APIView):
    """
    Exception-based search: find slots outside your normal scope.
    Search by teacher name, subject, classroom, or day.
    Only returns slots within your school.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        school = request.user.school
        query = request.query_params.get("q", "").strip()

        if not query or len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        slots = TimetableSlot.objects.filter(
            timetable__school=school,
            timetable__status="active",
        ).select_related("teacher", "classroom__grade", "subject")

        slots = slots.filter(
            Q(teacher__first_name__icontains=query)
            | Q(teacher__last_name__icontains=query)
            | Q(subject__name__icontains=query)
            | Q(subject__code__icontains=query)
            | Q(classroom__name__icontains=query)
            | Q(classroom__grade__name__icontains=query)
        )

        serializer = TimetableSlotSerializer(slots.order_by("day", "period")[:50], many=True)
        return Response(serializer.data)


class MyClassroomsView(APIView):
    """
    Returns classrooms the logged-in teacher is associated with:
    - Homeroom classes they own
    - Classes they teach (via timetable slots)
    HODs/Grade Heads/Management see broader scope.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        user = request.user
        school = user.school

        classrooms = Classroom.objects.filter(
            school=school,
        ).select_related("grade", "homeroom_teacher", "room")

        if user.role == "teacher":
            # Homeroom classes + classes they teach
            teaching_classroom_ids = TimetableSlot.objects.filter(
                timetable__school=school,
                timetable__status="active",
                teacher=user,
            ).values_list("classroom_id", flat=True).distinct()

            classrooms = classrooms.filter(
                Q(homeroom_teacher=user) | Q(id__in=teaching_classroom_ids)
            ).distinct()

        elif user.role == "hod":
            hod_subjects = user.hod_subjects.values_list("id", flat=True)
            teaching_classroom_ids = TimetableSlot.objects.filter(
                timetable__school=school,
                timetable__status="active",
                subject_id__in=hod_subjects,
            ).values_list("classroom_id", flat=True).distinct()
            classrooms = classrooms.filter(id__in=teaching_classroom_ids)

        elif user.role == "grade_head":
            grade_ids = user.grade_head_of.values_list("id", flat=True)
            classrooms = classrooms.filter(grade_id__in=grade_ids)

        # Deputies, principals, admins see all classrooms

        serializer = ClassroomSerializer(classrooms, many=True)
        return Response(serializer.data)


class MyLearnersView(APIView):
    """
    Returns learners in the logged-in teacher's classes.
    Teachers see learners from their homeroom + teaching classes.
    Optional: ?classroom=<id> to filter by specific classroom.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        user = request.user
        school = user.school
        classroom_id = request.query_params.get("classroom")

        # Get enrollments for this year
        enrollments = LearnerClassEnrollment.objects.filter(
            classroom__school=school,
            year=2026,  # TODO: make dynamic based on current academic year
        ).select_related("learner", "classroom__grade")

        # Filter by specific classroom if provided
        if classroom_id:
            enrollments = enrollments.filter(classroom_id=classroom_id)

        # Scope by role
        if user.role == "teacher":
            teaching_classroom_ids = TimetableSlot.objects.filter(
                timetable__school=school,
                timetable__status="active",
                teacher=user,
            ).values_list("classroom_id", flat=True).distinct()

            homeroom_ids = Classroom.objects.filter(
                homeroom_teacher=user,
            ).values_list("id", flat=True)

            allowed_ids = set(teaching_classroom_ids) | set(homeroom_ids)
            enrollments = enrollments.filter(classroom_id__in=allowed_ids)

        elif user.role == "hod":
            hod_subjects = user.hod_subjects.values_list("id", flat=True)
            classroom_ids = TimetableSlot.objects.filter(
                timetable__school=school,
                timetable__status="active",
                subject_id__in=hod_subjects,
            ).values_list("classroom_id", flat=True).distinct()
            enrollments = enrollments.filter(classroom_id__in=classroom_ids)

        elif user.role == "grade_head":
            grade_ids = user.grade_head_of.values_list("id", flat=True)
            enrollments = enrollments.filter(classroom__grade_id__in=grade_ids)

        # Build learner list
        learners = []
        for enrollment in enrollments.order_by("learner__last_name", "learner__first_name"):
            learners.append({
                "id": enrollment.learner.id,
                "first_name": enrollment.learner.first_name,
                "last_name": enrollment.learner.last_name,
                "classroom": str(enrollment.classroom),
                "classroom_id": enrollment.classroom_id,
                "grade": enrollment.classroom.grade.name,
            })

        return Response(learners)


class SearchLearnersView(APIView):
    """
    Exception-based search: find any learner in your school by name.
    Use when you need to access a learner outside your normal classes.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        school = request.user.school
        query = request.query_params.get("q", "").strip()

        if not query or len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        learners = User.objects.filter(
            school=school,
            role="learner",
        ).filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(username__icontains=query)
        )[:30]

        results = []
        for learner in learners:
            enrollment = learner.enrollments.select_related(
                "classroom__grade"
            ).first()

            results.append({
                "id": learner.id,
                "first_name": learner.first_name,
                "last_name": learner.last_name,
                "classroom": str(enrollment.classroom) if enrollment else "Not enrolled",
                "classroom_id": enrollment.classroom_id if enrollment else None,
                "grade": enrollment.classroom.grade.name if enrollment else None,
            })

        return Response(results)


class HomeroomView(APIView):
    """
    Get the homeroom class(es) for the logged-in teacher.
    Returns the classroom details plus all enrolled learners.
    """
    permission_classes = [IsStaffOfSchool]

    def get(self, request):
        user = request.user

        homeroom_classes = Classroom.objects.filter(
            school=user.school,
            homeroom_teacher=user,
        ).select_related("grade", "room")

        results = []
        for classroom in homeroom_classes:
            enrollments = LearnerClassEnrollment.objects.filter(
                classroom=classroom,
                year=2026,
            ).select_related("learner").order_by("learner__last_name")

            learners = [
                {
                    "id": e.learner.id,
                    "first_name": e.learner.first_name,
                    "last_name": e.learner.last_name,
                    "username": e.learner.username,
                }
                for e in enrollments
            ]

            results.append({
                "classroom": ClassroomSerializer(classroom).data,
                "learner_count": len(learners),
                "learners": learners,
            })

        return Response(results)
