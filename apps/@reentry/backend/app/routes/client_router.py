from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi_pagination import Page
from pydantic import BaseModel

from app.auth.auth_core import get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.assessment import get_assessments_by_client_pseudo_id
from app.crud.client import (
    get_client_status_updates,
    get_paginated_client_list,
    get_processing_status,
)
from app.crud.intake import get_intake_by_client_pseudo_id
from app.crud.plan import create_plan, get_plan_by_client_pseudo_id, retry_plan_creation
from app.models.models import Plan
from app.routes.execution_router import ExecutionResponse
from app.routes.shared_models import (
    ClientRecordResponse,
    ClientResponse,
    ProcessingStatus,
)
from app.services.client_data.queries import Queries
from app.utils.permission_utils import check_access

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


@router.post(
    "/{client_pseudo_id}/retry-processing",
    response_model=ExecutionResponse,
    summary="Retry Processing",
    description="Intelligently retry processing for a client based on current state. Determines whether to retry assessments, plan generation, or both.",
    tags=["Client Processing"],
)
async def retry_processing(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    check_access(client_pseudo_id, pseudonymized_id)

    # Get intake for the client
    intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id)
    if not intake or intake.status != "completed":
        raise HTTPException(status_code=400, detail="No retryable operations found")

    # Get current assessments and plan
    assessments = await get_assessments_by_client_pseudo_id(session, client_pseudo_id)

    # Check if we should retry assessments
    need_assessment_retry = not assessments or all(
        a.status == "failed" for a in assessments
    )

    if need_assessment_retry:
        # Use intake.schedule_assessment to restart assessment
        execution = await intake.schedule_assessment(session)
        await session.commit()
        await session.refresh(intake)
        return execution

    plan = await get_plan_by_client_pseudo_id(session, client_pseudo_id)

    no_in_progress_assessments = not assessments or not any(
        a.status in ["pending", "in_progress"] for a in assessments
    )
    plan_failed_create = plan and plan.create_status == "failed"
    no_plan = not plan
    need_initial_plan_retry = no_in_progress_assessments and (
        no_plan or plan_failed_create
    )

    # Only handle plan generation if we're not creating new assessments
    # (because plan generation will be automatically triggered when assessments complete)
    if need_initial_plan_retry:
        if not plan:
            # Create new plan (only if we have completed assessments and no plan)
            plan_obj = Plan(client_pseudo_id=client_pseudo_id)
            plan = await create_plan(session, plan_obj)
            execution = await plan.schedule_initial_creation(session)
            await session.commit()
            await session.refresh(plan)
            return execution
        elif not plan.create_execution:
            execution = await plan.schedule_initial_creation(session)
            await session.commit()
            await session.refresh(plan)
            return execution
        else:
            # Retry failed plan creation
            execution = await retry_plan_creation(session, plan)
            await session.commit()
            await session.refresh(plan)
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
