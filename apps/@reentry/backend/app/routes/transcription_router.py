import json
from typing import Dict, List, Optional
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, model_validator

from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.intake import get_intake_with_address_and_recording
from app.crud.recording_session import get_recording_session_by_id
from app.models.intake import ClientAddress, IntakeStatus
from app.models.recording import RecordingStatus
from app.services.recording_service import RecordingService
from app.utils.permission_utils import check_access

logger = structlog.get_logger(__name__)

router = APIRouter()
security = HTTPBearer()


class CompleteIntakeTrascriptionSubmission(BaseModel):
    """update: approved transcription will be set to true automatically if address is provided,
    since the action plan will be started rigth after the transcription is completed with address.
    """

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
    "/{intake_id}/complete-intake-transcription",
    summary="Submit Client address or transcription approval for intake transcription",
    description="Submit the client's address or transcription approval to complete the intake process.",
    response_model=CompleteIntakeTranscriptionResponse,
    tags=["Transcriptions"],
)
async def complete_intake_transcription(
    request: Request,
    intake_id: str,
    data: CompleteIntakeTrascriptionSubmission,
    session: AsyncSession = Depends(get_session),
):
    intake = await get_intake_with_address_and_recording(session, intake_id)

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)

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

    # Updated: August-28-25 approving the intake automatically if address is provided, it should start the action plan right after the transcription is completed
    # if data.approved is not None:
    #     intake.recording_session.transcription_approved = data.approved
    #     session.add(intake)
    intake.recording_session.transcription_approved = True
    session.add(intake)
    await session.commit()
    await session.refresh(intake)

    recording_session = intake.recording_session
    intake_has_address = intake.address.city and intake.address.state
    if recording_session.status == RecordingStatus.COMPLETED and intake_has_address:
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


class TranscriptionValidation(BaseModel):
    word_count: bool
    no_prompt_injection: bool
    diarization: bool
    minimum_duration: bool


class TranscriptionWithValidationResponse(BaseModel):
    transcription: TranscriptionOutputResponse
    validation: TranscriptionValidation


@router.get(
    "/{recording_session_id}/transcription",
    response_model=TranscriptionWithValidationResponse,
    summary="Get Client Interview Transcription",
    description="Retrieve the interview transcription for a client recording session.",
    tags=["Transcription"],
)
async def get_client_transcription(
    recording_session_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
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
        cpa_client_locations=auth_user_context["cpa_client_locations"],
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

    # Build validation response from recording session fields
    validation = TranscriptionValidation(
        word_count=recording_session.validation_word_count,
        no_prompt_injection=recording_session.validation_no_prompt_injection,
        diarization=recording_session.validation_diarization,
        minimum_duration=recording_session.validation_minimum_duration,
    )

    return TranscriptionWithValidationResponse(
        transcription=TranscriptionOutputResponse.model_validate(transcription_data),
        validation=validation,
    )
