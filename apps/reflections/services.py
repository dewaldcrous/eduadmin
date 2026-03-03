"""
Carry-Over Engine.
When a lesson is marked partial or not done, automatically finds
the next lesson slot and creates a carry-over package.
"""
from django.db import models
from apps.schools.models import TimetableSlot
from apps.planning.models import LessonPlan
from .models import CarryOverPackage, ToDoTask


def create_carry_over(lesson_delivery, reflection):
    """
    Called when a lesson is marked partial or not completed.
    Finds the next lesson slot for the same class + subject
    and attaches a carry-over package to it.
    """
    if lesson_delivery.completion not in ["partial", "not_done"]:
        return None

    slot = lesson_delivery.lesson_plan.timetable_slot

    # Find next slot: same classroom + subject, later in the week
    day_order = ["MON", "TUE", "WED", "THU", "FRI"]
    current_day_idx = day_order.index(slot.day)

    next_slot = (
        TimetableSlot.objects.filter(
            timetable=slot.timetable,
            classroom=slot.classroom,
            subject=slot.subject,
        )
        .exclude(id=slot.id)
        .filter(day__in=day_order[current_day_idx + 1 :])
        .order_by(
            models.Case(
                *[models.When(day=d, then=i) for i, d in enumerate(day_order)]
            ),
            "period",
        )
        .first()
    )

    if not next_slot:
        return None  # No next lesson found

    # Get or create the destination lesson plan
    dest_plan, _ = LessonPlan.objects.get_or_create(
        timetable_slot=next_slot,
        defaults={
            "plan_type": lesson_delivery.lesson_plan.plan_type,
            "status": "draft",
            "title": f"Carry-over from {lesson_delivery.lesson_plan.title}",
            "objectives": lesson_delivery.lesson_plan.objectives,
            "activities": lesson_delivery.lesson_plan.activities,
            "submitted_by": lesson_delivery.delivered_by,
        },
    )

    # Gather open tasks
    open_tasks = ToDoTask.objects.filter(
        reflection__lesson_plan=lesson_delivery.lesson_plan, status="open"
    )

    # Build content items
    remaining_pct = 100 - lesson_delivery.coverage_percent
    content_items = [
        {
            "type": "uncovered_content",
            "text": lesson_delivery.lesson_plan.objectives,
            "coverage_remaining": remaining_pct,
        }
    ]
    if reflection and reflection.needs_revisiting:
        content_items.append(
            {"type": "revisit", "text": reflection.needs_revisiting}
        )

    package = CarryOverPackage.objects.create(
        origin_lesson=lesson_delivery.lesson_plan,
        destination_lesson=dest_plan,
        content_items=content_items,
        reflection_notes=reflection.needs_revisiting if reflection else "",
    )

    package.open_tasks.set(open_tasks)
    open_tasks.update(status="carried")

    return package
