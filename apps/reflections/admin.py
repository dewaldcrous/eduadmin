from django.contrib import admin
from .models import LessonReflection, ToDoTask, CarryOverPackage

admin.site.register([LessonReflection, ToDoTask, CarryOverPackage])
