import urllib
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import DBAPIError
from sqlmodel import select

from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.address import get_collected_address_for_intake
from app.crud.assessment_config import get_assessment_config_by_id
from app.crud.client import compute_frontend_status
from app.crud.execution import delete_execution_by_id
from app.crud.intake import (
    create_intake,
    get_active_intake_by_client_pseudo_id,
    get_intake_by_id,
    get_intake_section_messages,
    get_or_create_token,
    update_internal_access_by_intake_id,
)
from app.crud.plan import create_plan, get_plan_by_intake_id, retry_plan_creation
from app.models.base import IntakeStatus, IntakeType
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import ClientAddress, Intake
from app.models.models import Plan
from app.models.recording import RecordingSession
from app.routes.execution_router import ExecutionResponse
from app.routes.shared_models import (
    AddressSubmission,
    ClientAddressResponse,
    IntakeMessageResponse,
    IntakeResponse,
    ProcessingStatusResponse,
)
from app.utils.assessment_config_utils import enrich_sections_with_status
from app.utils.config_loader import ConfigLoader
from app.utils.execution_utils import is_execution_stuck
from app.utils.lock_utils import acquire_intake_lock
from app.utils.permission_utils import check_access
from app.utils.processing_status_utils import compute_processing_status_by_intake_id

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


class IntakeWithSectionsResponse(IntakeResponse):
    current_section: str | None = None
    intake_sections: List[IntakeSectionResponse] | None = None


class TokenAccessResponse(BaseModel):
    client_pseudo_id: str
    token: str


class InternalAccessUpdate(BaseModel):
    internal_access: bool


class CreateIntakeRequest(BaseModel):
    client_pseudo_id: str
    assessment_config_id: UUID


class CreateIntakeResponse(BaseModel):
    id: UUID
    status: str
    assessment_config_code: str


async def prepare_intake_response(
    intake: Intake,
    session: AsyncSession,
    pseudonymized_staff_id: str | None,
    token: Optional[str] = None,
) -> IntakeWithSectionsResponse | IntakeResponse:
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
        )


@router.get(
    "/{intake_id}/processing-status",
    response_model=ProcessingStatusResponse,
    summary="Get Intake General Resources Processing Status",
    description="Retrieve the processing status for a specific intake by its ID.",
    tags=["Intake assessment - Admin"],
)
async def get_processing_status_for_intake(
    intake_id: str,
    session: AsyncSession = Depends(get_session),
):
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    intake_processing_status = await compute_processing_status_by_intake_id(
        session, intake_id
    )
    frontend_status = compute_frontend_status(intake.status, intake_processing_status)
    return ProcessingStatusResponse(
        processing_status=intake_processing_status, frontend_status=frontend_status
    )


@router.get(
    "/{intake_id}/address",
    response_model=ClientAddressResponse,
    summary="Get Intake Address",
    description="Retrieve the address collected during a specific intake.",
    tags=["Intake assessment - Admin"],
)
async def get_intake_address(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    """
    Get the address associated with an intake.

    Returns the client's address if it was collected during the intake,
    otherwise returns 404.
    """
    # First verify the intake exists and check access
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )

    # Get the address for this intake
    address = await get_collected_address_for_intake(session, intake_id)

    if not address:
        raise HTTPException(status_code=404, detail="No address found for this intake")

    return ClientAddressResponse(
        street_address=address.street_address,
        city=address.city,
        state=address.state,
    )


