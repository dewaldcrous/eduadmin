from django.contrib import admin
from .models import BehaviourLog, BehaviourFlag, BehaviourIntervention, BehaviourEscalation

admin.site.register([BehaviourLog, BehaviourFlag, BehaviourIntervention, BehaviourEscalation])
