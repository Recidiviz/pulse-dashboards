import uuid

import structlog
import typer

from app.core.db import get_session_async_manager
from app.crud.execution import get_execution_by_id, upsert_execution
from app.models.execution import Execution, ExecutionStatus
from app.tasks.recording import process_recording, process_recording_task
from app.tasks.scheduler import execution_context

from .base import cli

logger = structlog.get_logger(__name__)


@cli.command()
async def process_recording_session(
    recording_session_id: str = typer.Argument(
        ..., help="The ID of the recording session to process."
    ),
    execution_id: str = typer.Option(
        None, help="An optional execution ID to resume a previous run."
    ),
    async_mode: bool = typer.Option(
        False,
        "--async",
        help="Dispatch the task to a Taskiq worker instead of running in-process.",
    ),
):
    """
    Manually run or dispatch a task to process a recording session.
    """
    recording_session_uuid = uuid.UUID(recording_session_id)
    execution_uuid = uuid.UUID(execution_id) if execution_id else None

    async with get_session_async_manager() as session:
        if execution_uuid:
            execution = await get_execution_by_id(session, execution_uuid)
            if not execution:
                logger.error("Execution not found", execution_id=execution_id)
                return
        else:
            execution = Execution(
                status=ExecutionStatus.PENDING,
                table_name="recording_session",
                table_entity_id=recording_session_uuid,
            )
            await upsert_execution(session, execution)
            logger.info("Created new execution.", execution_id=str(execution.id))

        if async_mode:
            task = await process_recording_task.kiq(
                execution_id=execution.id,
                recording_session_id=recording_session_uuid,
            )
            execution.task_id = str(task.task_id)
            await upsert_execution(session, execution)
            logger.info(
                "Successfully dispatched process_recording_task to worker.",
                execution_id=str(execution.id),
                task_id=execution.task_id,
            )
        else:
            logger.info("Running task in-process.", execution_id=str(execution.id))
            try:
                async with execution_context(session, execution.id) as exec_ctx:
                    await process_recording(
                        execution=exec_ctx,
                        recording_session_id=recording_session_uuid,
                        session=session,
                        task_logger=logger,
                    )
                logger.info("In-process task finished successfully.")
            except Exception as e:
                logger.error("In-process task failed.", error=str(e))
