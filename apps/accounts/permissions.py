from rest_framework.permissions import BasePermission


class IsTeacherOrAbove(BasePermission):
    """Allow access to teachers and any role above teacher."""

    def has_permission(self, request, view):
        return request.user.role in [
            "teacher", "hod", "grade_head", "deputy", "principal", "admin"
        ]


class IsHODOrAbove(BasePermission):
    """Allow access to HODs, grade heads, and management."""

    def has_permission(self, request, view):
        return request.user.role in [
            "hod", "grade_head", "deputy", "principal", "admin"
        ]


class IsPrincipalOrAbove(BasePermission):
    """Allow access to deputies, principals, and admins."""

    def has_permission(self, request, view):
        return request.user.role in ["deputy", "principal", "admin"]


class IsSameSchool(BasePermission):
    """Ensure user can only access data from their own school."""

    def has_object_permission(self, request, view, obj):
        school = getattr(obj, "school", None)
        if school is None:
            # Walk the relation chain for nested objects
            slot = getattr(obj, "timetable_slot", None)
            if slot:
                classroom = getattr(slot, "classroom", None)
                school = getattr(classroom, "school", None)
        return school == request.user.school
