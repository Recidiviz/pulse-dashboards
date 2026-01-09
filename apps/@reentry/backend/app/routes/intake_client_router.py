import structlog
import os
import shutil
import tempfile
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.core.db import AsyncSession, get_session
from app.crud.intake import (
    get_intake_by_id,
    get_latest_active_conversation_intake,
)
from app.models.intake import (
    COMPLETION_SECTION,
    ClientAddress,
    IntakeStatus,
    IntakeSurvey,
)
from app.routes.base import IntakeSectionResponse
from app.routes.client_router import ClientRecordResponse
from app.routes.shared_models import (
    AddressSubmission,
    IntakeMessageRole,
    SurveySubmission,
)
from app.services.client_data.queries import Queries
from app.tasks.transcribe_audio_with_deepgram import deepgram_transcription_diarization
from app.utils.assessment_config_utils import enrich_sections_with_status
from app.utils.config_loader import ConfigLoader

from .base import ORMResponse

logger = structlog.get_logger(__name__)

router = APIRouter()
security = HTTPBearer()


# -------------------- Get intake ------
class IntakeMessageResponse(ORMResponse):
    content: str
    from_role: IntakeMessageRole
    section: str | None = None


class IntakeResponse(ORMResponse):
    client_pseudo_id: str
    status: IntakeStatus
    current_section: str | None = None
    internal_access: Optional[bool] = None
    has_address: bool = False
    has_survey: bool = False


class IntakeWithSectionsResponse(IntakeResponse):
    intake_sections: List[IntakeSectionResponse]


class IntakeWithSectionsAndMessagesResponse(IntakeWithSectionsResponse):
    current_section_messages: List[IntakeMessageResponse]
    client_name: str | None = None
    has_accepted_terms: bool = False
    client_state: str | None = None


async def get_intake_and_config(session, client_pseudo_id):
    # Get the latest CREATED or IN_PROGRESS conversation intake for this client
    intake = await get_latest_active_conversation_intake(
        session, client_pseudo_id, None
    )

    if not intake:
        # No active intake found for this client_pseudo_id
        raise HTTPException(
            status_code=404,
            detail="Not Found",
        )

    assessment_config = await ConfigLoader.load_assessment_config(
        intake.assessment_config_id, session
    )
    if assessment_config.intake.intake_type != "conversation":
        raise HTTPException(
            status_code=401,
            detail="This intake is not a conversation type",
        )
    return (intake, assessment_config)


async def get_intake_sections(intake, assessment_config):
    # Support both legacy and new paths for section data
    if intake.client_intake_sections:
        # LEGACY PATH: Use ClientIntakeSection records
        logger.info("Using sections from client_intake_sections (legacy path)")
        sections_data = [
            IntakeSectionResponse(
                **section.get_effective_section_data(),
                status=section.completion_status,
            )
            for section in intake.client_intake_sections
        ]
        return sections_data
    else:
        # NEW PATH: Load from assessment config
        logger.info("Using sections from assessment config (new path)")

        sections_data = (
            assessment_config.intake.sections
            if assessment_config.intake.sections
            else []
        )

        # Enrich sections with computed status
        sections_data = enrich_sections_with_status(
            sections_data, intake.current_section
        )

        print(f"🔍 CLIENT API: Returning intake data for {intake.id}")
        print(f"   Number of client sections: {len(intake.client_intake_sections)}")

        return sections_data


# For intake with urlToken - Gets all previous messages
@router.get(
    "/by-token/{token_from_url}",
    summary="Token auth - Fetch intake, client sections, and messages for the current section",
    description="Returns the intake record, associated client sections, current section messages, and client data",
    tags=["Client side intake assessment"],
    response_model=IntakeWithSectionsAndMessagesResponse,
)
async def get_client_intake_with_token(
    request: Request, token_from_url: str, session=Depends(get_session)
):
    client_pseudo_id: str = request.state.client.get("sub")

    (intake, assessment_config) = await get_intake_and_config(session, client_pseudo_id)

    if not (
        intake.intake_token
        and intake.intake_token.token == token_from_url
        and not intake.internal_access
        and intake.client_pseudo_id == client_pseudo_id
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    try:
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)
        if not client_record:
            raise HTTPException(
                status_code=404,
                detail=f"Client record not found for client ID: {client_pseudo_id}",
            )

        client_response = ClientRecordResponse(**client_record.model_dump())

        (
            current_section_messages,
            has_accepted_terms,
        ) = await intake.get_current_section_messages(session)

        sections_data = await get_intake_sections(intake, assessment_config)

        return IntakeWithSectionsAndMessagesResponse(
            **intake.model_dump(by_alias=True, exclude_none=True),
            has_survey=intake.has_survey,
            has_address=intake.has_address,
            intake_sections=sections_data,
            current_section_messages=[
                IntakeMessageResponse(**m.model_dump())
                for m in current_section_messages
            ],
            client_state=client_response.state_code,
            client_name=client_response.full_name.formatted_full_name(),
            has_accepted_terms=has_accepted_terms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the intake: {str(e)}",
        )


