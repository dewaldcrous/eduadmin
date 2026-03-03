from celery import shared_task


@shared_task
def send_escalation_notification(escalation_id, notify_roles):
    """
    Called after a BehaviourEscalation is created.
    Sends email/push notifications to the right people.
    """
    from apps.behaviour.models import BehaviourEscalation
    from apps.accounts.models import User

    esc = BehaviourEscalation.objects.get(id=escalation_id)
    school = esc.learner.school
    recipients = []

    if "teacher" in notify_roles:
        teacher_id = (
            esc.learner.enrollments.filter(
                classroom__timetable_slots__teacher__isnull=False
            )
            .values_list("classroom__timetable_slots__teacher", flat=True)
            .first()
        )
        if teacher_id:
            recipients.append(teacher_id)

    if "hod" in notify_roles:
        hods = User.objects.filter(school=school, role="hod")
        recipients.extend(hods.values_list("id", flat=True))

    if "deputy" in notify_roles:
        deputies = User.objects.filter(school=school, role="deputy")
        recipients.extend(deputies.values_list("id", flat=True))

    if "parent" in notify_roles:
        try:
            guardians = esc.learner.learner_profile.guardians.filter(is_primary=True)
            for guardian in guardians:
                if guardian.email:
                    send_email_notification.delay(
                        to=guardian.email,
                        subject=f"Behaviour Alert - Level {esc.level}",
                        message=(
                            f"{esc.learner.get_full_name()} "
                            f"has a Level {esc.level} behaviour alert."
                        ),
                    )
        except Exception:
            pass

    # Send to staff recipients
    for user_id in set(recipients):
        try:
            user = User.objects.get(id=user_id)
            send_email_notification.delay(
                to=user.email,
                subject=f"Behaviour Alert - Level {esc.level}",
                message=(
                    f"{esc.learner.get_full_name()} "
                    f"has a Level {esc.level} behaviour alert."
                ),
            )
        except User.DoesNotExist:
            pass


@shared_task
def send_email_notification(to, subject, message):
    """Send an email notification."""
    if not to:
        return
    from django.core.mail import send_mail

    send_mail(subject, message, "noreply@eduadmin.co.za", [to])
