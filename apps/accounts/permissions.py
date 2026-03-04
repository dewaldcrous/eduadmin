from rest_framework.permissions import BasePermission


# ─── ROLE-BASED PERMISSIONS ─────────────────────────────────────────────────

class IsTeacherOrAbove(BasePermission):
    """Allow access to teachers and any role above teacher."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [
            "teacher", "hod", "grade_head", "deputy", "principal", "admin"
        ]


class IsHODOrAbove(BasePermission):
    """Allow access to HODs, grade heads, and management."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [
            "hod", "grade_head", "deputy", "principal", "admin"
        ]


class IsPrincipalOrAbove(BasePermission):
    """Allow access to deputies, principals, and admins."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["deputy", "principal", "admin"]


# ─── SCHOOL ISOLATION PERMISSIONS ────────────────────────────────────────────

class IsSameSchool(BasePermission):
    """
    Ensure user can only access data from their own school.
    Works on individual objects (detail views).
    """
    message = "You do not have access to data from another school."

    def has_object_permission(self, request, view, obj):
        user_school = request.user.school
        if user_school is None:
            return False

        obj_school = _get_school_from_object(obj)
        if obj_school is None:
            return False

        return obj_school.id == user_school.id


class IsStaffOfSchool(BasePermission):
    """
    CORE RULE: Only school staff (not learners/parents) from the
    specific school can contribute to (create/update/delete) modules.

    - Staff roles can read AND write data for their own school only.
    - Learners and parents are blocked from contributing.
    - Users without a school assignment are blocked entirely.
    """
    message = "Only staff members of this school can perform this action."

    STAFF_ROLES = ["teacher", "hod", "grade_head", "deputy", "principal", "admin"]

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # User must have a school assigned
        if request.user.school is None:
            return False

        # User must be a staff member (not learner or parent)
        if request.user.role not in self.STAFF_ROLES:
            return False

        return True

    def has_object_permission(self, request, view, obj):
        user_school = request.user.school
        if user_school is None:
            return False

        obj_school = _get_school_from_object(obj)
        if obj_school is None:
            return True  # Can't determine school, let other permissions decide

        return obj_school.id == user_school.id


class IsStaffReadOrWriteOwnSchool(BasePermission):
    """
    - GET/HEAD/OPTIONS: Any authenticated staff can read their own school data.
    - POST/PUT/PATCH/DELETE: Only staff of that specific school can write.
    - Learners and parents get read-only access to their own school data.
    """
    message = "You can only modify data belonging to your own school."

    STAFF_ROLES = ["teacher", "hod", "grade_head", "deputy", "principal", "admin"]
    SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.school is None:
            return False

        # Safe methods: allow staff, learners, and parents to read
        if request.method in self.SAFE_METHODS:
            return True

        # Write methods: only staff roles
        return request.user.role in self.STAFF_ROLES

    def has_object_permission(self, request, view, obj):
        user_school = request.user.school
        if user_school is None:
            return False

        obj_school = _get_school_from_object(obj)
        if obj_school is None:
            return True

        return obj_school.id == user_school.id


# ─── HELPER: Extract school from any object ─────────────────────────────────

def _get_school_from_object(obj):
    """
    Walk the relation chain to find the school for any model object.
    Handles direct school FK, timetable_slot chains, and nested relations.
    """
    # Direct school field
    school = getattr(obj, "school", None)
    if school is not None:
        return school

    # Through timetable_slot -> classroom -> school
    timetable_slot = getattr(obj, "timetable_slot", None)
    if timetable_slot:
        classroom = getattr(timetable_slot, "classroom", None)
        if classroom:
            return getattr(classroom, "school", None)

    # Through classroom -> school
    classroom = getattr(obj, "classroom", None)
    if classroom:
        return getattr(classroom, "school", None)

    # Through lesson_plan -> timetable_slot -> classroom -> school
    lesson_plan = getattr(obj, "lesson_plan", None)
    if lesson_plan:
        slot = getattr(lesson_plan, "timetable_slot", None)
        if slot:
            classroom = getattr(slot, "classroom", None)
            if classroom:
                return getattr(classroom, "school", None)

    # Through timetable -> school
    timetable = getattr(obj, "timetable", None)
    if timetable:
        return getattr(timetable, "school", None)

    # Through grade -> school
    grade = getattr(obj, "grade", None)
    if grade:
        return getattr(grade, "school", None)

    # Through assessment -> subject -> school
    assessment = getattr(obj, "assessment", None)
    if assessment:
        subject = getattr(assessment, "subject", None)
        if subject:
            return getattr(subject, "school", None)

    # Through log -> timetable_slot (behaviour)
    log = getattr(obj, "log", None)
    if log:
        slot = getattr(log, "timetable_slot", None)
        if slot:
            classroom = getattr(slot, "classroom", None)
            if classroom:
                return getattr(classroom, "school", None)

    # Through learner -> school (user object)
    learner = getattr(obj, "learner", None)
    if learner:
        return getattr(learner, "school", None)

    return None
