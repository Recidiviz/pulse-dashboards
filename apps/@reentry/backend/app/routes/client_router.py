import structlog
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi_pagination import Page
from pydantic import BaseModel
from sqlalchemy.exc import DBAPIError
from sqlmodel import select

from app.auth.auth_core import get_pseudonymized_id
from app.core.config import settings
from app.core.db import AsyncSession, get_session
from app.crud.assessment import get_assessments_by_client_pseudo_id
from app.crud.client import (
    compute_frontend_status,
    compute_processing_status_by_intake_id,
    get_client_status_updates,
    get_paginated_client_list,
    get_processing_status,
)
from app.crud.client import (
    reset_client_data as crud_reset_client_data,
)
from app.crud.intake import get_intake_by_id
from app.crud.plan import create_plan, get_plan_by_client_pseudo_id, retry_plan_creation
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import Intake
from app.models.models import Plan
from app.models.recording import RecordingSession
from app.routes.execution_router import ExecutionResponse
from app.routes.shared_models import (
    ClientRecordResponse,
    ClientResponse,
    ProcessingStatus,
)
from app.services.client_data.exceptions import (
    ClientAlreadyExistsError,
    ClientNotFoundError,
)
from app.services.client_data.queries import Queries
from app.utils.feature_flags import is_feature_enabled
from app.utils.permission_utils import check_access

logger = structlog.get_logger(__name__)
router = APIRouter()


class RetryProcessingResponse(BaseModel):
    execution: ExecutionResponse


class ClientStatusUpdate(BaseModel):
    client_pseudo_id: str
    processing_status: ProcessingStatus


class ClientStatusResponse(BaseModel):
    in_progress: list[ClientStatusUpdate]


class ProcessingStatusRequest(BaseModel):
    staff_pseudo_id: str


class ProcessingStatusResponse(BaseModel):
    processing_status: str
    frontend_status: str


