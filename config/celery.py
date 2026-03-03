"""Celery configuration for EduAdmin."""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("eduadmin")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "refresh-risk-scores-daily": {
        "task": "apps.analytics.tasks.refresh_all_risk_scores",
        "schedule": crontab(hour=6, minute=0),
    },
    "weekly-hod-summaries": {
        "task": "apps.analytics.tasks.generate_weekly_summaries",
        "schedule": crontab(hour=17, minute=0, day_of_week=5),
    },
    "monthly-coverage-reports": {
        "task": "apps.analytics.tasks.generate_coverage_reports",
        "schedule": crontab(hour=7, minute=0, day_of_month=1),
    },
}
