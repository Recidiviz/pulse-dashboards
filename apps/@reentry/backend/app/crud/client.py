from enum import StrEnum
from typing import Literal

import sqlalchemy
import structlog
from sqlmodel import select

from app.core.db import AsyncSession
from app.crud.intake import (
    get_latest_completed_intake_by_client_pseudo_id,
)
from app.crud.utils import apply_search_filter, paginate, sort_clients_by_name
from app.models.intake import (
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeSurvey,
    IntakeToken,
)
from app.models.intake_sections import ClientIntakeSection
from app.models.models import Execution, Plan, PlanAsset, PlanGeneration
from app.models.plan_decision_tree import PlanDecisionTree
from app.models.recording import RecordingChunk, RecordingSession
from app.routes.shared_models import ProcessingStatus
from app.services.client_data.queries import Queries
from app.services.client_data.types import ClientDataRecord
from app.utils.processing_status_utils import compute_processing_status
from app.utils.string_utils import normalize_locations

logger = structlog.get_logger(__name__)


class ClientStatusFilter(StrEnum):
    """All possible client status filter values."""

    NEW = "new"
    INTAKE_ENABLED = "intake_enabled"
    INTAKE_IN_PROGRESS = "intake_in_progress"
    PROCESSING = "processing"
    INTAKE_COMPLETE = "intake_complete"
    ERROR = "error"


class ClientSort(StrEnum):
    NAME = "name"
    LAST_ASSESSMENT_DATE = "last_assessment_date"
    INTAKE_COUNT = "intake_count"


def compute_frontend_status(
    intake_status: str | None, processing_status: ProcessingStatus
) -> str:
    if not intake_status:
        return "new"

    if intake_status == "created":
        return "intake_enabled"

    if intake_status == "in_progress":
        return "intake_in_progress"

    if intake_status == "completed":
        if processing_status == ProcessingStatus.IN_PROGRESS:
            return "processing"
        if processing_status == ProcessingStatus.NOT_STARTED:
            return "processing"
        if processing_status == ProcessingStatus.COMPLETED:
            return "intake_complete"
        if processing_status == ProcessingStatus.FAILED:
            return "error"
        if processing_status == ProcessingStatus.NEEDS_RETRY:
            return "error"
        return "error"

    if intake_status == "error":
        return "error"

    return "unknown"


