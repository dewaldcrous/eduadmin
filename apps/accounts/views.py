from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
from .models import User
from .serializers import UserSerializer
from .permissions import IsHODOrAbove


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


class StaffListView(APIView):
    """List and create staff members (faculty only - no learners/parents)."""
    permission_classes = [IsHODOrAbove]

    def get(self, request):
        user = request.user
        staff = User.objects.filter(
            school=user.school
        ).exclude(
            role__in=["learner", "parent"]
        ).order_by("last_name", "first_name")

        # Get subjects taught by each teacher from timetable
        from apps.schools.models import TimetableSlot, Subject

        data = []
        for s in staff:
            subject_ids = TimetableSlot.objects.filter(
                teacher=s
            ).values_list("subject_id", flat=True).distinct()
            subjects = list(Subject.objects.filter(id__in=subject_ids).values_list("name", flat=True))

            data.append({
                "id": s.id,
                "username": s.username,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "email": s.email,
                "phone": s.phone,
                "role": s.role,
                "is_active": s.is_active,
                "subjects": subjects,
            })
        return Response(data)

    def post(self, request):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        # Validate required fields
        if not data.get("first_name") or not data.get("last_name"):
            return Response({"error": "First and last name are required"}, status=status.HTTP_400_BAD_REQUEST)
        if not data.get("username"):
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not data.get("password"):
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check username uniqueness
        if User.objects.filter(username=data["username"]).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        role = data.get("role", "teacher")
        if role in ["learner", "parent"]:
            return Response({"error": "Use learner management for learners"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=data["username"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            role=role,
            school=request.user.school,
            password=make_password(data["password"]),
            is_active=True,
        )

        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
        }, status=status.HTTP_201_CREATED)


class StaffDetailView(APIView):
    """Update or deactivate a staff member."""
    permission_classes = [IsHODOrAbove]

    def get(self, request, pk):
        try:
            user = User.objects.get(id=pk, school=request.user.school)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role in ["learner", "parent"]:
            return Response({"error": "Use learner management for learners"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
        })

    def put(self, request, pk):
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=pk, school=request.user.school)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role in ["learner", "parent"]:
            return Response({"error": "Use learner management for learners"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "email" in data:
            user.email = data["email"]
        if "phone" in data:
            user.phone = data["phone"]
        if "role" in data and data["role"] not in ["learner", "parent"]:
            user.role = data["role"]
        if data.get("password"):
            user.password = make_password(data["password"])

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
        })

    def patch(self, request, pk):
        """Toggle active status."""
        if request.user.role not in ["admin", "deputy", "principal"]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=pk, school=request.user.school)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if "is_active" in request.data:
            user.is_active = request.data["is_active"]
            user.save()

        return Response({"id": user.id, "is_active": user.is_active})
