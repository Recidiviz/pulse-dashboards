from uuid import UUID

import structlog
from taskiq import TaskiqDepends

from app.core.db import AsyncSession, get_session
from app.models.recording import RecordingStatus
from app.tasks.recording_assemble_audio import assemble_audio
from app.tasks.recording_transcribe_audio import transcribe_audio

from .base import broker
from .scheduler import Execution, execution_context

logger = structlog.get_logger(__name__)


@broker.task
async def process_recording_task(
    execution_id: UUID,
    recording_session_id: UUID,
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(
            execution_id=execution_id.hex,
            recording_session_id=recording_session_id.hex,
        )
        await process_recording(
            execution=execution,
            recording_session_id=recording_session_id,
            session=session,
            task_logger=task_logger,
        )


async def process_recording(
    execution: Execution,
    recording_session_id: UUID,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    await execution.log_progress(
        session, 1, "Get recording session", logger=task_logger
    )

    # Assemble audio first
    recording_session = await assemble_audio(
        execution=execution,
        recording_session_id=recording_session_id,
        session=session,
        task_logger=task_logger,
    )

    # Then, transcribe the audio
    await transcribe_audio(
        execution=execution,
        recording_session=recording_session,
        session=session,
        task_logger=task_logger,
    )

    # It's finished !
    recording_session.status = RecordingStatus.COMPLETED
    session.add(recording_session)
    await session.commit()
    await execution.log_progress(session, 100, "Done", logger=task_logger)
