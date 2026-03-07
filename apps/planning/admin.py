from django.contrib import admin
from .models import CurriculumOutcome, LessonPlan, LessonDelivery, PlanApprovalLog, LessonPlanAttachment


class AttachmentInline(admin.TabularInline):
    model = LessonPlanAttachment
    extra = 0
    readonly_fields = ["file_type", "file_size", "uploaded_by", "uploaded_at"]


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "timetable_slot", "submitted_by", "version"]
    list_filter = ["status", "plan_type"]
    inlines = [AttachmentInline]


admin.site.register([CurriculumOutcome, LessonDelivery, PlanApprovalLog, LessonPlanAttachment])