@router.post(
    "",
    summary="Create a new intake",
    description="Creates a new intake record for a client with specified assessment config",
    tags=["Intake assessment - Admin"],
    response_model=CreateIntakeResponse,
    status_code=201,
)
async def create_new_intake(
    request: CreateIntakeRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    """
    Create a new intake for a client.

    Validations:
    - Checks if client has an existing CREATED or IN_PROGRESS intake (returns 409 Conflict if yes)
    - Verifies assessment_config_id exists and is active
    - Verifies assessment_config matches client's state
    """
    structlog.contextvars.bind_contextvars(client_pseudo_id=request.client_pseudo_id)
    try:
        client_record = check_access(
            request.client_pseudo_id,
            pseudonymized_id,
            auth_user_context["cpa_client_locations"],
        )

        # 1. Check if client has an existing IN_PROGRESS or CREATED intake
        existing_intake = await get_active_intake_by_client_pseudo_id(
            session, request.client_pseudo_id
        )

        if existing_intake:
            raise HTTPException(
                status_code=409,
                detail=f"Client already has an active {existing_intake.status.value} intake (ID: {existing_intake.id})",
            )

        # 2. Verify assessment_config_id exists
        assessment_config = await get_assessment_config_by_id(
            session, request.assessment_config_id
        )

        if not assessment_config:
            raise HTTPException(
                status_code=404,
                detail=f"Assessment config with ID {request.assessment_config_id} not found",
            )

        if not assessment_config.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Assessment config {assessment_config.code} is not active",
            )

        # 3. Verify client's state matches config's state
        if client_record.state_code != assessment_config.state_code:
            raise HTTPException(
                status_code=400,
                detail=f"Assessment config state ({assessment_config.state_code}) does not match client state ({client_record.state_code})",
            )

        # 4. Load the full config to get intake_type
        full_config = await ConfigLoader.load_assessment_config(
            request.assessment_config_id, session
        )

        if not full_config:
            raise HTTPException(
                status_code=500,
                detail="Failed to load assessment configuration",
            )

        # 5. Create the intake
        intake = await create_intake(
            session=session,
            client_pseudo_id=request.client_pseudo_id,
            assessment_config_id=request.assessment_config_id,
            status=IntakeStatus.CREATED,
        )

        return CreateIntakeResponse(
            id=intake.id,
            status=intake.status.value,
            assessment_config_code=assessment_config.code,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating intake: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/{intake_id}",
    summary="Delete an intake",
    description="Deletes an intake record by its ID",
    tags=["Intake assessment - Admin"],
)
async def delete_new_intake(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    """
    Delete an intake by its ID.
    """
    intake = await get_intake_by_id(session, intake_id)

    if not intake:
        raise HTTPException(
            status_code=404,
            detail=f"Intake record not found for intake ID: {intake_id}",
        )

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )

    if intake.status != IntakeStatus.CREATED:
        raise HTTPException(
            status_code=400,
            detail="Only intakes with status 'CREATED' can be deleted",
        )

    try:
        await session.delete(intake)
        await session.commit()
        return {"detail": "Intake deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting intake: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{intake_id}",
    summary="Fetch intake conversation",
    description="Returns the intake record, with conversation data if available",
    tags=["Intake assessment - Admin"],
    response_model=IntakeWithSectionsResponse,
)
async def get_client_intake(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    intake: Intake | None = await get_intake_by_id(session, intake_id)

    if not intake:
        raise HTTPException(
            status_code=404,
            detail=f"Intake record not found for intake ID: {intake_id}",
        )

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
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
    "/{intake_id}/{section_title:path}/messages",
    summary="Fetch intake messages for the given section",
    description="Returns the intake messages for the given section",
    tags=["Intake assessment - Admin"],
    response_model=List[IntakeMessageResponse],
)
async def get_intake_section_messages_route(
    intake_id: UUID,
    section_title: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    intake: Intake | None = await get_intake_by_id(session, intake_id)
    client_pseudo_id = intake.client_pseudo_id if intake else "not_a_client"

    if intake and intake.client_pseudo_id:
        structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    else:
        logger.error(
            f"Couldn't find client_pseudo_id from the intake. intake_id: {intake_id}"
        )

    check_access(
        client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )

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
    "/{intake_id}/internal-access",
    summary="Update internal access field",
    description="Sets internal_access (true/false) for a specific intake",
    tags=["Intake assessment - Admin"],
    response_model=str,
)
async def set_internal_access(
    intake_id: UUID,
    body: InternalAccessUpdate,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    intake = await get_intake_by_id(session, intake_id)

    if not intake:
        raise HTTPException(
            status_code=404,
            detail=f"Intake with ID {intake_id} not found",
        )

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )

    intake = await update_internal_access_by_intake_id(
        session=session,
        intake_id=intake_id,
        internal_access=body.internal_access,
    )

    return "success"