# For intake without urltoken, internal intakes
@router.get(
    "/",
    summary="Internal auth - Fetch intake, client sections, and messages for the current section from login time",
    description="Returns the intake record, associated client sections, current section messages, and client data",
    tags=["Client side intake assessment"],
    response_model=IntakeWithSectionsAndMessagesResponse,
)
async def get_client_intake(request: Request, session=Depends(get_session)):
    client_pseudo_id: str = request.state.client.get("sub")

    (intake, assessment_config) = await get_intake_and_config(session, client_pseudo_id)

    if not (intake.internal_access and intake.client_pseudo_id == client_pseudo_id):
        raise HTTPException(
            status_code=404,
            detail=f"Client record not found for client ID: {client_pseudo_id}",
        )

    try:
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)
        if not client_record:
            raise HTTPException(
                status_code=404,
                detail=f"Client record not found for client ID: {client_pseudo_id}",
            )

        client_response = ClientRecordResponse(**client_record.model_dump())

        login_timestamp = request.state.client.get("login_timestamp")

        if login_timestamp:
            # Internal user: only messages from current login session
            login_time = datetime.fromtimestamp(login_timestamp)
            (
                current_section_messages,
                has_accepted_terms,
            ) = await intake.get_current_section_messages(
                session, current_session_time=login_time
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized",
            )

        sections_data = await get_intake_sections(intake, assessment_config)

        return IntakeWithSectionsAndMessagesResponse(
            **intake.model_dump(by_alias=True, exclude_none=True),
            has_survey=intake.has_survey,
            has_address=intake.has_address,
            intake_sections=sections_data,
            current_section_messages=[
                IntakeMessageResponse(**m.model_dump())
                for m in current_section_messages
            ],
            client_state=client_response.state_code,
            client_name=client_response.full_name.formatted_full_name(),
            has_accepted_terms=has_accepted_terms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the intake: {str(e)}",
        )


# -------------------- Post things ------
async def validate_intake(session, intake_id, client_pseudo_id):
    intake = await get_intake_by_id(session, intake_id)

    if not intake:
        raise HTTPException(status_code=404, detail="Not found")

    if intake.client_pseudo_id != client_pseudo_id:
        raise HTTPException(status_code=401, detail="Not yours")
    return intake


class AddressSubmissionResponse(BaseModel):
    intake_completed: bool


@router.post(
    "/{intake_id}/address",
    summary="Submit client address for intake",
    description="Submit or update address information for the authenticated client's intake",
    tags=["Client side intake assessment"],
    response_model=AddressSubmissionResponse,
)
async def submit_address(
    request: Request,
    intake_id: UUID,
    address_data: AddressSubmission,
    session=Depends(get_session),
):
    # Extract client_pseudo_id from JWT token (set by ClientAuthMiddleware)
    client_pseudo_id: str = request.state.client.get("sub")

    # Get this intake with address relationship loaded
    intake = await validate_intake(session, intake_id, client_pseudo_id)

    if not intake:
        raise HTTPException(status_code=404, detail="No intake found")

    # Create or update address
    if intake.address:
        # Update existing address
        intake.address.city = address_data.city
        intake.address.state = address_data.state
        intake.address.street_address = address_data.street_address
        session.add(intake.address)
    else:
        # Create new address
        new_address = ClientAddress(
            intake_id=intake.id,
            city=address_data.city,
            state=address_data.state,
            street_address=address_data.street_address,
        )
        session.add(new_address)
    # Check if intake can be completed
    if (
        intake.status == IntakeStatus.IN_PROGRESS
        and intake.current_section == COMPLETION_SECTION
    ):
        await intake.update_status(session, IntakeStatus.COMPLETED)

    await session.commit()
    await session.refresh(intake)

    return {
        "intake_completed": intake.status == IntakeStatus.COMPLETED,
    }


