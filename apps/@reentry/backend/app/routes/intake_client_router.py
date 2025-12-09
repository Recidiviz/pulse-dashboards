import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.auth.intake.auth_client_user import validate_dob
from app.core.db import get_session
from app.crud.intake import create_intake, get_intake_by_client_pseudo_id
from app.models.intake import (
    COMPLETION_SECTION,
    ClientAddress,
    Intake,
    IntakeStatus,
    IntakeSurvey,
    IntakeType,
)
from app.routes.base import IntakeSectionResponse
from app.routes.client_router import ClientRecordResponse
from app.routes.shared_models import (
    AddressSubmission,
    IntakeMessageResponse,
    SurveySubmission,
)
from app.services.client_data.queries import Queries
from app.utils.assessment_config_utils import enrich_sections_with_status
from app.utils.config_loader import ConfigLoader

from .base import ORMResponse

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


class VerifyDOBRequest(BaseModel):
    token_from_url: str
    date_of_birth: date


class VerifyDOBResponse(BaseModel):
    status: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    message: Optional[str] = None
    client_pseudo_id: str


class Message(ORMResponse):
    role: str
    agentId: Optional[str]
    content: str
    createdAt: Optional[str]


class SummaryResponse(ORMResponse):
    summary: str


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


@router.post(
    "/verify-dob",
    response_model=VerifyDOBResponse,
    summary="Verify date of birth and issue JWT token",
    description="Validates the client's date of birth against records and issues JWT token",
    tags=["Intake assessment"],
)
async def verify_date_of_birth(
    request: Request,
    data: VerifyDOBRequest,
    session=Depends(get_session),
):
    try:
        redis_client = request.app.state.redis_client

        result = await validate_dob(
            request, data.token_from_url, data.date_of_birth, session, redis_client
        )

        if not result.token_data or not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return VerifyDOBResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Date of birth verified successfully",
            client_pseudo_id=result.client_pseudo_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying date of birth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{token_from_url}",
    summary="Fetch intake, client sections, and messages for the current section",
    description="Returns the intake record, associated client sections, current section messages, and client data",
    tags=["Intake assessment"],
    response_model=IntakeWithSectionsAndMessagesResponse,
)
async def get_client_intake(
    request: Request, token_from_url: str, session=Depends(get_session)
):
    client_pseudo_id: str = request.state.client.get("sub")
    login_timestamp = request.state.client.get("login_timestamp")

    # First get the intake by client ID
    intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id, None)

    if not intake:
        # No intake found for this client_pseudo_id
        raise HTTPException(
            status_code=404,
            detail="Not Found",
        )

    has_access = False
    is_internal = intake.internal_access
    if (
        intake.intake_token
        and intake.intake_token.token == token_from_url
        and not intake.internal_access
        and intake.client_pseudo_id == client_pseudo_id
    ):
        has_access = True

    elif intake.internal_access and intake.client_pseudo_id == client_pseudo_id:
        has_access = True

    if not has_access:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    try:
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            intake.client_pseudo_id
        )
        if not client_record:
            raise HTTPException(
                status_code=404,
                detail=f"Client record not found for client ID: {intake.client_pseudo_id}",
            )

        client_response = ClientRecordResponse(**client_record.model_dump())

        if is_internal and login_timestamp:
            # Internal user: only messages from current login session
            login_time = datetime.fromtimestamp(login_timestamp)
            (
                current_section_messages,
                has_accepted_terms,
            ) = await intake.get_current_section_messages(
                session, current_session_time=login_time
            )
        else:
            # Non-internal user: all current section messages (existing behavior)
            (
                current_section_messages,
                has_accepted_terms,
            ) = await intake.get_current_section_messages(session)

        print(f"🔍 CLIENT API: Returning intake data for {intake.id}")
        print(f"   Number of client sections: {len(intake.client_intake_sections)}")

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
        else:
            # NEW PATH: Load from assessment config
            logger.info("Using sections from assessment config (new path)")
            assessment_config = await ConfigLoader.load_assessment_config(
                intake.assessment_config_id, session
            )
            if assessment_config.intake.intake_type != "conversation":
                raise HTTPException(
                    status_code=401,
                    detail="This intake is not a conversation type",
                )

            sections_data = (
                assessment_config.intake.sections
                if assessment_config.intake.sections
                else []
            )

            # Enrich sections with computed status
            sections_data = enrich_sections_with_status(
                sections_data, intake.current_section
            )

        return IntakeWithSectionsAndMessagesResponse(
            **intake.model_dump(by_alias=True, exclude_none=True),
            has_survey=intake.has_survey,
            has_address=intake.has_address,
            intake_sections=sections_data,
            current_section_messages=[],
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


class AddressSubmissionResponse(BaseModel):
    intake_completed: bool


@router.post(
    "/address",
    summary="Submit client address for intake",
    description="Submit or update address information for the authenticated client's intake",
    tags=["Intake assessment"],
    response_model=AddressSubmissionResponse,
)
async def submit_address(
    request: Request,
    address_data: AddressSubmission,
    session=Depends(get_session),
):
    from sqlalchemy.orm import selectinload
    from sqlmodel import select

    # Extract client_pseudo_id from JWT token (set by ClientAuthMiddleware)
    client_pseudo_id: str = request.state.client.get("sub")

    # Get intake with address relationship loaded
    statement = (
        select(Intake)
        .where(Intake.client_pseudo_id == client_pseudo_id)
        .options(selectinload(Intake.address))
    )
    result = await session.exec(statement)
    intake = result.first()

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

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

    # Check if intake can be completed (conversation finished + address provided + all sections complete)
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
    "/survey",
    summary="Submit client survey for intake",
    description="Submit survey information for the authenticated client's intake",
    tags=["Intake assessment"],
)
async def submit_survey(
    request: Request,
    survey_data: SurveySubmission,
    session=Depends(get_session),
):
    from sqlalchemy.orm import selectinload
    from sqlmodel import select

    # Extract client_pseudo_id from JWT token (set by ClientAuthMiddleware)
    client_pseudo_id: str = request.state.client.get("sub")

    # Get intake with survey relationship loaded
    statement = (
        select(Intake)
        .where(Intake.client_pseudo_id == client_pseudo_id)
        .options(selectinload(Intake.survey))
    )
    result = await session.exec(statement)
    intake = result.first()

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

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


