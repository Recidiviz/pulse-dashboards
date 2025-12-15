"""
Webhook routes for external service callbacks.
"""

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.db import AsyncSession, get_session
from app.models.intake import Intake, IntakeStatus
from app.models.recording import RecordingSession, RecordingStatus
from app.utils.transcription.deepgram_utils import process_deepgram_transcription

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["webhooks"])


@router.post("/deepgram/transcription")
async def deepgram_transcription_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Webhook endpoint for receiving transcription results from Deepgram.
    This is called by Deepgram when async transcription completes.
    """
    try:
        # Get the raw payload
        payload = await request.json()
        # Extract request_id from metadata
        metadata = payload.get("metadata", {})
        request_id = metadata.get("request_id") or payload.get("request_id")
        if not request_id:
            logger.error("No request_id found in Deepgram callback", payload=payload)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing request_id in callback payload",
            )

        # Find the recording session by deepgram_request_id
        statement = select(RecordingSession).where(
            RecordingSession.deepgram_request_id == request_id
        )
        # test if theres more statement with the same request_id
        result = await session.exec(statement)
        recording_session = result.all()

        if len(recording_session) > 1:
            logger.error(
                "Multiple recording sessions found for request_id",
                request_id=request_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Multiple recording sessions found for request_id: {request_id}",
            )

        result = await session.exec(statement)
        recording_session = result.first()

        if not recording_session:
            logger.error(
                "Recording session not found for request_id",
                request_id=request_id,
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recording session not found for request_id: {request_id}",
            )

        task_logger = logger.bind(
            recording_session_id=recording_session.id.hex,
            request_id=request_id,
        )

        # Process the transcription result
        await handle_transcription_completion(
            recording_session=recording_session,
            transcription_result=payload,
            session=session,
            task_logger=task_logger,
        )

        return {"status": "success", "message": "Transcription processed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error processing Deepgram callback", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing callback: {str(e)}",
        )


async def handle_transcription_completion(
    recording_session: RecordingSession,
    transcription_result: dict,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    """
    Handles the completion of transcription when callback is received.
    This continues the processing that was paused after initiating transcription.
    """
    try:
        # Process the transcription using the shared utility function
        await process_deepgram_transcription(
            recording_session=recording_session,
            transcription_result=transcription_result,
            session=session,
            task_logger=task_logger,
        )
        # Update recording session status to completed
        recording_session.status = RecordingStatus.COMPLETED
        session.add(recording_session)
        await session.commit()

        # Continue with intake completion logic
        try:
            statement = (
                select(Intake)
                .where(Intake.id == recording_session.intake_id)
                .options(selectinload(Intake.address))
            )
            result = await session.exec(statement)
            intake = result.first()

            if not intake:
                raise ValueError(
                    f"Intake not found for recording session {recording_session.id}"
                )

            await session.refresh(intake)
            intake_has_address = (
                intake.address and intake.address.city and intake.address.state
            )
            if intake_has_address:
                await intake.update_status(session, IntakeStatus.COMPLETED)
        except Exception as e:
            task_logger.error("Failed to update intake status", error=str(e))

    except Exception as e:
        task_logger.error("Failed to process transcription completion", error=str(e))
        recording_session.status = RecordingStatus.ERROR
        session.add(recording_session)
        await session.commit()
        raise
