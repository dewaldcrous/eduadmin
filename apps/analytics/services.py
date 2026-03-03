"""
At-Risk Scoring Engine.
Returns dict with score (0-100), risk_level, and flags.
Runs daily via Celery. Results stored in Redis for fast dashboard reads.
"""
from apps.learners.models import AttendanceRecord
from apps.assessments.models import AssessmentMark
from apps.behaviour.models import BehaviourLog


def calculate_risk_score(learner, classroom, term, year):
    """
    Returns dict with score (0-100), risk_level, and flags.
    """
    score = 0
    flags = []

    # ── 1. ATTENDANCE (max 30 points) ──────────────────────────────────
    total_slots = AttendanceRecord.objects.filter(
        learner=learner,
        timetable_slot__classroom=classroom,
    ).count()

    if total_slots > 0:
        absences = AttendanceRecord.objects.filter(
            learner=learner,
            timetable_slot__classroom=classroom,
            status="absent",
        ).count()
        att_pct = ((total_slots - absences) / total_slots) * 100
        if att_pct < 80:
            score += 30
            flags.append("attendance_critical")
        elif att_pct < 90:
            score += 15
            flags.append("attendance_warning")

    # ── 2. ACADEMIC (max 40 points) ────────────────────────────────────
    marks = AssessmentMark.objects.filter(
        learner=learner,
        assessment__classrooms=classroom,
        assessment__term=term,
        assessment__year=year,
        absent=False,
    )
    if marks.exists():
        avg = sum(m.percentage for m in marks) / marks.count()
        if avg < 40:
            score += 40
            flags.append("academic_critical")
        elif avg < 50:
            score += 20
            flags.append("academic_warning")

    # ── 3. BEHAVIOUR (max 30 points) ───────────────────────────────────
    logs = BehaviourLog.objects.filter(
        learner=learner,
        timetable_slot__classroom=classroom,
    )
    if logs.exists():
        beh_avg = sum(log.rating for log in logs) / logs.count()
        if beh_avg < 2.0:
            score += 30
            flags.append("behaviour_critical")
        elif beh_avg < 2.5:
            score += 15
            flags.append("behaviour_warning")

    # ── 4. MULTI-RISK MULTIPLIER ───────────────────────────────────────
    if len([f for f in flags if "critical" in f]) >= 2:
        score = min(100, int(score * 1.3))

    # ── 5. RISK LEVEL ─────────────────────────────────────────────────
    if score >= 70:
        level = "critical"
    elif score >= 40:
        level = "high"
    elif score >= 20:
        level = "medium"
    else:
        level = "low"

    return {"score": score, "level": level, "flags": flags}
