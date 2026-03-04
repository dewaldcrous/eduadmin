from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update the currently authenticated user's profile.
    Any authenticated user (including learners/parents) can view their own profile.
    Only staff can update their profile.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Override global IsStaffOfSchool

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Learners and parents can view but not edit
        if request.user.role in ["learner", "parent"]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Learners and parents cannot update profiles through the API.")
        return super().update(request, *args, **kwargs)