async def get_paginated_client_list(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    pseudonymized_staff_id: str | None = None,
    sort_by: ClientSort | None = ClientSort.LAST_ASSESSMENT_DATE,
    sort_order: str = "asc",
    search: str | None = None,
    status_filter: ClientStatusFilter | None = None,
    is_zero_caseload_user: bool = False,
    cpa_client_locations: list[str] | None = None,
):
    """
    Returns a paginated list of clients with status filtering and sorting.
    We use different optimization strategies to balance performance and convenience:
    - DEFAULT: No filter - SQL query with aggregates, includes all BQ clients
    - simple_filter: Simple status filters (intake_enabled, intake_in_progress) - SQL query
    - new_client_filter: Special case for clients without intakes
    - complex_filter: Complex status filters (processing, intake_complete, error) - Python computation

    If staff_id is provided, only returns clients assigned to that staff member.
    """
    # 1. No staff ID, empty response
    if not pseudonymized_staff_id:
        return empty_paginated_response(page, page_size)

    # 2. Fetch caseload clients from BigQuery
    caseload_clients = Queries.get_clients_by_pseudonymized_staff_id(
        pseudonymized_staff_id
    )
    if not caseload_clients:
        caseload_clients = []

    # 3. Zero-caseload logic
    facility_clients = []

    if is_zero_caseload_user:
        caseworker = Queries.get_caseworker_by_pseudonymized_id(pseudonymized_staff_id)
        staff_locations = (
            caseworker.locations if caseworker and caseworker.locations else []
        )
        logger.debug(
            f"Staff locations for zero-caseload user {pseudonymized_staff_id}: {staff_locations}"
        )
        logger.debug(
            f"CPA client locations for zero-caseload user {pseudonymized_staff_id}: {cpa_client_locations}"
        )
        # join with CPA client locations if provided and then normalize and replace spaces
        cpa_client_locations = cpa_client_locations or []
        staff_locations = staff_locations + cpa_client_locations
        staff_locations = normalize_locations(staff_locations)

        logger.debug(
            f"After intersecting with CPA client locations, staff locations for zero-caseload user {pseudonymized_staff_id}: {staff_locations}"
        )

        # Query all clients where location IN staff_locations
        if staff_locations:
            facility_clients = Queries.get_clients_by_facility_access(
                pseudonymized_staff_id, staff_locations
            )
            logger.debug(
                f"{len(facility_clients)} facility clients found for zero-caseload user {pseudonymized_staff_id}"
            )

    # Merge caseload + facility clients
    combined_clients = caseload_clients + facility_clients

    # 4. De-duplicate by pseudonymized_client_id
    unique_clients = {}
    for client in combined_clients:
        unique_clients[client.pseudonymized_client_id] = client

    clients = list(unique_clients.values())

    # 5. Apply search filter
    if search:
        clients = apply_search_filter(clients, search)

    # Return early if no clients remain after search filtering
    if not clients:
        return empty_paginated_response(page, page_size)

    bq_client_ids = [c.pseudonymized_client_id for c in clients]

    # Simple status filters - SQL with sorting
    if status_filter in [
        None,
        ClientStatusFilter.INTAKE_ENABLED,
        ClientStatusFilter.INTAKE_IN_PROGRESS,
    ]:
        return await handle_simple_status_filter(
            session,
            clients,
            bq_client_ids,
            status_filter,
            sort_by,
            sort_order,
            page,
            page_size,
        )

    # "new" status - special case
    if status_filter == ClientStatusFilter.NEW:
        return await handle_new_client_filter(
            session, clients, bq_client_ids, sort_by, sort_order, page, page_size
        )

    # Complex filters - requires full status computation
    # status_filter must be one of: PROCESSING, INTAKE_COMPLETE, ERROR
    if status_filter in [
        ClientStatusFilter.PROCESSING,
        ClientStatusFilter.INTAKE_COMPLETE,
        ClientStatusFilter.ERROR,
    ]:
        return await handle_complex_status_filter(
            session,
            clients,
            bq_client_ids,
            status_filter,
            sort_by,
            sort_order,
            page,
            page_size,
        )

    # Invalid status filter
    return empty_paginated_response(page, page_size)


def empty_paginated_response(page: int, size: int):
    return {
        "items": [],
        "total": 0,
        "page": page,
        "size": size,
        "pages": 0,
    }


async def count_intakes_for_client(session: AsyncSession, client_pseudo_id: str) -> int:
    """Count the total number of intakes for a given client."""
    result = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intakes = result.all()
    return len(intakes)