@router.post(
    "/{intake_id}/survey",
    summary="Submit client survey for intake",
    description="Submit survey information for the authenticated client's intake",
    tags=["Client side intake assessment"],
)
async def submit_survey(
    request: Request,
    intake_id: UUID,
    survey_data: SurveySubmission,
    session=Depends(get_session),
):
    # Extract client_pseudo_id from JWT token (set by ClientAuthMiddleware)
    client_pseudo_id: str = request.state.client.get("sub")

    intake = await validate_intake(session, intake_id, client_pseudo_id)

    if intake.survey:
        # Update existing survey
        intake.survey.difficulty_rating = survey_data.difficulty_rating
        intake.survey.questions_confusing = survey_data.questions_confusing
        intake.survey.preferred_method = survey_data.preferred_method
        intake.survey.method_other = survey_data.preferred_method
        intake.survey.additional_feedback = survey_data.additional_feedback
        session.add(intake.survey)
    else:
        # Create new survey
        new_survey = IntakeSurvey(
            intake_id=intake.id,
            difficulty_rating=survey_data.difficulty_rating,
            questions_confusing=survey_data.questions_confusing,
            preferred_method=survey_data.preferred_method,
            method_other=survey_data.method_other,
            additional_feedback=survey_data.additional_feedback,
        )
        session.add(new_survey)

    await session.commit()
    await session.refresh(intake)

    return {
        "survey_submitted": True,
    }


# TODO authenticate this
@router.post(
    "/transcribe",
    summary="Transcribe audio file",
    description="Transcribes an uploaded audio file and returns the conversation",
    tags=["Client side intake assessment"],
)
async def transcribe_audio_route(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    # Create a temporary file to save the uploaded audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    transcription = ""
    try:
        response_dict = await deepgram_transcription_diarization(
            temp_file_path,
            "api-request",
            diarize=False,
        )
        channels = response_dict.get("results", {}).get("channels", [])
        if channels:
            transcription = channels[0].get("alternatives", [{}])[0].get("transcript")
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
    return {"transcription": transcription}


# -------------------- External ------
# This endpoint allows scheduling an assessment and subsequent plan generation
# based on chat messages provided directly, To be used by external systems that handle intake conversations separately
# (e.g. the 2nd version of the intake chat).
# class ChatMessageInput(BaseModel):
#     role: str
#     content: str
#     section: Optional[str] = None


# class CompleteExternalChatRequest(BaseModel):
#     messages: List[ChatMessageInput]
#     address: AddressSubmission
#     assessment_config_id: UUID


# TODO V2SUPPORT or remove - verify the assessment config exist and has external type
# class CompleteExternalChatResponse(BaseModel):
#     intake_id: str
#     status: str
#     message: str


# @router.post(
#     "/start-assessment-action-plan",
#     summary="Trigger assessment + plan generation from external chat",
#     description=("Schedules an assessment using provided chat messages. "),
#     tags=["Intake assessment - external"],
#     response_model=CompleteExternalChatResponse,
# )
# async def complete_external_chat(
#     request: Request,
#     data: CompleteExternalChatRequest,
#     session=Depends(get_session),
# ):
#     if not getattr(request.state, "client", None):
#         from app.auth.intake.utils import decode_jwt_token

#         auth_header = request.headers.get("Authorization", "")
#         if not auth_header.startswith("Bearer "):
#             raise HTTPException(status_code=401, detail="Missing Authorization header")
#         raw = auth_header.split(" ", 1)[1].strip()
#         claims = decode_jwt_token(raw)
#         request.state.client = {"sub": claims.get("sub")}

#     client_pseudo_id: str = request.state.client.get("sub")
#     if not client_pseudo_id:
#         raise HTTPException(status_code=401, detail="Unauthorized: missing client id")

#     # Get the latest CREATED or IN_PROGRESS external intake (or create if none exists)
#     intake = await get_latest_active_external_intake(session, client_pseudo_id)

#     if not intake:
#         try:
#             intake = await create_intake(
#                 session,
#                 client_pseudo_id,
#                 data.assessment_config_id,
#             )
#         except ValueError as e:
#             raise HTTPException(status_code=422, detail=str(e))

#     # save the intake messages to the database into the intake table
#     external_chat_messages = [msg.model_dump() for msg in data.messages]
#     intake.external_chat_messages = external_chat_messages

#     new_address = ClientAddress(
#         intake_id=intake.id,
#         street_address=data.address.street_address,
#         city=data.address.city,
#         state=data.address.state,
#     )
#     session.add(new_address)
#     session.add(intake)

#     await intake.update_status(session, IntakeStatus.COMPLETED)
#     await session.commit()
#     await session.refresh(intake)

#     return CompleteExternalChatResponse(
#         intake_id=str(intake.id),
#         status=str(intake.status),
#         message="Action plan scheduled",
#     )
