from uuid import UUID

import structlog

from app.core.config import settings
from app.core.db import AsyncSession
from app.crud.recording_session import get_recording_session_by_id
from app.models.recording import RecordingSession
from app.services.recording_service import RecordingService
from app.tasks.scheduler import Execution


async def assemble_audio(
    execution: Execution,
    recording_session_id: UUID,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
) -> RecordingSession:
    """
    Assembles audio chunks into a final audio file.
    If the final file already exists, this step is skipped.
    """
    recording_session = await get_recording_session_by_id(session, recording_session_id)
    if not recording_session:
        raise ValueError(f"Recording session {recording_session_id} not found")

    if recording_session.gcs_final_file_path:
        task_logger.info("Final audio file already exists, skipping assembly.")
        return recording_session

    await execution.log_progress(
        session,
        10,
        "Processing audio chunks into one final audio file.",
        logger=task_logger,
    )

    async with RecordingService(settings.GCS_BUCKET_NAME) as recording_service:
        final_path = await recording_service.process_chunks_to_final_audio(
            str(recording_session_id)
        )

    recording_session.gcs_final_file_path = final_path
    recording_session.audio_file_url = f"gs://{settings.GCS_BUCKET_NAME}/{final_path}"
    session.add(recording_session)
    await session.commit()

    await execution.log_progress(
        session, 30, "Audio processed and ready for transcription.", logger=task_logger
    )

    return recording_session