async def handle_simple_status_filter(
    session: AsyncSession,
    bq_clients: list[ClientDataRecord],
    bq_client_ids: list[str],
    status_filter: Literal[
        ClientStatusFilter.INTAKE_ENABLED, ClientStatusFilter.INTAKE_IN_PROGRESS
    ]
    | None,
    sort_by: ClientSort | None,
    sort_order: str,
    page: int,
    page_size: int,
):
    """
    Handle intake_enabled and intake_in_progress filters, or no filter.
    Query intake table directly with aggregates and sorting in SQL.

    When status_filter is None, includes all BQ clients (even those without intakes).
    When status_filter is set, only includes clients with matching intake status.
    """
    intake_status = None
    if status_filter:
        # Map frontend status to intake.status
        intake_status_map = {
            ClientStatusFilter.INTAKE_ENABLED: "created",
            ClientStatusFilter.INTAKE_IN_PROGRESS: "in_progress",
        }
        intake_status = intake_status_map[status_filter]

    placeholders = ", ".join([f"'{cid}'" for cid in bq_client_ids])

    # Build ORDER BY clause
    order_clause = ""
    if sort_by == ClientSort.NAME:
        # Will sort in-memory with BQ data
        order_clause = ""
    elif sort_by == ClientSort.INTAKE_COUNT:
        order_clause = f"ORDER BY intake_count {sort_order.upper()}"
    elif sort_by == ClientSort.LAST_ASSESSMENT_DATE:
        order_clause = f"ORDER BY last_completed_date {sort_order.upper()} NULLS LAST"

    # SQL query with aggregates
    stmt = sqlalchemy.text(
        f"""
        SELECT
            client_pseudo_id,
            COUNT(*) as intake_count,
            MAX(completed_at) as last_completed_date
        FROM intake
        WHERE client_pseudo_id IN ({placeholders})
          {f"AND status = '{intake_status}'"if intake_status else ''}
        GROUP BY client_pseudo_id
        {order_clause}
    """
    )

    result = await session.exec(stmt)
    query_results = [
        {
            "client_pseudo_id": row[0],
            "intake_count": row[1],
            "last_completed_date": row[2],
        }
        for row in result
    ]

    # Create lookup for BQ data
    client_lookup = {c.pseudonymized_client_id: c for c in bq_clients}
    data_lookup = {r["client_pseudo_id"]: r for r in query_results}

    # Clients from query results
    clients_with_intakes_ids = set(r["client_pseudo_id"] for r in query_results)

    # If no status filter, include all BQ clients (even those without intakes)
    if not status_filter:
        # Find clients that don't have any intakes
        clients_without_intakes = [
            c
            for c in bq_clients
            if c.pseudonymized_client_id not in clients_with_intakes_ids
        ]
        # Add them to data_lookup with zero counts
        for client in clients_without_intakes:
            data_lookup[client.pseudonymized_client_id] = {
                "client_pseudo_id": client.pseudonymized_client_id,
                "intake_count": 0,
                "last_completed_date": None,
            }

    filtered_clients = None
    # If sorting by name, do in-memory
    if sort_by == ClientSort.NAME:
        # Include clients with intakes
        filtered_clients = [
            client_lookup[r["client_pseudo_id"]]
            for r in query_results
            if r["client_pseudo_id"] in client_lookup
        ]
        # If no status filter, also include clients without intakes
        if not status_filter:
            filtered_clients.extend(clients_without_intakes)

        sorted_clients_ids = [
            c.pseudonymized_client_id
            for c in sort_clients_by_name(filtered_clients, sort_order)
        ]
    else:
        # Already sorted by SQL (clients with intakes)
        sorted_clients_ids = [r["client_pseudo_id"] for r in query_results]
        # If no status filter, append clients without intakes at the end
        if not status_filter:
            sorted_clients_ids.extend(
                [c.pseudonymized_client_id for c in clients_without_intakes]
            )

    # Paginate
    paginated_clients = paginate(sorted_clients_ids, page, page_size)

    # Build response
    items = []
    for client in paginated_clients:
        data = data_lookup[client]
        items.append(
            {
                "client_pseudo_id": client,
                "client": client_lookup[client],
                "intake_count": data["intake_count"],
                "last_completed_date": data["last_completed_date"],
            }
        )
    total = len(sorted_clients_ids)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }


