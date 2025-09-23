"""
Recording session router for managing audio recording sessions.
"""

import base64
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update
from sqlmodel import select

from app.auth.auth_core import get_pseudonymized_id
from app.core.config import settings
from app.core.db import AsyncSession, get_session
from app.crud.intake import (
    create_intake,
    get_intake_by_client_pseudo_id,
    get_intake_by_id,
)
from app.crud.recording_session import (
    create_recording_session,
    get_recording_session_by_id,
    get_recording_sessions_by_client_pseudo_id,
    update_status,
)
from app.models.intake import IntakeType
from app.models.recording import RecordingChunk, RecordingSession, RecordingStatus
from app.routes.recording_session_models import (
    CreateRecordingSessionRequest,
    FinalizeRecordingRequest,
    FinalizeRecordingResponse,
    RecordingSessionResponse,
    RecordingSessionStatusResponse,
    SignedUrlResponse,
    UpdateRecordingSessionStatusRequest,
    UploadChunkRequest,
    UploadChunkResponse,
)
from app.services.recording_service import RecordingService
from app.tasks.recording import process_recording_task
from app.tasks.scheduler import schedule_task
from app.utils.permission_utils import check_access

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/sessions/clients/{client_pseudo_id}",
    response_model=List[RecordingSessionResponse],
    summary="Get recording sessions for client",
    description="Retrieve all recording sessions associated with a specific client",
    tags=["Recording Sessions"],
)
async def get_client_recording_sessions(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> List[RecordingSessionResponse]:
    check_access(
        client_pseudo_id=client_pseudo_id, pseudonymized_staff_id=pseudonymized_id
    )
    recording_sessions = await get_recording_sessions_by_client_pseudo_id(
        session, client_pseudo_id
    )

    logger.info(
        f"Retrieved {len(recording_sessions)} recording sessions for client {client_pseudo_id}"
    )
    return recording_sessions


@router.post(
    "/sessions",
    response_model=RecordingSessionResponse,
    summary="Create new recording session",
    description="Create a new recording session for a client",
    tags=["Recording Sessions"],
)
async def create_new_recording_session(
    request: CreateRecordingSessionRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> RecordingSessionResponse:
    check_access(
        client_pseudo_id=request.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    # Check if intake exists for the client, create if not
    intake = await get_intake_by_client_pseudo_id(session, request.client_pseudo_id)
    if not intake:
        intake = await create_intake(
            session, request.client_pseudo_id, IntakeType.TRANSCRIPTION
        )
    if not intake:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve or create intake"
        )

    # Refresh intake to access relationships
    intake = await get_intake_by_id(session, intake.id)

    if intake.recording_session is not None:
        raise HTTPException(
            status_code=400, detail="This intake already has a recording session"
        )

    # Create the new recording session linked to the intake
    recording_session = RecordingSession(
        client_pseudo_id=request.client_pseudo_id,
        status=RecordingStatus.CREATED,
        intake_id=intake.id,
    )
    created_session = await create_recording_session(session, recording_session)

    created_session.gcs_bucket_name = settings.GCS_BUCKET_NAME
    created_session.gcs_chunks_folder = f"recordings/{created_session.id}/chunks"
    session.add(created_session)
    await session.commit()
    await session.refresh(created_session)

    logger.info(
        f"Recording session {created_session.id} created for client {request.client_pseudo_id}"
    )

    return created_session


@router.get(
    "/sessions/{session_id}",
    response_model=RecordingSessionResponse,
    summary="Get recording session by ID",
    description="Retrieve a specific recording session by its ID",
    tags=["Recording Sessions"],
)
async def get_recording_session(
    session_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> RecordingSessionResponse:
    recording_session = await get_recording_session_by_id(session, session_id)

    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    # TODO: here we're leaking a little info because someone who doesn't have access can know what recordings exist. Low priority
    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    logger.info(f"Retrieved recording session {session_id}")
    return recording_session


@router.get(
    "/sessions/{session_id}/status",
    response_model=RecordingSessionStatusResponse,
    summary="Get recording session status for polling",
    description="Retrieve lightweight status information for a recording session, optimized for polling",
    tags=["Recording Sessions"],
)
async def get_recording_session_status(
    session_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> RecordingSessionStatusResponse:
    recording_session = await get_recording_session_by_id(session, session_id)

    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    logger.info(f"Retrieved status for recording session {session_id}")

    return RecordingSessionStatusResponse(
        id=str(recording_session.id),
        status=recording_session.status,
        chunk_count=recording_session.chunk_count,
        updated_at=recording_session.updated_at,
        gcs_final_file_path=recording_session.gcs_final_file_path,
        transcription_approved=recording_session.transcription_approved,
    )


@router.put(
    "/sessions/{session_id}/status",
    response_model=RecordingSessionResponse,
    summary="Update recording session status",
    description="Update the status of a recording session (e.g., from created to recording, paused, etc.)",
    tags=["Recording Sessions"],
)
async def update_recording_session_status(
    session_id: UUID,
    request: UpdateRecordingSessionStatusRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> RecordingSessionResponse:
    recording_session = await get_recording_session_by_id(session, session_id)
    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    updated_session = await update_status(
        session,
        session_id,
        request.status,
        request.audio_chunks_url,
        request.audio_file_url,
    )

    if not updated_session:
        raise HTTPException(
            status_code=500, detail="Failed to update recording session status"
        )

    logger.info(f"Updated recording session {session_id} status to {request.status}")

    return RecordingSessionResponse(
        id=str(updated_session.id),
        client_pseudo_id=updated_session.client_pseudo_id,
        intake_id=updated_session.intake_id,
        audio_chunks_url=updated_session.audio_chunks_url,
        audio_file_url=updated_session.audio_file_url,
        status=updated_session.status,
        gcs_bucket_name=updated_session.gcs_bucket_name,
        gcs_chunks_folder=updated_session.gcs_chunks_folder,
        gcs_final_file_path=updated_session.gcs_final_file_path,
        chunk_count=updated_session.chunk_count,
        created_at=updated_session.created_at,
        updated_at=updated_session.updated_at,
        transcription_approved=updated_session.transcription_approved,
    )


@router.post(
    "/sessions/{session_id}/upload-chunk",
    response_model=UploadChunkResponse,
    summary="Upload audio chunk to cloud storage",
    tags=["Recording Sessions"],
)
async def upload_audio_chunk(
    session_id: UUID,
    request: UploadChunkRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> UploadChunkResponse:
    recording_session = await get_recording_session_by_id(session, session_id)
    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    try:
        result = await session.exec(
            select(RecordingChunk)
            .where(RecordingChunk.session_id == session_id)
            .where(RecordingChunk.timestamp == request.timestamp)
        )
        existing_chunk = result.first()

        if existing_chunk:
            logger.info(
                f"Chunk with timestamp {request.timestamp} already exists for session {session_id}, skipping upload"
            )
            return UploadChunkResponse(
                success=True,
                chunk_index=request.chunk_index,
                timestamp=request.timestamp,
                message="Chunk already uploaded",
            )

        chunk_data = base64.b64decode(request.chunk_data)

        async with RecordingService(settings.GCS_BUCKET_NAME) as recording_service:
            await recording_service.upload_chunk(
                str(session_id),
                request.chunk_index,
                chunk_data,
                request.has_header,
                request.timestamp,
            )

        chunk_record = RecordingChunk(
            session_id=session_id,
            timestamp=request.timestamp,
            chunk_index=request.chunk_index,  # keep for compatibility
        )
        session.add(chunk_record)

        # atomic increment
        stmt = (
            update(RecordingSession)
            .where(RecordingSession.id == session_id)
            .values(
                chunk_count=RecordingSession.chunk_count + 1,
                last_chunk_timestamp=request.timestamp,
            )
        )
        await session.exec(stmt)
        await session.commit()

        logger.info(
            f"Uploaded chunk {request.chunk_index} for session {session_id} (has_header: {request.has_header})"
        )

        return UploadChunkResponse(
            success=True,
            chunk_index=request.chunk_index,
            timestamp=request.timestamp,
            message="Chunk uploaded successfully",
        )
    except Exception as e:
        await session.rollback()
        logger.error(
            f"Error uploading chunk {request.chunk_index} (timestamp: {request.timestamp}) "
            f"for session {session_id}: {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to upload chunk")


@router.post(
    "/sessions/{session_id}/finalize",
    response_model=FinalizeRecordingResponse,
    summary="Finalize recording and merge chunks",
    tags=["Recording Sessions"],
)
async def finalize_recording(
    session_id: UUID,
    request: FinalizeRecordingRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> FinalizeRecordingResponse:
    recording_session = await get_recording_session_by_id(session, session_id)
    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    execution = await schedule_task(
        session,
        table_name="recording_session",
        table_entity_id=session_id,
        task_func=process_recording_task,
        task_kwargs={
            "recording_session_id": session_id,
        },
    )

    recording_session.execution_id = execution.id
    recording_session.status = RecordingStatus.PROCESSING
    session.add(recording_session)
    await session.commit()
    await session.refresh(recording_session)

    return FinalizeRecordingResponse(execution_id=str(execution.id))


@router.get(
    "/sessions/{session_id}/signed-url",
    response_model=SignedUrlResponse,
    summary="Get signed URL for final audio file",
    tags=["Recording Sessions"],
)
async def get_signed_url(
    session_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
) -> SignedUrlResponse:
    recording_session = await get_recording_session_by_id(session, session_id)
    if not recording_session:
        raise HTTPException(status_code=404, detail="Recording session not found")

    if recording_session.status != RecordingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Recording not completed yet")

    if not recording_session.gcs_final_file_path:
        raise HTTPException(status_code=400, detail="No final audio file available")

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    try:
        async with RecordingService(settings.GCS_BUCKET_NAME) as recording_service:
            signed_url = await recording_service.generate_signed_url(
                recording_session.gcs_final_file_path
            )

        return SignedUrlResponse(
            signed_url=signed_url,
            expires_in_seconds=24 * 3600,  # 24 hours
        )
    except Exception as e:
        logger.error(f"Error generating signed URL for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate signed URL")
