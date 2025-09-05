import logging

import sqlalchemy
from sqlmodel.sql.expression import select

from app.core.db import AsyncSession
from app.crud.utils import apply_search_filter, paginate, sort_clients_by_name
from app.models.assessment import Assessment
from app.models.intake import Intake
from app.models.models import Execution, Plan, PlanGeneration
from app.routes.shared_models import ProcessingStatus
from app.services.client_data.queries import Queries
from app.services.client_data.types import ClientDataRecord

logger = logging.getLogger(__name__)


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
        if processing_status == ProcessingStatus.COMPLETED:
            return "intake_complete"
        if processing_status == ProcessingStatus.FAILED:
            return "error"
        return "processing"

    if intake_status == "error":
        return "error"

    return "unknown"


def compute_processing_status(
    assessments, plans, intake, plan_generations=None
) -> ProcessingStatus:
    """Compute aggregated processing status from assessments, plans, and intake"""

    print(
        f"DEBUG: compute_processing_status called - plan create_status: {plans.create_status if plans else None}"
    )

    # If no intake or intake not completed, processing hasn't started
    if not intake or intake.status != "completed":
        print("DEBUG: Returning NOT_STARTED - intake not completed")
        return ProcessingStatus.NOT_STARTED

    # Check for any in-progress work FIRST (before checking if plan is completed)
    plan_in_progress = plans and plans.create_status in ["in_progress", "pending"]

    assessments_in_progress = assessments and any(
        a.status in ["in_progress", "pending"] for a in assessments
    )

    # Check if the LATEST plan generation is in progress (not all generations)
    generations_in_progress = False
    if plan_generations:
        print(f"DEBUG: Checking {len(plan_generations)} plan generations")

        # Sort generations by created_at to get the latest one
        sorted_generations = sorted(
            plan_generations, key=lambda x: x.created_at or "", reverse=True
        )
        latest_generation = sorted_generations[0] if sorted_generations else None

        if latest_generation:
            execution = latest_generation.execution
            execution_status = execution.status if execution else None
            print(
                f"DEBUG: Latest generation {latest_generation.id} execution status: {execution_status}"
            )

            generations_in_progress = (
                execution_status in ["in_progress", "pending"]
                if execution_status
                else False
            )

        print(f"DEBUG: Latest generation in progress: {generations_in_progress}")

    # Return IN_PROGRESS if anything is actively running (highest priority)
    if plan_in_progress or generations_in_progress:
        print(
            f"DEBUG: Returning IN_PROGRESS - plan_in_progress: {plan_in_progress}, generations_in_progress: {generations_in_progress}"
        )
        return ProcessingStatus.IN_PROGRESS
    elif assessments_in_progress:
        print("DEBUG: Returning IN_PROGRESS - assessments in progress")
        return ProcessingStatus.IN_PROGRESS

    # If plan creation is completed and nothing is in progress, overall status is completed
    if plans and plans.create_status == "completed":
        print(
            "DEBUG: Returning COMPLETED - plan create_status is completed and nothing in progress"
        )
        return ProcessingStatus.COMPLETED

    # Check if we have completed assessments
    has_completed_assessments = assessments and any(
        a.status == "completed" for a in assessments
    )

    # If plan failed and we have completed assessments, needs retry
    if has_completed_assessments and plans and plans.create_status == "failed":
        return ProcessingStatus.NEEDS_RETRY

    # If all assessments failed, needs retry
    if assessments and all(a.status == "failed" for a in assessments):
        return ProcessingStatus.NEEDS_RETRY

    # If we have completed assessments but no plan, needs retry (plan should have been created)
    if has_completed_assessments and not plans:
        return ProcessingStatus.NEEDS_RETRY

    # Intake completed but no processing has started yet - processing should have started automatically, so this needs retry
    return ProcessingStatus.NEEDS_RETRY