@router.post(
    "/{intake_id}/token-access",
    summary="Generate a client access token",
    description="Generates a new access token for a client's intake",
    tags=["Intake assessment - Admin"],
    response_model=TokenAccessResponse,
)
async def generate_client_token(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    try:
        intake = await get_intake_by_id(session, intake_id)

        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")

        structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
        check_access(
            intake.client_pseudo_id,
            pseudonymized_id,
            auth_user_context["cpa_client_locations"],
        )

        # Generate a new token
        token_entry, raw_token = await get_or_create_token(session, intake.id)

        return TokenAccessResponse(
            client_pseudo_id=intake.client_pseudo_id,
            token=raw_token,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating token: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/{intake_id}/address",
    summary="Submit client address for intake",
    description="Submit or update address information for the authenticated client's intake",
    tags=["Intake assessment - Admin"],
    response_model=ClientAddressResponse,
)
async def submit_address(
    intake_id: UUID,
    address_data: AddressSubmission,
    session=Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    intake = await get_intake_by_id(session, intake_id)

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )
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
        session.commit()
        session.refresh(intake)
    return intake.address


@router.post(
    "/{intake_id}/retry-processing",
    response_model=ExecutionResponse,
    summary="Retry Processing for Intake",
    description="Intelligently retry processing for an intake based on current state. Determines whether to retry assessments, plan generation, or both. Handles failed and stuck executions.",
    tags=["Intake Processing - Admin"],
)
async def retry_intake_processing(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    """
    Retry processing for a specific intake.

    This endpoint:
    1. Checks for failed or stuck recording/transcription
    2. Retries failed or stuck plan creation
    3. Retries failed or stuck plan generations

    Returns the execution object for the operation that was retried.
    """
    # Get and lock the intake
    intake = await acquire_intake_lock(session, intake_id)

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    # Verify access
    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        auth_user_context["cpa_client_locations"],
    )

    # Check for failed or stuck recording/transcription
    recording = None
    if intake.recording_session:
        try:
            stmt = (
                select(RecordingSession)
                .where(RecordingSession.intake_id == intake.id)
                .with_for_update(nowait=True)
            )
            result = await session.execute(stmt)
            recording = result.scalar_one_or_none()
        except DBAPIError as e:
            if "LockNotAvailableError" in str(e) or "could not obtain lock" in str(e):
                raise HTTPException(
                    status_code=409,
                    detail="A retry operation is already in progress for this intake",
                )
            raise

    if recording:
        should_retry_recording = False
        retry_reason = None

        # Check if recording execution is stuck or failed
        if recording.execution:
            if recording.execution.status == "failed":
                should_retry_recording = True
                retry_reason = f"failed (status={recording.execution.status})"
            elif is_execution_stuck(recording.execution):
                should_retry_recording = True
                retry_reason = f"stuck (status={recording.execution.status}, updated_at={recording.execution.updated_at})"

        # Check if recording status is error
        if recording.status == "error":
            should_retry_recording = True
            if not retry_reason:
                retry_reason = "recording status=error"

        if should_retry_recording:
            # Delete the failed/stuck recording execution first
            execution_id = recording.execution_id
            if execution_id:
                logger.info(
                    f"Retrying execution for intake {intake_id}, "
                    f"deleted execution {execution_id} (type=recording_session, reason={retry_reason})"
                )
                recording.execution = None
                recording.execution_id = None
                session.add(recording)
                await delete_execution_by_id(session, execution_id)
            else:
                logger.info(
                    f"Retrying execution for intake {intake_id}, "
                    f"no execution to delete (type=recording_session, reason={retry_reason})"
                )

            # Schedule new recording processing
            from app.tasks.recording import process_recording_task

            new_execution = Execution(
                status="pending",
                table_name="recording_session",
                table_entity_id=recording.id,
            )
            session.add(new_execution)
            await session.flush()  # Get the ID without committing

            # Dispatch task
            task = await process_recording_task.kiq(
                execution_id=new_execution.id,
                recording_session_id=recording.id,
            )
            new_execution.task_id = str(task.task_id)
            recording.execution_id = new_execution.id
            recording.status = "processing"
            session.add(new_execution)
            session.add(recording)

            # Single commit at the end
            await session.commit()
            await session.refresh(new_execution)

            return new_execution

        if recording.execution and recording.execution.status in [
            ExecutionStatus.PENDING,
            ExecutionStatus.IN_PROGRESS,
        ]:
            raise HTTPException(status_code=400, detail="No retryable operations found")

    if not intake or intake.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Intake must be completed before retrying processing",
        )

    plan = await get_plan_by_intake_id(session, intake.id)

    # Check for stuck or failed plan
    if (
        not plan
        or not plan.create_execution
        or plan.create_status == "failed"
        or plan.create_execution.status == "failed"
        or is_execution_stuck(plan.create_execution)
    ):
        if not plan:
            logger.info(
                f"Retrying execution for intake {intake_id}, "
                f"no execution to delete (type=plan, reason=missing plan)"
            )
            # Create new plan
            plan_obj = Plan(
                client_pseudo_id=intake.client_pseudo_id, intake_id=intake.id
            )
            plan = await create_plan(session, plan_obj)
            execution = await plan.schedule_initial_creation(session)

            # Single commit at the end
            await session.commit()
            await session.refresh(plan)
            return execution
        elif not plan.create_execution:
            logger.info(
                f"Retrying execution for intake {intake_id}, "
                f"no execution to delete (type=plan, reason=missing execution)"
            )
            execution = await plan.schedule_initial_creation(session)

            # Single commit at the end
            await session.commit()
            await session.refresh(plan)
            return execution
        else:
            # Retry failed/stuck plan creation
            execution_id = plan.create_execution_id
            if (
                plan.create_status == "failed"
                or plan.create_execution.status == "failed"
            ):
                retry_reason = f"failed (status={plan.create_execution.status})"
            else:
                retry_reason = f"stuck (status={plan.create_execution.status}, updated_at={plan.create_execution.updated_at})"

            logger.info(
                f"Retrying execution for intake {intake_id}, "
                f"deleted execution {execution_id} (type=plan, reason={retry_reason})"
            )
            execution = await retry_plan_creation(session, plan)

            # Single commit at the end
            await session.commit()
            await session.refresh(plan)
            return execution

    # Check for stuck or failed plan generations
    if plan and plan.create_status == "completed":
        from app.crud.plan_generation import get_gen_by_plan_id_with_executions
        from app.models.models import PlanGeneration

        generations = await get_gen_by_plan_id_with_executions(session, plan.id)
        if generations:
            # Get the latest generation by created_at
            sorted_gens = sorted(
                generations,
                key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True,
            )
            latest_gen = sorted_gens[0] if sorted_gens else None

            if latest_gen and latest_gen.execution:
                if latest_gen.execution.status == "failed" or is_execution_stuck(
                    latest_gen.execution
                ):
                    execution_id = latest_gen.execution_id
                    if latest_gen.execution.status == "failed":
                        retry_reason = f"failed (status={latest_gen.execution.status})"
                    else:
                        retry_reason = f"stuck (status={latest_gen.execution.status}, updated_at={latest_gen.execution.updated_at})"

                    logger.info(
                        f"Retrying execution for intake {intake_id}, "
                        f"deleted execution {execution_id} (type=plan_generation, reason={retry_reason})"
                    )

                    # Copy parameters from stuck/failed generation for retry
                    prompt = latest_gen.prompt
                    resource_to_add_content = latest_gen.resource_to_add_content
                    resource_to_remove_id = latest_gen.resource_to_remove_id

                    # Create new generation with same parameters (keep old one for audit trail)
                    new_gen = PlanGeneration(
                        plan_id=plan.id,
                        prompt=prompt,
                        resource_to_add_content=resource_to_add_content,
                        resource_to_remove_id=resource_to_remove_id,
                        force_generation=latest_gen.force_generation,
                    )
                    session.add(new_gen)
                    await session.flush()  # Get the ID without committing

                    # Schedule the new generation
                    execution = await new_gen.schedule_execution(session)

                    # Single commit at the end
                    await session.commit()
                    return execution

    # Fallback: no current executions found
    raise HTTPException(status_code=400, detail="No retryable operations found")