async def handle_new_client_filter(
    session: AsyncSession,
    bq_clients: list[ClientDataRecord],
    bq_client_ids: list[str],
    sort_by: ClientSort | None,
    sort_order: str,
    page: int,
    page_size: int,
):
    """
    Handle "new" status - clients with no intake in the database.
    This is the expected state for newly created clients.
    """
    placeholders = ", ".join([f"'{cid}'" for cid in bq_client_ids])

    # Find clients that have intakes
    stmt = sqlalchemy.text(
        f"""
        SELECT DISTINCT client_pseudo_id
        FROM intake
        WHERE client_pseudo_id IN ({placeholders})
    """
    )
    result = await session.exec(stmt)
    existing_ids = set(row[0] for row in result)

    # Filter to only new clients (not in intake table)
    new_clients = [
        c for c in bq_clients if c.pseudonymized_client_id not in existing_ids
    ]

    # Sort - for new clients, only name sort makes sense
    # (intake_count=0, last_completed_date=None for all)
    if sort_by == ClientSort.NAME:
        sorted_clients = sort_clients_by_name(new_clients, sort_order)
    else:
        # For other sorts, default to name ascending
        sorted_clients = sort_clients_by_name(new_clients, "asc")

    # Paginate
    paginated_clients = paginate(sorted_clients, page, page_size)

    # Build response - all new clients have no intake data
    items = []
    for client in paginated_clients:
        items.append(
            {
                "client_pseudo_id": client.pseudonymized_client_id,
                "client": client,
                "intake_count": 0,
                "last_completed_date": None,
            }
        )

    return {
        "items": items,
        "total": len(sorted_clients),
        "page": page,
        "size": page_size,
        "pages": (len(sorted_clients) + page_size - 1) // page_size
        if sorted_clients
        else 0,
    }


