from uuid import UUID

import structlog
from sqlalchemy.orm import selectinload
from sqlmodel import select
from taskiq import TaskiqDepends

from app.core.config import settings
from app.core.db import AsyncSession, get_session
from app.crud.recording_session import get_recording_session_by_id
from app.models.intake import Intake, IntakeStatus
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
        recording_session = await get_recording_session_by_id(
            session, recording_session_id
        )
        if not recording_session:
            raise ValueError(f"Recording session {recording_session_id} not found")

        structlog.contextvars.bind_contextvars(
            client_pseudo_id=recording_session.client_pseudo_id
        )

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

    # For Deepgram async mode, transcription is initiated but not completed
    # The webhook will handle completion, so we mark as TRANSCRIBING
    if settings.DIARIZATION_SERVICE == "deepgram" and settings.DEEPGRAM_CALLBACK:
        session.add(recording_session)
        await session.commit()

        await execution.log_progress(
            session,
            60,
            "Transcription initiated, waiting for completion via webhook",
            logger=task_logger,
        )

        task_logger.info(
            "Recording processing paused, waiting for Deepgram webhook callback",
            recording_session_id=recording_session_id.hex,
            deepgram_request_id=recording_session.deepgram_request_id,
        )
        # Don't complete here - webhook will handle completion
        return

    # For synchronous transcription services (GCP or Deepgram without callback), complete immediately
    recording_session.status = RecordingStatus.COMPLETED
    session.add(recording_session)
    await session.commit()

    # Start the assessment if an address were already provided
    try:
        # finding the intake with address
        statement = (
            select(Intake)
            .where(Intake.id == recording_session.intake_id)
            .options(
                selectinload(Intake.address),
            )
        )
        result = await session.exec(statement)
        intake = result.first()
        await session.refresh(intake)
        intake_has_address = (
            intake.address and intake.address.city and intake.address.state
        )
        task_logger.info(
            "Checking if intake can be completed",
            intake_id=intake.id,
            intake_status=intake.status,
            intake_has_address=intake_has_address,
        )
        if intake_has_address:
            await intake.update_status(session, IntakeStatus.COMPLETED)
            task_logger.info("Intake status updated to COMPLETED", intake_id=intake.id)
        else:
            task_logger.info(
                "Intake cannot be completed yet, missing address",
                intake_id=intake.id,
            )
    except Exception as e:
        task_logger.error("Failed to update intake status", error=str(e))

    await execution.log_progress(session, 100, "Done", logger=task_logger)
