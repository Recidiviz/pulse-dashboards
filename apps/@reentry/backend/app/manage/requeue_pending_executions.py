"""
Re-enqueue pending executions
=============================

This command fetches the contents of the Redis "schedule" queue, queries all PENDING
executions from the database, and for any execution that is pending but not in the
queue, tries to re-enqueue it.
"""

import redis.asyncio as redis
import structlog
from sqlmodel import select

from app.core.config import settings
from app.core.db import get_session_async_manager
from app.crud.execution import upsert_execution
from app.models.execution import Execution, ExecutionStatus

from .base import cli

logger = structlog.get_logger(__name__)


async def get_redis_queue_task_ids(
    redis_client: redis.Redis, queue_name: str = "taskiq"
) -> set[str]:
    """
    Fetch all task IDs from the Redis queue.

    TaskIQ uses Redis lists to store queued tasks. The queue name is "taskiq" by default.
    Each task in the queue contains a task_id field.
    """
    try:
        # Get all items from the Redis list (queue)
        queue_items = await redis_client.lrange(queue_name, 0, -1)
        task_ids = set()

        for item in queue_items:
            try:
                # TaskIQ stores JSON-encoded task data
                import json

                task_data = json.loads(item)
                if "task_id" in task_data:
                    task_ids.add(task_data["task_id"])
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"Failed to parse queue item: {e}", item=item)

        return task_ids
    except Exception as e:
        logger.error(f"Error fetching Redis queue: {e}")
        return set()


async def get_pending_executions_with_task_ids(session) -> list[Execution]:
    """
    Get all executions with PENDING status that have task_ids.
    """
    stmt = select(Execution).where(
        Execution.status == ExecutionStatus.PENDING, Execution.task_id.is_not(None)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


def get_task_mapping():
    """
    Map table_name patterns to their corresponding task functions and parameter patterns.
    """
    from app.tasks.action_plan import generate_action_plan_task
    from app.tasks.assessment import assessment_task
    from app.tasks.plan_create import plan_create_task
    from app.tasks.plan_decision_tree import (
        plan_decision_tree_run_task,
        plan_decision_tree_select_task,
    )
    from app.tasks.recording import process_recording_task

    return {
        "plan": {"task_func": plan_create_task, "param_key": "plan_id"},
        "assessmenttrees": {"task_func": assessment_task, "param_key": "assessment_id"},
        "plandecisiontrees": {
            "task_func": plan_decision_tree_run_task,
            "param_key": "plan_decision_tree_id",
        },
        "plan:decisiontrees-populate": {
            "task_func": plan_decision_tree_select_task,
            "param_key": "plan_id",
        },
        "plan:generate": {
            "task_func": generate_action_plan_task,
            "param_key": "gen_id",
        },
        "recording_session": {
            "task_func": process_recording_task,
            "param_key": "recording_session_id",
        },
    }


async def requeue_execution(session, execution: Execution):
    """
    Re-enqueue a pending execution by directly scheduling the task again.
    Uses the stored table_name and table_entity_id to reconstruct the original task.
    """
    task_mapping = get_task_mapping()

    if execution.table_name not in task_mapping:
        logger.error(
            f"Unknown table_name '{execution.table_name}' - cannot re-enqueue",
            execution_id=execution.id,
            table_name=execution.table_name,
            table_entity_id=execution.table_entity_id,
        )
        return False

    mapping = task_mapping[execution.table_name]
    task_func = mapping["task_func"]
    param_key = mapping["param_key"]
    task_kwargs = {param_key: execution.table_entity_id, "execution_id": execution.id}

    logger.info(
        f"Re-enqueueing execution {execution.id}",
        execution_id=execution.id,
        table_name=execution.table_name,
        task_func=task_func.__name__,
        task_kwargs=task_kwargs,
    )

    try:
        # Simply enqueue the task again with the same execution_id
        task = await task_func.kiq(**task_kwargs)
        execution.task_id = str(task.task_id)
        await upsert_execution(session, execution)

        logger.info(
            f"Successfully re-enqueued execution {execution.id}",
            execution_id=execution.id,
            new_task_id=str(task.task_id),
        )
        return True

    except Exception as e:
        logger.error(
            f"Failed to re-enqueue execution {execution.id}: {e}",
            execution_id=execution.id,
            error=str(e),
        )
        return False


@cli.command()
async def requeue_pending_executions():
    """
    Re-enqueue pending executions that are not in the Redis queue.

    This command:
    1. Fetches all task IDs from the Redis "taskiq" queue
    2. Queries all PENDING executions from the database
    3. For any execution that is pending but not in the queue, attempts to re-enqueue it
    """
    logger.info("Starting re-enqueue of pending executions")

    # Connect to Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        logger.info("Connected to Redis successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return

    try:
        # Get queue task IDs
        logger.info("Fetching task IDs from Redis queue")
        queued_task_ids = await get_redis_queue_task_ids(redis_client)
        logger.info(f"Found {len(queued_task_ids)} tasks in Redis queue")

        # Get pending executions from database
        async with get_session_async_manager() as session:
            logger.info("Fetching pending executions from database")
            pending_executions = await get_pending_executions_with_task_ids(session)
            logger.info(
                f"Found {len(pending_executions)} pending executions with task IDs"
            )

            # Find executions that are pending but not in queue
            missing_executions = []
            for execution in pending_executions:
                if execution.task_id not in queued_task_ids:
                    missing_executions.append(execution)

            logger.info(
                f"Found {len(missing_executions)} executions that need re-enqueueing"
            )

            if not missing_executions:
                logger.info("No executions need re-enqueueing")
                return

            # Attempt to re-enqueue missing executions
            for execution in missing_executions:
                await requeue_execution(session, execution)

    except Exception as e:
        logger.error(f"Error during re-enqueue process: {e}")
        raise
    finally:
        await redis_client.close()

    logger.info("Re-enqueue process completed")
