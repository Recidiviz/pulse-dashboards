"""
CRUD operations for recording sessions.
"""

import structlog
from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.recording import RecordingSession, RecordingStatus

logger = structlog.get_logger(__name__)


async def create_recording_session(
    session: AsyncSession,
    recording_session: RecordingSession,
) -> RecordingSession:
    session.add(recording_session)
    await session.commit()
    await session.refresh(recording_session)
    logger.info(
        f"Created recording session {recording_session.id} for client {recording_session.client_pseudo_id}"
    )
    return recording_session


@overload
async def get_recording_session_by_id(
    session: AsyncSession, session_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[RecordingSession]: ...


@overload
async def get_recording_session_by_id(
    session: AsyncSession, session_id: UUID, *, query_only: Literal[False] = False
) -> RecordingSession | None: ...


@statement_or_result(first_only=True)
async def get_recording_session_by_id(
    session: AsyncSession, session_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[RecordingSession] | RecordingSession | None:
    query = select(RecordingSession).where(RecordingSession.id == session_id)
    return query


@overload
async def get_recording_sessions_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: Literal[True]
) -> SelectOfScalar[RecordingSession]: ...


@overload
async def get_recording_sessions_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: Literal[False] = False
) -> list[RecordingSession]: ...


@statement_or_result(first_only=False)
async def get_recording_sessions_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: bool = False
) -> SelectOfScalar[RecordingSession] | list[RecordingSession]:
    query = (
        select(RecordingSession)
        .where(RecordingSession.client_pseudo_id == client_pseudo_id)
        .order_by(RecordingSession.created_at.desc())
    )
    return query


async def update_status(
    session: AsyncSession,
    session_id: UUID,
    status: RecordingStatus,
    audio_chunks_url: str | None = None,
    audio_file_url: str | None = None,
) -> RecordingSession | None:
    recording_session = await get_recording_session_by_id(session, session_id)

    if not recording_session:
        logger.warning(f"Recording session {session_id} not found for status update")
        return None
    if status == "paused" and recording_session.status in [
        "processing",
        "completed",
        "error",
    ]:
        logger.warning(
            f"Cannot pause recording session {session_id} as it is not in 'recording' status"
        )
        return recording_session
    recording_session.status = status
    if audio_chunks_url is not None:
        recording_session.audio_chunks_url = audio_chunks_url
    if audio_file_url is not None:
        recording_session.audio_file_url = audio_file_url

    session.add(recording_session)
    await session.commit()
    await session.refresh(recording_session)

    logger.info(f"Updated recording session {session_id} status to {status}")
    return recording_session