async def handle_complex_status_filter(
    session: AsyncSession,
    bq_clients: list[ClientDataRecord],
    bq_client_ids: list[str],
    status_filter: Literal[
        ClientStatusFilter.PROCESSING,
        ClientStatusFilter.INTAKE_COMPLETE,
        ClientStatusFilter.ERROR,
    ],
    sort_by: ClientSort | None,
    sort_order: str,
    page: int,
    page_size: int,
):
    """
    Handle complex status filters that require full processing_status computation.

    Filters intakes by processing status ("processing", "intake_complete", "error").
    Returns clients that have at least one intake matching the filter, with only
    matching intakes counted in intake_count and last_completed_date.

    For "error" filter: includes both completed intakes with error processing status
    AND intakes with status="error".
    """

    from datetime import datetime

    # Fetch all related data efficiently for completed intakes

    # Get all intakes (to determine latest per client for status computation)
    all_intakes = (
        await session.exec(
            select(Intake).where(Intake.client_pseudo_id.in_(bq_client_ids))
        )
    ).all()

    # Keep latest intake per client for status display
    intakes_by_client = {}
    for intake in all_intakes:
        if intake.client_pseudo_id not in intakes_by_client:
            intakes_by_client[intake.client_pseudo_id] = intake
        else:
            existing = intakes_by_client[intake.client_pseudo_id]
            if intake.created_at > existing.created_at:
                intakes_by_client[intake.client_pseudo_id] = intake

    # Get completed intakes and their IDs for querying related entities
    completed_intakes = [i for i in all_intakes if i.status == "completed"]
    completed_intake_ids = [i.id for i in completed_intakes]

    # Map completed intakes to clients
    completed_intakes_by_client = {}
    for intake in completed_intakes:
        if intake.client_pseudo_id not in completed_intakes_by_client:
            completed_intakes_by_client[intake.client_pseudo_id] = []
        completed_intakes_by_client[intake.client_pseudo_id].append(intake)

    # Get error status intakes (for error filter)
    error_intakes = [i for i in all_intakes if i.status == "error"]

    # Map error intakes to clients
    error_intakes_by_client = {}
    for intake in error_intakes:
        if intake.client_pseudo_id not in error_intakes_by_client:
            error_intakes_by_client[intake.client_pseudo_id] = []
        error_intakes_by_client[intake.client_pseudo_id].append(intake)

    # Get plans with executions for completed intakes
    plans_by_intake = {}
    if completed_intake_ids:
        plans_query = (
            select(Plan, Execution)
            .where(Plan.intake_id.in_(completed_intake_ids))
            .outerjoin(Execution, Plan.create_execution_id == Execution.id)
        )
        plans_with_executions = (await session.exec(plans_query)).all()
        for plan, execution in plans_with_executions:
            plan.create_execution = execution
            plans_by_intake[plan.intake_id] = plan
    else:
        plans_with_executions = []

    # Get recordings with executions for completed intakes
    recordings_by_intake = {}
    if completed_intake_ids:
        from app.models.recording import RecordingSession

        recordings_query = (
            select(RecordingSession, Execution)
            .where(RecordingSession.intake_id.in_(completed_intake_ids))
            .outerjoin(Execution, RecordingSession.execution_id == Execution.id)
        )
        recordings_with_executions = (await session.exec(recordings_query)).all()
        for recording, execution in recordings_with_executions:
            recording.execution = execution
            recordings_by_intake[recording.intake_id] = recording
    else:
        recordings_with_executions = []

    # Get plan generations with executions
    plan_ids = [plan.id for plan, _ in plans_with_executions]
    generations_by_plan = {}
    if plan_ids:
        generations_query = (
            select(PlanGeneration, Execution)
            .where(PlanGeneration.plan_id.in_(plan_ids))
            .outerjoin(Execution, PlanGeneration.execution_id == Execution.id)
        )
        generations_with_executions = (await session.exec(generations_query)).all()
        for generation, execution in generations_with_executions:
            generation.execution = execution
            if generation.plan_id not in generations_by_plan:
                generations_by_plan[generation.plan_id] = []
            generations_by_plan[generation.plan_id].append(generation)

    # Filter intakes by processing status
    # Build a mapping of clients with matching intakes
    clients_with_matching_intakes = {}

    for client in bq_clients:
        cid = client.pseudonymized_client_id

        # Get all completed intakes for this client
        client_completed_intakes = completed_intakes_by_client.get(cid, [])

        # Track intakes that match the filter
        matching_intakes = []

        # Process completed intakes
        for intake in client_completed_intakes:
            # Get related entities by intake_id
            plan = plans_by_intake.get(intake.id)

            generations = []
            if plan and plan.id in generations_by_plan:
                generations = generations_by_plan[plan.id]

            # Compute processing status for this intake
            processing_status = compute_processing_status(plan, intake, generations)

            # Compute frontend status for this intake
            frontend_status = compute_frontend_status(intake.status, processing_status)

            # Check if this intake matches the filter
            if frontend_status == status_filter:
                matching_intakes.append(intake)

        # For error filter, also include intakes with status="error"
        if status_filter == ClientStatusFilter.ERROR:
            client_error_intakes = error_intakes_by_client.get(cid, [])
            matching_intakes.extend(client_error_intakes)

        # Only include clients that have at least one matching intake
        if matching_intakes:
            clients_with_matching_intakes[cid] = {
                "client": client,
                "matching_intake_count": len(matching_intakes),
                "last_completed_date": max(
                    (i.completed_at for i in matching_intakes if i.completed_at),
                    default=None,
                ),
            }

    # Build filtered clients list
    filtered_clients = list(clients_with_matching_intakes.values())

    # Sort in-memory
    if sort_by == ClientSort.NAME:
        filtered_clients.sort(
            key=lambda c: (
                f"{c['client'].full_name.given_names} {c['client'].full_name.surname}".lower()
                if c["client"].full_name
                else ""
            ),
            reverse=(sort_order == "desc"),
        )
    elif sort_by == ClientSort.INTAKE_COUNT:
        filtered_clients.sort(
            key=lambda c: c["matching_intake_count"], reverse=(sort_order == "desc")
        )
    elif sort_by == ClientSort.LAST_ASSESSMENT_DATE:
        # Use naive datetime for comparison (database stores naive datetimes)
        filtered_clients.sort(
            key=lambda c: c["last_completed_date"] or datetime.min,
            reverse=(sort_order == "desc"),
        )

    # Paginate
    paginated = paginate(filtered_clients, page, page_size)

    # Build response
    items = []
    for enriched in paginated:
        items.append(
            {
                "client_pseudo_id": enriched["client"].pseudonymized_client_id,
                "client": enriched["client"],
                "intake_count": enriched["matching_intake_count"],
                "last_completed_date": enriched["last_completed_date"],
            }
        )

    return {
        "items": items,
        "total": len(filtered_clients),
        "page": page,
        "size": page_size,
        "pages": (len(filtered_clients) + page_size - 1) // page_size
        if filtered_clients
        else 0,
    }


