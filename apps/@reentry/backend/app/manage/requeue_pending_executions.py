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


async def get_client_resources_detailed(session, client_pseudo_id: str) -> dict:
    """Get detailed summary of all resources in DB for a client."""
    from app.services.client_data.queries import Queries

    resources = {}

    # Get client name from OMS data
    try:
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)
        resources["client_name"] = (
            f"{client_record.full_name}" if client_record else "Unknown"
        )
    except Exception:
        resources["client_name"] = "Unknown"

    # Check intake - use raw SQL to avoid ORM relationship loading issues
    try:
        from sqlalchemy import text

        intake_raw_stmt = text("""
            SELECT id, intake_type, status, current_section, client_pseudo_id
            FROM intake
            WHERE client_pseudo_id = :client_pseudo_id
        """)
        intake_result = await session.execute(
            intake_raw_stmt, {"client_pseudo_id": client_pseudo_id}
        )
        intake_rows = intake_result.fetchall()
    except Exception as e:
        logger.warning(f"Failed to query intake table: {e}")
        intake_rows = []

    if intake_rows:
        intake = intake_rows[0]  # Assume one intake per client
        resources["intake"] = {
            "exists": True,
            "type": intake.intake_type,
            "status": intake.status,
            "current_section": intake.current_section,
        }

        # Count messages using raw SQL to avoid relationship loading
        try:
            msg_count_stmt = text("""
                SELECT COUNT(*) as message_count
                FROM intakemessage
                WHERE intake_id = :intake_id
            """)
            msg_result = await session.execute(msg_count_stmt, {"intake_id": intake.id})
            message_count = msg_result.scalar() or 0
            resources["messages"] = message_count
        except Exception as e:
            logger.warning(f"Failed to count messages: {e}")
            resources["messages"] = 0
            # Rollback transaction to continue with other queries
            await session.rollback()
    else:
        resources["intake"] = {"exists": False}
        resources["messages"] = 0

    # Check assessments using raw SQL to avoid relationship issues
    try:
        assessment_raw_stmt = text("""
            SELECT assessment_type
            FROM assessment
            WHERE client_pseudo_id = :client_pseudo_id
        """)
        assessment_result = await session.execute(
            assessment_raw_stmt, {"client_pseudo_id": client_pseudo_id}
        )
        assessment_rows = assessment_result.fetchall()
        resources["assessments"] = [
            {"type": row.assessment_type} for row in assessment_rows
        ]
    except Exception as e:
        logger.warning(f"Failed to query assessments: {e}")
        resources["assessments"] = []

    # Check plans using raw SQL to avoid relationship issues
    try:
        plan_raw_stmt = text("""
            SELECT p.edited_manually,
                   CASE WHEN p.create_execution_id IS NOT NULL THEN e.status ELSE 'not_started' END as create_status
            FROM plan p
            LEFT JOIN execution e ON p.create_execution_id = e.id
            WHERE p.client_pseudo_id = :client_pseudo_id
        """)
        plan_result = await session.execute(
            plan_raw_stmt, {"client_pseudo_id": client_pseudo_id}
        )
        plan_rows = plan_result.fetchall()
        resources["plans"] = [
            {"create_status": row.create_status, "edited_manually": row.edited_manually}
            for row in plan_rows
        ]
    except Exception as e:
        logger.warning(f"Failed to query plans: {e}")
        resources["plans"] = []

    # Check recordings - use raw SQL to avoid model issues with missing columns
    try:
        from sqlalchemy import text

        # First try to check if the table and basic columns exist
        recording_raw_stmt = text("""
            SELECT id, status, transcription_approved,
                   COALESCE(chunk_count, 0) as chunk_count
            FROM recording_session
            WHERE client_pseudo_id = :client_pseudo_id
        """)
        recording_result = await session.execute(
            recording_raw_stmt, {"client_pseudo_id": client_pseudo_id}
        )
        recording_row = recording_result.first()

        if recording_row:
            resources["recording"] = {
                "exists": True,
                "status": recording_row.status,
                "chunk_count": recording_row.chunk_count,
                "transcription_approved": recording_row.transcription_approved,
            }
        else:
            resources["recording"] = {"exists": False}
    except Exception as e:
        # Handle case where recording_session table doesn't exist or has schema issues
        logger.warning(f"Failed to query recording_session table: {e}")
        resources["recording"] = {"exists": False, "error": str(e)}

    # Check other executions for this client using raw SQL
    try:
        other_exec_raw_stmt = text("""
            SELECT e.status, e.table_name
            FROM execution e
            JOIN intake i ON e.table_entity_id = i.id
            WHERE e.table_name = 'intake'
              AND i.client_pseudo_id = :client_pseudo_id

            UNION ALL

            SELECT e.status, e.table_name
            FROM execution e
            JOIN assessment a ON e.table_entity_id = a.id
            WHERE e.table_name = 'assessmenttrees'
              AND a.client_pseudo_id = :client_pseudo_id

            UNION ALL

            SELECT e.status, e.table_name
            FROM execution e
            JOIN plan p ON e.table_entity_id = p.id
            WHERE e.table_name = 'plan'
              AND p.client_pseudo_id = :client_pseudo_id
        """)
        other_exec_result = await session.execute(
            other_exec_raw_stmt, {"client_pseudo_id": client_pseudo_id}
        )
        other_exec_rows = other_exec_result.fetchall()
        resources["other_executions"] = [
            {"status": row.status, "table_name": row.table_name}
            for row in other_exec_rows
        ]
    except Exception as e:
        logger.warning(f"Failed to query other executions: {e}")
        resources["other_executions"] = []

    return resources


