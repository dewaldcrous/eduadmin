from celery import shared_task


@shared_task
def refresh_all_risk_scores():
    """Daily task: recalculate risk scores for all enrolled learners."""
    # TODO: Implement in Phase 3
    pass


@shared_task
def generate_weekly_summaries():
    """Weekly task (Friday 17:00): generate HOD summary reports."""
    # TODO: Implement in Phase 3
    pass


@shared_task
def generate_coverage_reports():
    """Monthly task: generate curriculum coverage reports."""
    # TODO: Implement in Phase 4
    pass