async def build_response_for_clients(
    clients: list[ClientDataRecord],
    session: AsyncSession,
    page: int,
    page_size: int,
) -> dict:
    paged_clients = paginate(clients, page, page_size)

    items = []
    for client in paged_clients:
        latest_intake = await get_latest_completed_intake_by_client_pseudo_id(
            session, client.pseudonymized_client_id
        )
        intake_count = await count_intakes_for_client(
            session, client.pseudonymized_client_id
        )
        last_completed_date = None
        if latest_intake:
            last_completed_date = latest_intake.completed_at or latest_intake.updated_at

        items.append(
            {
                "client_pseudo_id": client.pseudonymized_client_id,
                "client": client,
                "intake_count": intake_count,
                "last_completed_date": last_completed_date,
            }
        )

    return {
        "items": items,
        "total": len(clients),
        "page": page,
        "size": page_size,
        "pages": (len(clients) + page_size - 1) // page_size if clients else 0,
    }


async def reset_client_data(session: AsyncSession, client_pseudo_id: str) -> int:
    total_deleted = 0

    recording_sessions_list = (
        await session.exec(
            select(RecordingSession).where(
                RecordingSession.client_pseudo_id == client_pseudo_id
            )
        )
    ).all()

    for rs in recording_sessions_list:
        chunks = await session.exec(
            select(RecordingChunk).where(RecordingChunk.session_id == rs.id)
        )
        for chunk in chunks.all():
            await session.delete(chunk)
            total_deleted += 1

    for rs in recording_sessions_list:
        await session.delete(rs)
        total_deleted += 1

    intakes_list = (
        await session.exec(
            select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
        )
    ).all()

    for intake in intakes_list:
        messages = await session.exec(
            select(IntakeMessage).where(IntakeMessage.intake_id == intake.id)
        )
        for msg in messages.all():
            await session.delete(msg)
            total_deleted += 1

        sections = await session.exec(
            select(ClientIntakeSection).where(
                ClientIntakeSection.intake_id == intake.id
            )
        )
        for section in sections.all():
            await session.delete(section)
            total_deleted += 1

        tokens = await session.exec(
            select(IntakeToken).where(IntakeToken.intake_id == intake.id)
        )
        for token in tokens.all():
            await session.delete(token)
            total_deleted += 1

        addresses = await session.exec(
            select(ClientAddress).where(ClientAddress.intake_id == intake.id)
        )
        for address in addresses.all():
            await session.delete(address)
            total_deleted += 1

        surveys = await session.exec(
            select(IntakeSurvey).where(IntakeSurvey.intake_id == intake.id)
        )
        for survey in surveys.all():
            await session.delete(survey)
            total_deleted += 1

    # Delete plans and their children before intakes (plans reference intake_id)
    plans_list = (
        await session.exec(
            select(Plan).where(Plan.client_pseudo_id == client_pseudo_id)
        )
    ).all()

    for plan in plans_list:
        assets = await session.exec(
            select(PlanAsset).where(PlanAsset.plan_id == plan.id)
        )
        for asset in assets.all():
            await session.delete(asset)
            total_deleted += 1

        generations = await session.exec(
            select(PlanGeneration).where(PlanGeneration.plan_id == plan.id)
        )
        for generation in generations.all():
            await session.delete(generation)
            total_deleted += 1

        decision_trees = await session.exec(
            select(PlanDecisionTree).where(PlanDecisionTree.plan_id == plan.id)
        )
        for tree in decision_trees.all():
            await session.delete(tree)
            total_deleted += 1

    for plan in plans_list:
        await session.delete(plan)
        total_deleted += 1

    # Delete intakes last (after all tables that reference them)
    for intake in intakes_list:
        await session.delete(intake)
        total_deleted += 1

    return total_deleted