# Client list
@router.get(
    "/",
    response_model=Page[ClientResponse],
    summary="List Clients",
    description="Retrieve a paginated list of clients. If a user is authenticated, only show clients assigned to them.",
)
async def router_list_clients(
    session: AsyncSession = Depends(get_session),
    page: int = 1,
    size: int = 20,
    sort_by: str | None = None,  # "name" or "status"
    sort_order: str = "asc",  # "asc" or "desc"
    search: str | None = None,  # Search by client name
    status_filter: str | None = None,  # Filter by status
    is_zero_caseload_user: bool = False,
    cpa_client_locations: list[str] | None = Query(default=[]),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # Get paginated list of clients, filtered by staff ID if available
    return await get_paginated_client_list(
        session,
        page,
        size,
        pseudonymized_id,
        sort_by,
        sort_order,
        search,
        status_filter,
        is_zero_caseload_user,
        cpa_client_locations,
    )


@router.get(
    "/status",
    response_model=ClientStatusResponse,
    summary="Get Client Status Updates",
    description="Retrieve status updates for clients that are currently in progress processing. Returns only clients with in_progress status to minimize database load.",
)
async def get_client_status_updates_route(
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # Get status updates for in-progress clients
    return await get_client_status_updates(session, pseudonymized_id)


@router.get(
    "/{intake_id}/intake-general-resources-status",
    response_model=ProcessingStatusResponse,
    summary="Get Intake General Resources Processing Status",
    description="Retrieve the processing status for a specific intake by its ID.",
)
async def get_intake_status_for_client(
    intake_id: str,
    session: AsyncSession = Depends(get_session),
):
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    intake_processing_status = await compute_processing_status_by_intake_id(
        session, intake_id
    )
    frontend_status = compute_frontend_status(intake.status, intake_processing_status)
    return ProcessingStatusResponse(
        processing_status=intake_processing_status, frontend_status=frontend_status
    )


@router.get(
    "/{client_pseudo_id}",
    response_model=ClientRecordResponse,
    summary="Get Client Record",
    description="Retrieve an Client record by its pseudonimyzed id (client_pseudo_id)",
    tags=["Client Records"],
)
async def get_client_record(
    client_pseudo_id: str,
    request: Request,
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # Get client data with staff verification
    record = Queries.get_client_data_by_pseudonymized_id(
        pseudonymized_client_id=client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Client Record not found")
    return record


async def acquire_intake_lock(session: AsyncSession, client_pseudo_id: str):
    try:
        stmt = (
            select(Intake)
            .where(Intake.client_pseudo_id == client_pseudo_id)
            .with_for_update(nowait=True)
        )
        result = await session.execute(stmt)
        intake = result.scalar_one_or_none()
        return intake
    except DBAPIError as e:
        # Handle LockNotAvailableError - another retry operation is in progress
        if "LockNotAvailableError" in str(e) or "could not obtain lock" in str(e):
            raise HTTPException(
                status_code=409,
                detail="A retry operation is already in progress for this client",
            )
        raise


@router.post(
    "/{client_pseudo_id}/retry-processing",
    response_model=ExecutionResponse,
    summary="Retry Processing",
    description="Intelligently retry processing for a client based on current state. Determines whether to retry assessments, plan generation, or both. Handles failed and stuck executions.",
    tags=["Client Processing"],
)
async def retry_processing(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    from app.crud.client import is_execution_stuck
    from app.crud.execution import delete_execution_by_id

    check_access(client_pseudo_id, pseudonymized_id)

    # Acquire row-level lock on intake to prevent race conditions
    # This ensures only one concurrent retry operation proceeds at a time per client
    intake = await acquire_intake_lock(session, client_pseudo_id)

    if not intake:
        raise HTTPException(status_code=400, detail="No retryable operations found")

    # Check for failed or stuck recording/transcription
    # Also lock the recording session if it exists to prevent race conditions
    recording = None
    if intake.recording_session:
        intake = await acquire_intake_lock(session, client_pseudo_id)
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
                    detail="A retry operation is already in progress for this client",
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
                    f"Retrying execution for client {client_pseudo_id}, "
                    f"deleted execution {execution_id} (type=recording_session, reason={retry_reason})"
                )
                recording.execution = None
                recording.execution_id = None
                session.add(recording)
                await delete_execution_by_id(session, execution_id)
            else:
                logger.info(
                    f"Retrying execution for client {client_pseudo_id}, "
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
        raise HTTPException(status_code=400, detail="No retryable operations found")

    try:
        from app.models.assessment import Assessment

        stmt = (
            select(Assessment)
            .where(Assessment.client_pseudo_id == client_pseudo_id)
            .with_for_update(nowait=True)
        )
        await session.execute(stmt)
    except DBAPIError as e:
        if "could not obtain lock" in str(e) or "LockNotAvailableError" in str(e):
            raise HTTPException(
                status_code=409,
                detail=f"A retry operation is already in progress for client {client_pseudo_id}",
            )
        raise

    # Get current assessments and plan
    assessments = await get_assessments_by_client_pseudo_id(session, client_pseudo_id)

    # Check for failed or stuck assessments that need to be retried
    if assessments:
        for assessment in assessments:
            # Check if assessment failed or is stuck
            if assessment.status == "failed":
                retry_reason = f"failed (status={assessment.status})"
                execution_id = assessment.execution_id
                logger.info(
                    f"Retrying execution for client {client_pseudo_id}, "
                    f"deleted execution {execution_id} (type=assessment, reason={retry_reason})"
                )

                # Delete the failed/stuck assessment first (due to foreign key constraint)
                await session.delete(assessment)

                # Then delete the execution
                if execution_id:
                    await delete_execution_by_id(session, execution_id)

                # Schedule new assessment
                execution = await intake.schedule_assessment(session)

                # Single commit at the end
                await session.commit()
                await session.refresh(intake)
                return execution
            elif assessment.execution and is_execution_stuck(assessment.execution):
                execution_id = assessment.execution_id
                retry_reason = f"stuck (status={assessment.execution.status}, updated_at={assessment.execution.updated_at})"
                logger.info(
                    f"Retrying execution for client {client_pseudo_id}, "
                    f"deleted execution {execution_id} (type=assessment, reason={retry_reason})"
                )

                # Delete the failed/stuck assessment first (due to foreign key constraint)
                await session.delete(assessment)

                # Then delete the execution
                if execution_id:
                    await delete_execution_by_id(session, execution_id)

                # Schedule new assessment
                execution = await intake.schedule_assessment(session)

                # Single commit at the end
                await session.commit()
                await session.refresh(intake)
                return execution

    # Check if we should retry assessments (no assessments exist)
    if not assessments:
        logger.info(
            f"Retrying execution for client {client_pseudo_id}, "
            f"no execution to delete (type=assessment, reason=missing assessment)"
        )
        # Use intake.schedule_assessment to start assessment
        execution = await intake.schedule_assessment(session)

        # Single commit at the end
        await session.commit()
        await session.refresh(intake)
        return execution

    if any(a.status in ["pending", "in_progress"] for a in assessments):
        raise HTTPException(status_code=400, detail="No retryable operations found")

    plan = await get_plan_by_client_pseudo_id(session, client_pseudo_id)

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
                f"Retrying execution for client {client_pseudo_id}, "
                f"no execution to delete (type=plan, reason=missing plan)"
            )
            # Create new plan (only if we have completed assessments and no plan)
            plan_obj = Plan(client_pseudo_id=client_pseudo_id)
            plan = await create_plan(session, plan_obj)
            execution = await plan.schedule_initial_creation(session)

            # Single commit at the end
            await session.commit()
            await session.refresh(plan)
            return execution
        elif not plan.create_execution:
            logger.info(
                f"Retrying execution for client {client_pseudo_id}, "
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
                f"Retrying execution for client {client_pseudo_id}, "
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
                        f"Retrying execution for client {client_pseudo_id}, "
                        f"deleted execution {execution_id} (type=plan_generation, reason={retry_reason})"
                    )

                    # Copy parameters from stuck/failed generation for retry
                    prompt = latest_gen.prompt
                    resource_to_add_content = latest_gen.resource_to_add_content
                    print(latest_gen)
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


@router.post(
    "/processing-status",
    response_model=dict[str, ProcessingStatus],
    summary="Get Intake Processing Status",
    description="Retrieve intake processing status for all clients belonging to the provided staff pseudonymized id.",
    tags=["Client Intake Processing Status"],
)
async def get_processing_status_route(
    request: ProcessingStatusRequest,
    session: AsyncSession = Depends(get_session),
):
    return await get_processing_status(session, request.staff_pseudo_id)


class ClientResetResponse(BaseModel):
    client_pseudo_id: str
    total_deleted: int


@router.delete(
    "/{client_pseudo_id}/reset",
    response_model=ClientResetResponse,
    summary="Reset Client Data",
    description="Deletes all intake data for a client.",
)
async def reset_client_data(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    if not is_feature_enabled("INTAKE_RESET"):
        raise HTTPException(
            status_code=403,
            detail=f"Reset feature is not enabled in this environment. Current Env: {settings.ENV_NAME.lower()}",
        )

    check_access(client_pseudo_id, pseudonymized_id)

    client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)
    if not client_record:
        raise HTTPException(
            status_code=404,
            detail=f"Client with pseudo_id {client_pseudo_id} not found",
        )

    logger.info(
        f"Resetting intake data for client {client_pseudo_id} by staff {pseudonymized_id}"
    )

    try:
        total_deleted = await crud_reset_client_data(session, client_pseudo_id)
        await session.commit()
        logger.info(
            f"Successfully deleted {total_deleted} records for client {client_pseudo_id}"
        )

        return ClientResetResponse(
            client_pseudo_id=client_pseudo_id, total_deleted=total_deleted
        )

    except Exception as e:
        await session.rollback()
        logger.exception(f"Error resetting client {client_pseudo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset client data.")


class AddClientRequest(BaseModel):
    given_names: str
    surname: str
    birthdate: date
    state_code: str
    middle_names: str | None = None
    name_suffix: str | None = None


class AddClientResponse(BaseModel):
    external_client_id: str
    pseudonymized_client_id: str
    message: str


class RemoveClientRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date


class RemoveClientResponse(BaseModel):
    message: str
    pseudonymized_client_id: str


@router.post(
    "/admin/add",
    response_model=AddClientResponse,
    summary="Add Client to BigQuery",
    description="Admin endpoint to add a new client directly to BigQuery.",
    tags=["Client Admin"],
)
async def add_client_route(
    request: AddClientRequest,
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    if not is_feature_enabled("CLIENT_ADDITION"):
        raise HTTPException(
            status_code=403,
            detail=f"Client addition feature is not enabled in this environment. Current Env: {settings.ENV_NAME.lower()}",
        )

    logger.info(
        f"Adding new client '{request.given_names} {request.surname}' by staff {pseudonymized_id}"
    )

    try:
        result = Queries.add_client(
            given_names=request.given_names,
            surname=request.surname,
            birthdate=request.birthdate,
            state_code=request.state_code,
            staff_pseudonymized_id=pseudonymized_id,
            middle_names=request.middle_names,
            name_suffix=request.name_suffix,
        )

        logger.info(
            f"Successfully added client {result.external_client_id} (pseudonymized: {result.pseudonymized_client_id})"
        )

        return AddClientResponse(
            external_client_id=result.external_client_id,
            pseudonymized_client_id=result.pseudonymized_client_id,
            message="Client added successfully",
        )

    except ClientAlreadyExistsError as e:
        logger.warning(f"Client already exists: {str(e)}")
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.exception(f"Error adding client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add client.")


@router.delete(
    "/admin/remove",
    response_model=RemoveClientResponse,
    summary="Remove Client from BigQuery",
    description="Admin endpoint to remove a client from BigQuery by name and date of birth.",
    tags=["Client Admin"],
)
async def remove_client_route(
    request: RemoveClientRequest,
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    if not is_feature_enabled("CLIENT_DELETION"):
        raise HTTPException(
            status_code=403,
            detail=f"Client deletion feature is not enabled in this environment. Current Env: {settings.ENV_NAME.lower()}",
        )

    logger.info(
        f"Removing client '{request.first_name} {request.last_name}' with DOB {request.date_of_birth} by staff {pseudonymized_id}"
    )

    try:
        pseudonymized_client_id = Queries.get_pseudonymized_id_by_names_and_dob(
            first_name=request.first_name,
            last_name=request.last_name,
            date_of_birth=request.date_of_birth,
        )

        if not pseudonymized_client_id:
            raise HTTPException(
                status_code=404,
                detail=f"Client '{request.first_name} {request.last_name}' with DOB {request.date_of_birth} not found",
            )

        Queries.remove_client(pseudonymized_client_id, pseudonymized_id)

        logger.info(
            f"Successfully removed client '{request.first_name} {request.last_name}' (pseudonymized: {pseudonymized_client_id})"
        )

        return RemoveClientResponse(
            message="Client removed successfully",
            pseudonymized_client_id=pseudonymized_client_id,
        )

    except ClientNotFoundError as e:
        logger.warning(f"Client not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception(f"Error removing client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove client.")
