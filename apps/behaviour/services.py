"""
Behaviour Escalation Service.
Runs automatically after every lesson's behaviour is saved.
"""
from datetime import timedelta
from django.utils import timezone
from .models import BehaviourLog, BehaviourFlag, BehaviourEscalation


def check_escalation(learner, classroom, term, year):
    """
    Run after every behaviour save.
    Returns the highest escalation level triggered, or None.
    """
    now = timezone.now().date()
    fortnight_ago = now - timedelta(days=14)

    recent = BehaviourLog.objects.filter(
        learner=learner,
        timetable_slot__classroom=classroom,
        date__gte=fortnight_ago,
    ).order_by("-date")

    # LEVEL 4 - critical flag exists (check first, highest priority)
    if BehaviourFlag.objects.filter(
        log__learner=learner, severity="critical"
    ).exists():
        return _create_escalation(
            learner, 4, notify=["teacher", "hod", "deputy", "parent"]
        )

    # LEVEL 3 - any rating=1 OR 5+ low ratings this term
    term_low = BehaviourLog.objects.filter(
        learner=learner,
        timetable_slot__classroom=classroom,
        rating__lte=2,
    ).count()

    if recent.filter(rating=1).exists() or term_low >= 5:
        return _create_escalation(learner, 3, notify=["teacher", "hod"])

    # LEVEL 2 - 3+ low in 2 weeks
    if recent.filter(rating__lte=2).count() >= 3:
        return _create_escalation(learner, 2, notify=["teacher", "parent"])

    # LEVEL 1 - 2 consecutive lows
    last_two = list(recent[:2])
    if len(last_two) == 2 and all(log.rating <= 2 for log in last_two):
        return _create_escalation(learner, 1, notify=["teacher"])

    return None


def _create_escalation(learner, level, notify):
    esc = BehaviourEscalation.objects.create(learner=learner, level=level)
    # Queue notification task
    from apps.notifications.tasks import send_escalation_notification

    send_escalation_notification.delay(esc.id, notify)
    return esc
