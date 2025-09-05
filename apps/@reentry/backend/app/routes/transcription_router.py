import json
import logging
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth_core import get_pseudonymized_id
from app.core.db import get_session
from app.crud.recording_session import get_recording_session_by_id
from app.models.intake import ClientAddress, Intake, IntakeStatus
from app.services.recording_service import RecordingService
from app.utils.permission_utils import check_access

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


class CompleteIntakeTrascriptionSubmission(BaseModel):
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    approved: Optional[bool] = None

    @model_validator(mode="after")
    def at_least_one_field_provided(cls, values):
        if not any([values.approved, values.city, values.state, values.street_address]):
            raise ValueError(
                "You must provide either address information or transcription approval."
            )
        return values

    def has_address(self) -> bool:
        return self.city is not None and self.state is not None

    def as_combined_string(self):
        result = f"{self.city}, {self.state}" if self.city and self.state else ""
        if self.street_address:
            result = f"{self.street_address}, {result}"
        return result


class CompleteIntakeTranscriptionResponse(BaseModel):
    intake_completed: bool
    intake_approved: bool
    address_updated: bool


@router.post(
    "/{client_pseudo_id}/complete-intake-transcription",
    summary="Submit Client address or transcription approval for intake transcription",
    description="Submit the client's address or transcription approval to complete the intake process.",
    response_model=CompleteIntakeTranscriptionResponse,
    tags=["transcription"],
)
async def complete_intake_transcription(
    request: Request,
    client_pseudo_id: str,
    data: CompleteIntakeTrascriptionSubmission,
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy.orm import selectinload
    from sqlmodel import select

    statement = (
        select(Intake)
        .where(Intake.client_pseudo_id == client_pseudo_id)
        .options(
            selectinload(Intake.address),
            selectinload(Intake.recording_session),
        )
    )
    result = await session.exec(statement)
    intake = result.first()

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    if data.has_address():
        if intake.address:
            intake.address.city = data.city
            intake.address.state = data.state
            intake.address.street_address = data.street_address
            session.add(intake.address)
        else:
            new_address = ClientAddress(
                intake_id=intake.id,
                city=data.city,
                state=data.state,
                street_address=data.street_address,
            )
            session.add(new_address)

    if data.approved is not None:
        intake.recording_session.transcription_approved = data.approved
        session.add(intake)

    await session.commit()
    await session.refresh(intake)

    intake_has_address = intake.address.city and intake.address.state
    if intake.recording_session.transcription_approved and intake_has_address:
        await intake.update_status(session, IntakeStatus.COMPLETED)
        await session.commit()
        await session.refresh(intake)

    return CompleteIntakeTranscriptionResponse(
        intake_completed=intake.status == IntakeStatus.COMPLETED,
        intake_approved=intake.recording_session.transcription_approved,
        address_updated=bool(intake_has_address),
    )


class ConversationTurnResponse(BaseModel):
    id: str
    role: str
    content: str
    startTime: str
    endTime: str
    speakerTag: int
    wordCount: int
    duration: str


class SpeakerStats(BaseModel):
    turns: int
    duration: str


class OutputMetadataResponse(BaseModel):
    totalDuration: str
    totalTurns: int
    speakers: Dict[str, SpeakerStats]
    averageConfidence: float
    language: str
    createdAt: str


class TranscriptionOutputResponse(BaseModel):
    metadata: OutputMetadataResponse
    conversation: List[ConversationTurnResponse]


@router.get(
    "/{recording_session_id}/transcription",
    response_model=TranscriptionOutputResponse,
    summary="Get Client Interview Transcription",
    description="Retrieve the interview transcription for a client recording session.",
    tags=["Client Records"],
)
async def get_client_transcription(
    recording_session_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # Validate the session exists
    recording_session = await get_recording_session_by_id(session, recording_session_id)
    if recording_session is None:
        raise HTTPException(status_code=404, detail="Recording session not found")

    if recording_session.intake.client_pseudo_id != recording_session.client_pseudo_id:
        raise HTTPException(
            status_code=400,
            detail="Client ID mismatch between intake and recording session",
        )

    check_access(
        client_pseudo_id=recording_session.client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )

    # Try to retrieve the transcription from storage
    service = RecordingService(recording_session.gcs_bucket_name)
    try:
        data = await service.storage.download(
            bucket=recording_session.gcs_bucket_name,
            object_name=f"transcriptions/{recording_session_id}_processed.json",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to download transcription file: {str(e)}"
        )
    finally:
        await service.close()

    # Try to parse the JSON
    try:
        transcription_data = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid transcription file format")

    return TranscriptionOutputResponse.model_validate(transcription_data)
