from django.contrib import admin
from .models import CurriculumOutcome, LessonPlan, LessonDelivery, PlanApprovalLog

admin.site.register([CurriculumOutcome, LessonPlan, LessonDelivery, PlanApprovalLog])
