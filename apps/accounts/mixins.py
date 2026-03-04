"""
School-scoped mixins for views.
Add SchoolScopedMixin to any ViewSet or ListView to automatically
filter all queries to the current user's school.
"""


class SchoolScopedMixin:
    """
    Automatically filters querysets to only return data from the
    logged-in user's school.

    HOW TO USE:
    1. Add this mixin to your view class (before the ViewSet/APIView)
    2. Set `school_field` to the lookup path to the school FK

    EXAMPLES:
        # Model has a direct 'school' field
        class SchoolViewSet(SchoolScopedMixin, ModelViewSet):
            school_field = "school"

        # Model reaches school through timetable_slot -> classroom -> school
        class AttendanceViewSet(SchoolScopedMixin, ModelViewSet):
            school_field = "timetable_slot__classroom__school"

        # Model reaches school through classroom -> school
        class EnrollmentViewSet(SchoolScopedMixin, ModelViewSet):
            school_field = "classroom__school"
    """

    school_field = "school"  # Override this per view

    def get_queryset(self):
        queryset = super().get_queryset()

        # If user has no school, return nothing
        if not self.request.user.is_authenticated:
            return queryset.none()

        user_school = self.request.user.school
        if user_school is None:
            return queryset.none()

        # Filter by school
        filter_kwargs = {self.school_field: user_school}
        return queryset.filter(**filter_kwargs)


class TimetableSlotScopedMixin(SchoolScopedMixin):
    """Shortcut for models that reach school through timetable_slot."""
    school_field = "timetable_slot__classroom__school"


class ClassroomScopedMixin(SchoolScopedMixin):
    """Shortcut for models that reach school through classroom."""
    school_field = "classroom__school"


class SubjectScopedMixin(SchoolScopedMixin):
    """Shortcut for models that reach school through subject."""
    school_field = "subject__school"