# This endpoint allows scheduling an assessment and subsequent plan generation
# based on chat messages provided directly, To be used by external systems that handle intake conversations separately
# (e.g. the 2nd version of the intake chat).


class ChatMessageInput(BaseModel):
    role: str
    content: str
    section: Optional[str] = None


class CompleteExternalChatRequest(BaseModel):
    messages: List[ChatMessageInput]
    address: AddressSubmission


class CompleteExternalChatResponse(BaseModel):
    intake_id: str
    status: str
    message: str


@router.post(
    "/start-assessment-action-plan",
    summary="Trigger assessment + plan generation from external chat",
    description=("Schedules an assessment using provided chat messages. "),
    tags=["Intake assessment"],
    response_model=CompleteExternalChatResponse,
)
async def complete_external_chat(
    request: Request,
    data: CompleteExternalChatRequest,
    session=Depends(get_session),
):
    if not getattr(request.state, "client", None):
        from app.auth.intake.utils import decode_jwt_token

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        raw = auth_header.split(" ", 1)[1].strip()
        claims = decode_jwt_token(raw)
        request.state.client = {"sub": claims.get("sub")}

    client_pseudo_id: str = request.state.client.get("sub")
    if not client_pseudo_id:
        raise HTTPException(status_code=401, detail="Unauthorized: missing client id")

    # getting intake
    intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id)

    if not intake:
        intake = await create_intake(session, client_pseudo_id, IntakeType.EXTERNAL)

    if intake.intake_type != IntakeType.EXTERNAL.value:
        raise HTTPException(
            status_code=400,
            detail="Intake type must be EXTERNAL for this endpoint",
        )

    # save the intake messages to the database into the intake table
    external_chat_messages = [msg.model_dump() for msg in data.messages]
    intake.external_chat_messages = external_chat_messages

    new_address = ClientAddress(
        intake_id=intake.id,
        street_address=data.address.street_address,
        city=data.address.city,
        state=data.address.state,
    )
    session.add(new_address)
    session.add(intake)

    await intake.update_status(session, IntakeStatus.COMPLETED)
    await session.commit()
    await session.refresh(intake)

    return CompleteExternalChatResponse(
        intake_id=str(intake.id),
        status=str(intake.status),
        message="Action plan scheduled",
    )
