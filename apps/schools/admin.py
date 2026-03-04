from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import (
    School, Grade, Subject, Room, Classroom,
    ClassTeacherAssignment, Timetable, TimetableSlot, TeacherAvailability,
)


admin.site.register([
    Grade, Subject, Room,
    ClassTeacherAssignment, Timetable, TimetableSlot, TeacherAvailability,
])


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ["name", "grade", "school", "homeroom_teacher", "room"]
    list_filter = ["grade", "school"]


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["name", "emis_number", "province", "district", "phase"]
    list_filter = ["phase", "province"]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "bulk-upload/",
                self.admin_site.admin_view(self.bulk_upload_view),
                name="bulk-upload",
            ),
        ]
        return custom_urls + urls

    def bulk_upload_view(self, request):
        if request.method == "POST":
            file = request.FILES.get("file")
            school_id = request.POST.get("school")

            if not file:
                messages.error(request, "Please select an Excel file.")
                return redirect("admin:bulk-upload")

            if not file.name.endswith((".xlsx", ".xls")):
                messages.error(request, "Only .xlsx and .xls files are supported.")
                return redirect("admin:bulk-upload")

            if not school_id:
                messages.error(request, "Please select a school.")
                return redirect("admin:bulk-upload")

            try:
                school = School.objects.get(id=school_id)
            except School.DoesNotExist:
                messages.error(request, "School not found.")
                return redirect("admin:bulk-upload")

            from .services.bulk_upload import process_upload
            results = process_upload(file, school, request.user)

            total_created = sum(r.get("created", 0) for r in results)
            total_updated = sum(r.get("updated", 0) for r in results)
            total_errors = sum(len(r.get("errors", [])) for r in results)

            context = {
                **self.admin_site.each_context(request),
                "title": "Bulk Upload Results",
                "results": results,
                "total_created": total_created,
                "total_updated": total_updated,
                "total_errors": total_errors,
                "schools": School.objects.all(),
                "selected_school": school,
                "show_form": False,
            }
            return render(request, "admin/bulk_upload.html", context)

        # GET - show the upload form
        context = {
            **self.admin_site.each_context(request),
            "title": "Bulk Upload Data from Excel",
            "schools": School.objects.all(),
            "show_form": True,
            "results": None,
        }
        return render(request, "admin/bulk_upload.html", context)
