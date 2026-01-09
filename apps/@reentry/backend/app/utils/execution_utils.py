"""
Utility functions for execution monitoring and management.
"""

from datetime import UTC, datetime, timedelta

from app.models.execution import Execution

# Timeout thresholds for stuck executions
PENDING_TIMEOUT_HOURS = 3
IN_PROGRESS_TIMEOUT_MINUTES = 30


def is_execution_stuck(execution: Execution) -> bool:
    """
    Check if an execution is stuck based on its status and how long it's been running.

    An execution is considered "stuck" if:
    - It has been PENDING for more than PENDING_TIMEOUT_HOURS (3 hours)
    - It has been IN_PROGRESS for more than IN_PROGRESS_TIMEOUT_MINUTES (30 minutes)

    Args:
        execution: The Execution object to check

    Returns:
        True if the execution is stuck, False otherwise
    """
    if not execution or not execution.updated_at:
        return False

    now = datetime.now(UTC).replace(tzinfo=None)
    time_elapsed = now - execution.updated_at

    if execution.status == "pending":
        return time_elapsed > timedelta(hours=PENDING_TIMEOUT_HOURS)
    elif execution.status == "in_progress":
        return time_elapsed > timedelta(minutes=IN_PROGRESS_TIMEOUT_MINUTES)

    return False