# Fetch client data for current staff (case manager or supervision officer)
# Get a list of clients with their progress status (intake, assessment, plan)
# Order by process stage to show clients with active intake first
async def get_paginated_client_list(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    pseudonymized_staff_id: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    search: str | None = None,
    status_filter: str | None = None,
):
    """
    Returns a paginated list of clients with their intake, plans, and assessments,
    ordered by process stage with active intake clients shown first.
    This ensures clients with active intake are prioritized over new clients.

    If staff_id is provided, only returns clients assigned to that staff member.
    """
    # Step 1: Get all clients from BigQuery for this staff member
    if not pseudonymized_staff_id:
        return empty_paginated_response(page, page_size)

    bq_clients = Queries.get_clients_by_pseudonymized_staff_id(pseudonymized_staff_id)
    if not bq_clients:
        return empty_paginated_response(page, page_size)

    bq_clients = apply_search_filter(bq_clients, search) if search else bq_clients

    if sort_by == "name":
        sorted_clients = sort_clients_by_name(bq_clients, sort_order)
        return await build_response_for_clients(
            sorted_clients, session, page, page_size
        )

    if status_filter:
        # TODO change this so we use the database status index.
        sorted_clients = await compute_priority_order(bq_clients, session)
        full_response = await build_response_for_clients(
            sorted_clients, session, 1, len(sorted_clients)
        )

        # filtering still require information about intake and plan
        # that for now, we don't do database filtering.
        filtered_items = []
        for item in full_response["items"]:
            intake_status = item["intake"]["status"] if item["intake"] else None
            frontend_status = compute_frontend_status(
                intake_status, item["processing_status"]
            )
            if frontend_status == status_filter:
                filtered_items.append(item)

        start = (page - 1) * page_size
        end = start + page_size

        return {
            "items": filtered_items[start:end],
            "total": len(filtered_items),
            "page": page,
            "size": page_size,
            "pages": (len(filtered_items) + page_size - 1) // page_size
            if filtered_items
            else 0,
        }

    sorted_clients = await compute_priority_order(bq_clients, session)
    return await build_response_for_clients(sorted_clients, session, page, page_size)


def empty_paginated_response(page: int, size: int):
    return {
        "items": [],
        "total": 0,
        "page": page,
        "size": size,
        "pages": 0,
    }


async def compute_priority_order(
    clients: list[ClientDataRecord], session: AsyncSession
) -> list[ClientDataRecord]:
    if not clients:
        return []

    placeholders = ", ".join(
        [f"'{client.pseudonymized_client_id}'" for client in clients]
    )
    stmt = sqlalchemy.text(f"""
        SELECT DISTINCT client_pseudo_id, MIN(process_stage_order) as min_order
        FROM client_view
        WHERE client_pseudo_id IN ({placeholders})
        GROUP BY client_pseudo_id
        ORDER BY min_order ASC
    """)

    result = await session.exec(stmt)
    ordered = [(row[0], row[1]) for row in result]

    # Create mappings for efficient lookups
    id_to_order = {cid: order for cid, order in ordered}
    ordered_ids = set(cid for cid, order in ordered)

    # Sort clients into categories in one pass
    active = []
    others = []
    new = []

    for client in clients:
        client_pseudo_id = client.pseudonymized_client_id
        if client_pseudo_id in ordered_ids:
            order = id_to_order[client_pseudo_id]
            if order <= 30:
                active.append((client, order))
            else:
                others.append((client, order))
        else:
            new.append(client)

    # Sort active and others by their order values
    active.sort(key=lambda x: x[1])
    others.sort(key=lambda x: x[1])

    # Extract just the client objects
    active = [client for client, _ in active]
    others = [client for client, _ in others]

    return others + active + new


async def build_response_for_clients(
    clients: list[ClientDataRecord],
    session: AsyncSession,
    page: int,
    page_size: int,
) -> dict:
    paged_clients = paginate(clients, page, page_size)
    paged_ids = [c.pseudonymized_client_id for c in paged_clients]

    intakes = (
        await session.exec(select(Intake).where(Intake.client_pseudo_id.in_(paged_ids)))
    ).all()
    intakes_by_client = {i.client_pseudo_id: i for i in intakes}

    plans_with_execs = (
        await session.exec(
            select(Plan, Execution)
            .where(Plan.client_pseudo_id.in_(paged_ids))
            .outerjoin(Execution, Plan.create_execution_id == Execution.id)
        )
    ).all()
    plans_by_client = {}
    for plan, execution in plans_with_execs:
        plan.create_execution = execution
        plans_by_client[plan.client_pseudo_id] = plan

    assessments_with_execs = (
        await session.exec(
            select(Assessment, Execution)
            .where(Assessment.client_pseudo_id.in_(paged_ids))
            .outerjoin(Execution, Assessment.execution_id == Execution.id)
        )
    ).all()
    assessments_by_client = {}
    for a, e in assessments_with_execs:
        a.execution = e
        assessments_by_client.setdefault(a.client_pseudo_id, []).append(a)

    plan_ids = [p.id for p in plans_by_client.values()]
    generations_with_execs = []
    if plan_ids:
        generations_with_execs = (
            await session.exec(
                select(PlanGeneration, Execution)
                .where(PlanGeneration.plan_id.in_(plan_ids))
                .outerjoin(Execution, PlanGeneration.execution_id == Execution.id)
            )
        ).all()
    generations_by_plan = {}
    for g, e in generations_with_execs:
        g.execution = e
        generations_by_plan.setdefault(g.plan_id, []).append(g)

    items = []
    for client in paged_clients:
        intake = intakes_by_client.get(client.pseudonymized_client_id)
        plan = plans_by_client.get(client.pseudonymized_client_id)
        assessments = assessments_by_client.get(client.pseudonymized_client_id, [])
        generations = generations_by_plan.get(plan.id) if plan else []
        status = compute_processing_status(assessments, plan, intake, generations)

        items.append(
            {
                "client_pseudo_id": client.pseudonymized_client_id,
                "client": client,
                "processing_status": status,
                "intake": intake.model_dump() if intake else None,
                "plans": plan.model_dump() if plan else None,
            }
        )

    return {
        "items": items,
        "total": len(clients),
        "page": page,
        "size": page_size,
        "pages": (len(clients) + page_size - 1) // page_size if clients else 0,
    }


