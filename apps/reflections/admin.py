from django.contrib import admin
from .models import ToDoTask, CarryOverPackage

admin.site.register([ToDoTask, CarryOverPackage])
