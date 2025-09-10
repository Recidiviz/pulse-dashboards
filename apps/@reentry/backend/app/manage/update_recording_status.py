from uuid import UUID

import structlog
import typer

from app.core.db import AsyncSession, get_session_async_manager
from app.crud.recording_session import get_recording_session_by_id
from app.models.recording import RecordingStatus

from .base import cli

logger = structlog.get_logger(__name__)


async def _update_recording_status(
    session: AsyncSession,
    recording_session_id: str,
    recording_status: str,
):
    try:
        status = RecordingStatus(recording_status)
    except Exception as error:
        logger.error(f"Invalid recording status: {recording_status}: {error}")
        raise ValueError(
            f"Invalid recording status: {recording_status}. Valid options are {[status.value for status in RecordingStatus]}"
        )

    try:
        recording_session = await get_recording_session_by_id(
            session, UUID(recording_session_id)
        )
        if not recording_session:
            raise ValueError(f"Recording session {recording_session_id} not found.")
    except Exception as error:
        logger.error(
            f"Error in fetching recording session {recording_session_id}: {error}"
        )
        raise

    recording_session.status = status
    session.add(recording_session)
    await session.commit()


@cli.command()
async def update_recording_status(
    recording_session_id: str = typer.Argument(
        ..., help="The ID of the recording session."
    ),
    recording_status: str = typer.Argument(
        ..., help="The recording status to update to."
    ),
):
    logger.info(
        f"Update recording session: {recording_session_id} to {recording_status}"
    )
    async with get_session_async_manager() as session:
        await _update_recording_status(session, recording_session_id, recording_status)

    logger.info(
        f"End of update. Recording session: {recording_session_id} to {recording_status}"
    )