async def get_client_pseudo_id_for_execution(session, execution: Execution) -> str:
    """Extract client_pseudo_id based on execution table_name and table_entity_id."""
    from app.models.assessment import Assessment
    from app.models.intake import Intake
    from app.models.models import Plan, PlanGeneration

    try:
        if execution.table_name == "intake":
            stmt = select(Intake.client_pseudo_id).where(
                Intake.id == execution.table_entity_id
            )
        elif execution.table_name == "assessmenttrees":
            stmt = select(Assessment.client_pseudo_id).where(
                Assessment.id == execution.table_entity_id
            )
        elif execution.table_name == "plan":
            stmt = select(Plan.client_pseudo_id).where(
                Plan.id == execution.table_entity_id
            )
        elif execution.table_name == "plan:generate":
            # For plan generation, get client_pseudo_id via plan
            gen_stmt = select(PlanGeneration.plan_id).where(
                PlanGeneration.id == execution.table_entity_id
            )
            gen_result = await session.execute(gen_stmt)
            plan_id = gen_result.scalar_one_or_none()
            if plan_id:
                stmt = select(Plan.client_pseudo_id).where(Plan.id == plan_id)
            else:
                return "unknown"
        elif execution.table_name == "recording_session":
            # Use raw SQL to avoid model column issues
            from sqlalchemy import text

            raw_stmt = text(
                "SELECT client_pseudo_id FROM recording_session WHERE id = :id"
            )
            result = await session.execute(raw_stmt, {"id": execution.table_entity_id})
            return result.scalar_one_or_none() or "unknown"
        else:
            return "unknown"

        result = await session.execute(stmt)
        return result.scalar_one_or_none() or "unknown"
    except Exception:
        return "unknown"


