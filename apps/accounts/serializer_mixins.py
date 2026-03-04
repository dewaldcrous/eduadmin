"""
Auto-fill serializer mixins.
These automatically inject the logged-in user's details into records
so staff never have to manually enter who they are or which school they belong to.

HOW TO USE:
    class MySerializer(AutoFillUserMixin, serializers.ModelSerializer):
        class Meta:
            model = MyModel
            fields = ["id", "title", "created_by", "school"]
            auto_fill_fields = {
                "created_by": "user",         # fills with request.user
                "school": "school",            # fills with request.user.school
                "recorded_by": "user",         # fills with request.user
                "submitted_by": "user",        # fills with request.user
                "captured_by": "user",         # fills with request.user
            }

    # In your view's perform_create:
    serializer.save()  # auto-fill happens automatically
"""
from rest_framework import serializers


class AutoFillUserMixin:
    """
    Mixin for serializers that auto-fills user-related fields from the request.

    Set `auto_fill_fields` in your Meta class as a dict mapping
    field names to fill types:
        - "user"    → request.user
        - "school"  → request.user.school
        - "name"    → request.user.get_full_name()
        - "email"   → request.user.email
    """

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            auto_fields = getattr(self.Meta, "auto_fill_fields", {})
            for field_name, fill_type in auto_fields.items():
                if field_name not in validated_data or validated_data[field_name] is None:
                    validated_data[field_name] = self._get_fill_value(request.user, fill_type)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            # On update, refresh the "modified_by" type fields
            auto_fields = getattr(self.Meta, "auto_fill_fields", {})
            update_on_edit = getattr(self.Meta, "auto_fill_on_update", [])
            for field_name in update_on_edit:
                fill_type = auto_fields.get(field_name)
                if fill_type:
                    validated_data[field_name] = self._get_fill_value(request.user, fill_type)
        return super().update(instance, validated_data)

    def _get_fill_value(self, user, fill_type):
        if fill_type == "user":
            return user
        elif fill_type == "school":
            return user.school
        elif fill_type == "name":
            return user.get_full_name()
        elif fill_type == "email":
            return user.email
        elif fill_type == "user_id":
            return user.id
        elif fill_type == "school_id":
            return user.school_id
        return None
