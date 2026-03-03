from django.contrib import admin
from .models import Assessment, AssessmentMark, ExamInvigilation

admin.site.register([Assessment, AssessmentMark, ExamInvigilation])
