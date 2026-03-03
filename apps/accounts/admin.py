from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserPreference


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "first_name", "last_name", "role", "school", "is_active"]
    list_filter = ["role", "school", "is_active"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("EduAdmin", {"fields": ("role", "school", "phone", "profile_photo")}),
    )


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "notification_email", "notification_push"]
