"""EduAdmin URL Configuration."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # ─── Authentication ──────────────────────────────────────────────────
    path("api/v1/auth/login/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ─── App Endpoints ───────────────────────────────────────────────────
    path("api/v1/accounts/", include("apps.accounts.urls")),
    path("api/v1/schools/", include("apps.schools.urls")),
    path("api/v1/planning/", include("apps.planning.urls")),
    path("api/v1/learners/", include("apps.learners.urls")),
    path("api/v1/assessments/", include("apps.assessments.urls")),
    path("api/v1/behaviour/", include("apps.behaviour.urls")),
    path("api/v1/reflections/", include("apps.reflections.urls")),
    path("api/v1/calendar/", include("apps.calendar_events.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