@cli.command()
async def investigate_execution_failures():
    """
    Show all stuck or failed tasks with detailed client context and resource summary.
    """
    logger.info("Investigating stuck and failed executions")

    from datetime import datetime, timedelta

    # Connect to Redis to check queue status
    redis_client = redis.from_url(settings.REDIS_URL)
    await redis_client.ping()
    queued_task_ids = await get_redis_queue_task_ids(redis_client)
    await redis_client.close()

    async with get_session_async_manager() as session:
        # Get all executions
        all_executions_stmt = select(Execution)
        result = await session.execute(all_executions_stmt)
        all_executions = result.scalars().all()

        # Categorize problematic executions
        failed_executions = []
        stuck_processing = []
        stuck_pending = []

        cutoff_processing = datetime.utcnow() - timedelta(minutes=30)
        cutoff_pending = datetime.utcnow() - timedelta(hours=1)

        for execution in all_executions:
            if execution.status == ExecutionStatus.FAILED:
                failed_executions.append(execution)
            elif (
                execution.status == ExecutionStatus.IN_PROGRESS
                and execution.updated_at < cutoff_processing
            ):
                stuck_processing.append(execution)
            elif (
                execution.status == ExecutionStatus.PENDING
                and execution.created_at < cutoff_pending
            ):
                stuck_pending.append(execution)

        logger.info(
            f"Found {len(failed_executions)} failed, {len(stuck_processing)} stuck processing, {len(stuck_pending)} stuck pending"
        )

        # Process each category
        for category_name, executions in [
            ("FAILED EXECUTIONS", failed_executions),
            ("STUCK PROCESSING (>30min)", stuck_processing),
            ("STUCK PENDING (>1hr)", stuck_pending),
        ]:
            if not executions:
                continue

            logger.info(f"\n=== {category_name} ===")

            # Group by task type
            by_type = {}
            for execution in executions:
                task_type = execution.table_name or "unknown"
                if task_type not in by_type:
                    by_type[task_type] = []
                by_type[task_type].append(execution)

            for task_type in sorted(by_type.keys()):
                task_executions = by_type[task_type]
                logger.info(
                    f"\n--- {task_type.upper()} ({len(task_executions)} tasks) ---"
                )

                for execution in sorted(
                    task_executions, key=lambda x: x.updated_at, reverse=True
                ):
                    # Get client info
                    client_pseudo_id = await get_client_pseudo_id_for_execution(
                        session, execution
                    )

                    # Get detailed resource summary
                    if client_pseudo_id != "unknown":
                        resources = await get_client_resources_detailed(
                            session, client_pseudo_id
                        )
                    else:
                        resources = {
                            "intake": {"exists": False},
                            "messages": 0,
                            "assessments": [],
                            "plans": [],
                            "recording": {"exists": False},
                            "other_executions": [],
                        }

                    # Check if in Redis queue
                    in_queue = (
                        "YES"
                        if execution.task_id and execution.task_id in queued_task_ids
                        else "NO"
                    )

                    # Build complete execution details in single log message
                    details = [
                        "\n🔍 EXECUTION DETAILS:",
                        f"     ID: {execution.id}",
                        f"     Entity ID: {execution.table_entity_id}",
                        f"     Status: {execution.status.value}",
                        f"     Created: {execution.created_at}",
                        f"     Updated: {execution.updated_at}",
                        f"     Progress: {execution.progress}%",
                        f"     Task ID: {execution.task_id}",
                        f"     In Redis Queue: {in_queue}",
                    ]

                    if execution.message:
                        details.append(f"     Message: {execution.message}")
                    if execution.output:
                        details.append(f"     Output: {str(execution.output)[:300]}...")

                    details.append(f"\n👤 CLIENT: {client_pseudo_id}")
                    if client_pseudo_id != "unknown":
                        details.append(f"     Name: {resources['client_name']}")

                    details.append("\n📋 INTAKE:")
                    if resources["intake"]["exists"]:
                        intake_type = resources["intake"]["type"]
                        details.append(f"     Type: {intake_type}")
                        details.append(f"     Status: {resources['intake']['status']}")

                        if intake_type == "conversation":
                            details.append(
                                f"     Current Section: {resources['intake']['current_section']}"
                            )
                            details.append(f"     Messages: {resources['messages']}")
                        elif intake_type == "transcription":
                            if resources["recording"]["exists"]:
                                recording_length = resources["recording"]["chunk_count"]
                                details.append(
                                    f"     Recording Length: ~{recording_length} seconds ({recording_length // 60}m {recording_length % 60}s)"
                                )
                                details.append(
                                    f"     Has Transcript: {'Yes' if resources['recording']['transcription_approved'] else 'No'}"
                                )
                            else:
                                details.append("     Recording: Not found")
                    else:
                        details.append("     No intake found")

                    details.append(
                        f"\n📊 ASSESSMENTS ({len(resources['assessments'])}):"
                    )
                    for i, assessment in enumerate(resources["assessments"]):
                        details.append(f"     {i+1}. Type: {assessment['type']}")

                    details.append(f"\n📋 PLANS ({len(resources['plans'])}):")
                    for i, plan in enumerate(resources["plans"]):
                        edited_text = (
                            " (edited manually)" if plan["edited_manually"] else ""
                        )
                        details.append(
                            f"     {i+1}. Create Status: {plan['create_status']}{edited_text}"
                        )

                    details.append(
                        f"\n⚙️ OTHER EXECUTIONS ({len(resources['other_executions'])}):"
                    )
                    exec_summary = {}
                    for exec_info in resources["other_executions"]:
                        key = f"{exec_info['table_name']}:{exec_info['status']}"
                        exec_summary[key] = exec_summary.get(key, 0) + 1
                    for key, count in exec_summary.items():
                        details.append(f"     {key}: {count}")

                    details.append("=" * 60)

                    logger.info("\n".join(details))

    logger.info("Investigation completed")