async def get_client_status_updates(
    session: AsyncSession,
    pseudonymized_staff_id: str | None = None,
):
    """
    Returns a lightweight status update for clients that are currently in progress.
    Only includes client_pseudo_id and processing_status to minimize database load.
    """
    # Step 1: Get all clients from BigQuery for this staff member
    if pseudonymized_staff_id:
        bq_clients = Queries.get_clients_by_pseudonymized_staff_id(
            pseudonymized_staff_id
        )

        if not bq_clients:
            return {"in_progress": []}

        # Get the external_ids of clients assigned to this staff
        bq_client_pseudo_ids = [client.pseudonymized_client_id for client in bq_clients]
    else:
        return {"in_progress": []}

    # Step 2: Get only clients that have completed intake (processing-eligible)
    if bq_client_pseudo_ids:
        placeholders = ", ".join([f"'{id}'" for id in bq_client_pseudo_ids])
        intake_stmt = sqlalchemy.text(f"""
            SELECT client_pseudo_id
            FROM intake
            WHERE client_pseudo_id IN ({placeholders}) AND status = 'completed'
        """)

        result = await session.exec(intake_stmt)
        clients_with_completed_intake = [row[0] for row in result]
    else:
        clients_with_completed_intake = []

    if not clients_with_completed_intake:
        return {"in_progress": []}

    # Step 3: Get minimal data needed for status computation
    # Get intakes
    intakes_query = select(Intake).where(
        Intake.client_pseudo_id.in_(clients_with_completed_intake)
    )
    intakes = (await session.exec(intakes_query)).all()
    intakes_by_client = {intake.client_pseudo_id: intake for intake in intakes}

    # Get plans and their executions
    plans_query = (
        select(Plan, Execution)
        .where(Plan.client_pseudo_id.in_(clients_with_completed_intake))
        .outerjoin(Execution, Plan.create_execution_id == Execution.id)
    )
    plans_with_executions = (await session.exec(plans_query)).all()
    plans_by_client = {}
    for plan, execution in plans_with_executions:
        plan.create_execution = execution
        if plan.client_pseudo_id not in plans_by_client:
            plans_by_client[plan.client_pseudo_id] = plan

    # Get plan generations and their executions
    plan_ids = [plan.id for plan, _ in plans_with_executions]
    if plan_ids:
        generations_query = (
            select(PlanGeneration, Execution)
            .where(PlanGeneration.plan_id.in_(plan_ids))
            .outerjoin(Execution, PlanGeneration.execution_id == Execution.id)
        )
        generations_with_executions = (await session.exec(generations_query)).all()
        generations_by_plan = {}
        for generation, execution in generations_with_executions:
            generation.execution = execution
            if generation.plan_id not in generations_by_plan:
                generations_by_plan[generation.plan_id] = []
            generations_by_plan[generation.plan_id].append(generation)
    else:
        generations_by_plan = {}

    # Get assessments and their executions
    assessments_query = (
        select(Assessment, Execution)
        .where(Assessment.client_pseudo_id.in_(clients_with_completed_intake))
        .outerjoin(Execution, Assessment.execution_id == Execution.id)
    )
    assessments_with_executions = (await session.exec(assessments_query)).all()
    assessments_by_client = {}
    for assessment, execution in assessments_with_executions:
        assessment.execution = execution
        if assessment.client_pseudo_id not in assessments_by_client:
            assessments_by_client[assessment.client_pseudo_id] = []
        assessments_by_client[assessment.client_pseudo_id].append(assessment)

    # Step 4: Compute status for each client and return only in-progress ones
    in_progress_clients = []
    for client_pseudo_id in clients_with_completed_intake:
        intake = intakes_by_client.get(client_pseudo_id)
        plan = plans_by_client.get(client_pseudo_id)
        assessments = assessments_by_client.get(client_pseudo_id, [])

        # Get plan generations for this client's plan
        client_generations = []
        if plan and plan.id in generations_by_plan:
            client_generations = generations_by_plan[plan.id]

        # Compute processing status using SQLModel objects directly
        processing_status = compute_processing_status(
            assessments,
            plan,
            intake,
            client_generations,
        )

        # Only include clients that are currently in progress
        if processing_status == ProcessingStatus.IN_PROGRESS:
            in_progress_clients.append(
                {
                    "client_pseudo_id": client_pseudo_id,
                    "processing_status": processing_status,
                }
            )

    return {"in_progress": in_progress_clients}
