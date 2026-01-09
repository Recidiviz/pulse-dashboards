import structlog
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi_pagination import Page
from pydantic import BaseModel

from app.auth.auth_core import get_pseudonymized_id
from app.core.config import settings
from app.core.db import AsyncSession, get_session
from app.crud.address import get_latest_address_client_pseudo_id
from app.crud.client import ClientSort, get_paginated_client_list
from app.crud.client import reset_client_data as crud_reset_client_data
from app.crud.intake import (
    get_all_intakes_by_client_pseudo_id,
)
from app.routes.execution_router import ExecutionResponse
from app.routes.shared_models import (
    ClientAddressResponse,
    ClientRecordResponse,
    ClientResponse,
    IntakeHistoryResponse,
    ProcessingStatus,
)
from app.services.client_data.exceptions import (
    ClientAlreadyExistsError,
    ClientNotFoundError,
)
from app.services.client_data.queries import Queries
from app.utils.config_loader import ConfigLoader
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


# TODO SORT
# TODO STATUS FILTER
# Client list
@router.get(
    "/",
    response_model=Page[ClientResponse],
    summary="List Clients",
    description="Retrieve a paginated list of clients. If a user is authenticated, only show clients assigned to them.",
    tags=["Client Records"],
)
async def router_list_clients(
    session: AsyncSession = Depends(get_session),
    page: int = 1,
    size: int = 20,
    sort_by: None | ClientSort = None,
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


# TODO STATUS FILTER maybe update - in any case test
# @router.get(
#     "/status",
#     response_model=ClientStatusResponse,
#     summary="Get Client Status Updates",
#     description="Retrieve status updates for clients that are currently in progress processing. Returns only clients with in_progress status to minimize database load.",
# )
# async def get_client_status_updates_route(
#     session: AsyncSession = Depends(get_session),
#     pseudonymized_id: str = Depends(get_pseudonymized_id),
# ):
#     # Get status updates for in-progress clients
#     return await get_client_status_updates(session, pseudonymized_id)


@router.get(
    "/{client_pseudo_id}/latest_address",
    response_model=ClientAddressResponse,
    summary="Get Client latest known address",
    description="Retrieve the latest address submission for a client",
    tags=["Client Records"],
)
async def get_client_latest_address(
    client_pseudo_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # Get client data with staff verification
    record = Queries.get_client_data_by_pseudonymized_id(
        pseudonymized_client_id=client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_id,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Client Record not found")

    # Get address from latest completed intake
    latest_address = await get_latest_address_client_pseudo_id(
        session, client_pseudo_id
    )

    if not latest_address:
        return None

    return latest_address


@router.get(
    "/{client_pseudo_id}",
    response_model=ClientRecordResponse,
    summary="Get Client Record",
    description="Retrieve a Client record by its pseudonimyzed id (client_pseudo_id)",
    tags=["Client Records"],
)
async def get_client_record(
    client_pseudo_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
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


@router.get(
    "/{client_pseudo_id}/intakes",
    response_model=list[IntakeHistoryResponse],
    summary="Get Client Intake History",
    description="Retrieve all intakes for a client, ordered by creation date (newest first)",
    tags=["Client Records"],
)
async def get_client_intakes(
    client_pseudo_id: str,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    """
    Get all intakes for a client.

    Returns intake history with assessment config information to help case managers
    understand which assessments were used for each intake.
    """
    check_access(client_pseudo_id, pseudonymized_id)

    intakes = await get_all_intakes_by_client_pseudo_id(session, client_pseudo_id)

    if not intakes:
        return []

    # Format response with assessment config info
    response = []
    for intake in intakes:
        plan_config = await ConfigLoader.load_plan_config(
            intake.assessment_config_id, session
        )
        response.append(
            IntakeHistoryResponse(
                id=intake.id,
                created_at=intake.created_at,
                updated_at=intake.updated_at,
                status=intake.status.value,
                intake_type=intake.intake_type,
                assessment_config_code=intake.assessment_config.code
                if intake.assessment_config
                else None,
                assessment_config_display_name=intake.assessment_config.display_name
                if intake.assessment_config
                else None,
                completed_at=intake.completed_at,
                assessment_config_outputs_action_plan_activated=plan_config is not None,
            )
        )

    return response


class ClientResetResponse(BaseModel):
    client_pseudo_id: str
    total_deleted: int


@router.delete(
    "/{client_pseudo_id}/reset",
    response_model=ClientResetResponse,
    summary="Reset Client Data",
    description="Deletes all intake data for a client.",
    tags=["Client Records"],
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
