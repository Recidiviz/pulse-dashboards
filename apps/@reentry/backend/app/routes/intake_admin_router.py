import urllib
from typing import List, Optional, Union
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.auth_core import get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.intake import (
    create_intake,
    get_intake_by_client_pseudo_id,
    get_intake_by_id,
    get_intake_section_messages,
    get_or_create_token,
    update_internal_access_by_client_pseudo_id,
)
from app.models.base import IntakeType
from app.models.intake import Intake
from app.routes.shared_models import (
    ClientAddressResponse,
    IntakeMessageResponse,
    IntakeResponse,
)
from app.services.client_data.queries import Queries
from app.utils.assessment_config_utils import enrich_sections_with_status
from app.utils.config_loader import ConfigLoader
from app.utils.permission_utils import check_access

from .base import (
    IntakeSectionResponse,
    ORMResponse,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


class Message(ORMResponse):
    role: str
    agentId: Optional[str]
    content: str
    createdAt: Optional[str]


class SummaryResponse(ORMResponse):
    summary: str


class IntakeWithSectionsResponse(IntakeResponse):
    current_section: str | None = None
    intake_sections: List[IntakeSectionResponse] | None = None


class TokenAccessResponse(BaseModel):
    client_pseudo_id: str
    token: str


class InternalAccessUpdate(BaseModel):
    internal_access: bool


async def prepare_intake_response(
    intake: Intake,
    session: AsyncSession,
    pseudonymized_staff_id: str | None,
    token: Optional[str] = None,
) -> IntakeWithSectionsResponse | IntakeResponse:
    client_record = (
        Queries.get_client_data_by_pseudonymized_id(
            pseudonymized_client_id=intake.client_pseudo_id,
            pseudonymized_staff_id=pseudonymized_staff_id,
        )
        if pseudonymized_staff_id
        else None
    )
    if not client_record:
        raise HTTPException(
            status_code=404,
            detail=f"client record not found for client ID: {intake.client_pseudo_id}",
        )

    if intake.intake_type == IntakeType.CONVERSATION:
        conversation_config = await ConfigLoader.load_conversation_config(
            intake.assessment_config_id, session
        )
        if intake.client_intake_sections:
            formatted_sections = [
                IntakeSectionResponse(
                    **section.get_effective_section_data(),
                    status=section.completion_status,
                )
                for section in intake.client_intake_sections
            ]
        elif conversation_config.sections:
            sections_data = conversation_config.sections
            # Enrich sections with computed status
            formatted_sections = enrich_sections_with_status(
                sections_data, intake.current_section
            )
        else:
            formatted_sections = []

        return IntakeWithSectionsResponse(
            id=intake.id,
            intake_type=intake.intake_type,
            created_at=intake.created_at,
            updated_at=intake.updated_at,
            completed_at=intake.completed_at,
            client_pseudo_id=intake.client_pseudo_id,
            status=intake.status.value,
            current_section=intake.current_section,
            intake_sections=formatted_sections,
            token=token or "",
            internal_access=intake.internal_access,
            address=ClientAddressResponse(
                street_address=intake.address.street_address,
                city=intake.address.city,
                state=intake.address.state,
            )
            if intake.address
            else None,
        )
    else:
        return IntakeResponse(
            id=intake.id,
            created_at=intake.created_at,
            updated_at=intake.updated_at,
            intake_type=intake.intake_type,
            completed_at=intake.completed_at,
            client_pseudo_id=intake.client_pseudo_id,
            status=intake.status.value,
            token=token or "",
            address=ClientAddressResponse(
                street_address=intake.address.street_address,
                city=intake.address.city,
                state=intake.address.state,
            )
            if intake.address
            else None,
        )


@router.post(
    "/{client_pseudo_id}",
    summary="Start the intake process for a client",
    description="Creates or updates the intake record for the given client ID and returns complete intake data",
    tags=["Intake assessment"],
    response_model=Union[IntakeWithSectionsResponse, IntakeResponse],
)
async def start_intake_process(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    check_access(client_pseudo_id, pseudonymized_id)
    try:
        intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id)
        if not intake:
            intake = await create_intake(
                session, client_pseudo_id, IntakeType.CONVERSATION
            )
        if not intake:
            raise HTTPException(status_code=404, detail="Failed to retrieve intake")

        intake = await get_intake_by_id(session, intake.id)

        return await prepare_intake_response(
            intake=intake,
            session=session,
            token=None,  # No token generated here
            pseudonymized_staff_id=pseudonymized_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"{e}<>><<>")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{client_pseudo_id}",
    summary="Fetch intake converstaion",
    description="Returns the intake record, with conversation data if available",
    tags=["Intake assessment"],
    response_model=IntakeWithSectionsResponse,
)
async def get_client_intake(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    check_access(client_pseudo_id, pseudonymized_id)

    intake: Intake | None = await get_intake_by_client_pseudo_id(
        session, client_pseudo_id
    )

    if not intake:
        raise HTTPException(
            status_code=404,
            detail=f"Intake record not found for client ID: {client_pseudo_id}",
        )

    try:
        token = (
            intake.intake_token.token
            if intake.intake_token and not intake.internal_access
            else None
        )
        return await prepare_intake_response(
            intake=intake,
            session=session,
            token=token,
            pseudonymized_staff_id=pseudonymized_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the intake: {str(e)}",
        )


@router.get(
    "/{intake_id}/{section_title}/messages",
    summary="Fetch intake messages for the given section",
    description="Returns the intake messages for the given section",
    tags=["Intake assessment"],
    response_model=List[IntakeMessageResponse],
)
async def get_intake_section_messages_route(
    intake_id: UUID,
    section_title: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    intake: Intake | None = await get_intake_by_id(session, intake_id)
    client_pseudo_id = intake.client_pseudo_id if intake else "not_a_client"
    check_access(client_pseudo_id, pseudonymized_id)

    try:
        decoded_section_title = urllib.parse.unquote(section_title)
        messages = await get_intake_section_messages(
            session, intake_id, decoded_section_title
        )

        if not messages:
            logger.error(
                f"No messages found for intake ID: {intake_id} in section '{decoded_section_title}'"
            )
            raise HTTPException(
                status_code=404,
                detail=f"No messages found for intake ID: {intake_id} in section '{decoded_section_title}'",
            )

        return messages

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the intake: {str(e)}",
        )


@router.patch(
    "/{client_pseudo_id}/internal-access",
    summary="Update internal access field",
    description="Sets internal_access (true/false) for the intake",
    tags=["Intake assessment"],
    response_model=str,
)
async def set_internal_access(
    client_pseudo_id: str,
    body: InternalAccessUpdate,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    check_access(client_pseudo_id, pseudonymized_id)

    intake = await update_internal_access_by_client_pseudo_id(
        session=session,
        client_pseudo_id=client_pseudo_id,
        internal_access=body.internal_access,
    )

    if not intake:
        raise HTTPException(
            status_code=404,
            detail=f"Intake record not found for client ID: {client_pseudo_id}",
        )

    return "success"


@router.post(
    "/{client_pseudo_id}/token_access",
    summary="Generate a client access token",
    description="Generates a new access token for a client's intake",
    tags=["Intake assessment"],
    response_model=TokenAccessResponse,
)
async def generate_client_token(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    check_access(client_pseudo_id, pseudonymized_id)
    try:
        intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id)

        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")

        # Generate a new token
        token_entry, raw_token = await get_or_create_token(session, intake.id)

        return TokenAccessResponse(
            client_pseudo_id=client_pseudo_id,
            token=raw_token,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating token: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
