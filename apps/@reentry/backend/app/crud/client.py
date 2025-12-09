from datetime import UTC, datetime, timedelta, timezone
from typing import Optional

import sqlalchemy
import structlog
from sqlmodel import select

from app.core.db import AsyncSession
from app.crud.intake import get_intake_by_id
from app.crud.utils import apply_search_filter, paginate, sort_clients_by_name
from app.models.assessment import Assessment
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

logger = structlog.getLogger(__name__)

# Timeout thresholds for stuck executions
PENDING_TIMEOUT_HOURS = 3
IN_PROGRESS_TIMEOUT_MINUTES = 30


def is_execution_stuck(execution: Execution) -> bool:
    """
    Check if an execution is stuck based on its status and how long it's been running.

    Returns True if:
    - Execution is PENDING for more than PENDING_TIMEOUT_HOURS (3 hours)
    - Execution is IN_PROGRESS for more than IN_PROGRESS_TIMEOUT_MINUTES (30 minutes)
    """
    if not execution or not execution.updated_at:
        return False

    now = datetime.now(UTC).replace(tzinfo=None)
    time_elapsed = now - execution.updated_at

    if execution.status == "pending":
        return time_elapsed > timedelta(hours=PENDING_TIMEOUT_HOURS)
    elif execution.status == "in_progress":
        return time_elapsed > timedelta(minutes=IN_PROGRESS_TIMEOUT_MINUTES)

    return False


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


def get_status_priority(status: str) -> int:
    priority_map = {
        "new": 0,
        "intake_enabled": 1,
        "intake_in_progress": 2,
        "processing": 3,
        "intake_complete": 4,
        "error": 5,
        "unknown": -1,
    }
    return priority_map.get(status, -1)


def compute_processing_status(
    assessments, plans, intake, plan_generations=None
) -> ProcessingStatus:
    """Compute aggregated processing status from assessments, plans, and intake"""

    # If no intake or intake not completed, processing hasn't started
    if not intake:
        logger.debug("Returning NOT_STARTED - intake not completed")
        return ProcessingStatus.NOT_STARTED

    # Check for stuck or failed executions in recording/transcription (for transcription-based intakes)
    if intake.recording_session:
        if intake.recording_session.execution:
            if is_execution_stuck(intake.recording_session.execution):
                logger.info(
                    "Recording execution %s is stuck",
                    intake.recording_session.execution.id,
                )
                return ProcessingStatus.NEEDS_RETRY
            if intake.recording_session.execution.status == "failed":
                logger.debug(
                    "Recording execution %s failed",
                    intake.recording_session.execution.id,
                )
                return ProcessingStatus.NEEDS_RETRY
        # Also check recording status itself
        if intake.recording_session.status == "error":
            logger.debug(
                "Recording session %s has error status", intake.recording_session.id
            )
            return ProcessingStatus.NEEDS_RETRY
    # If no intake or intake not completed, processing hasn't started
    if not intake or intake.status != "completed":
        logger.debug("Returning NOT_STARTED - intake not completed")
        return ProcessingStatus.NOT_STARTED

    # Check for stuck executions in assessments
    if assessments:
        for assessment in assessments:
            if assessment.execution and is_execution_stuck(assessment.execution):
                logger.debug(
                    "Assessment execution %s is stuck", assessment.execution.id
                )
                return ProcessingStatus.NEEDS_RETRY

    # Check for stuck executions in plan
    if plans and plans.create_execution and is_execution_stuck(plans.create_execution):
        logger.debug("Plan execution %s is stuck", plans.create_execution.id)
        return ProcessingStatus.NEEDS_RETRY

    # Check for stuck or failed executions in plan generations
    if plan_generations:
        sorted_generations = sorted(
            plan_generations,
            key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        latest_generation = sorted_generations[0] if sorted_generations else None
        if latest_generation and latest_generation.execution:
            if is_execution_stuck(latest_generation.execution):
                logger.debug(
                    "Plan generation execution %s is stuck",
                    latest_generation.execution.id,
                )
                return ProcessingStatus.NEEDS_RETRY
            if latest_generation.execution.status == "failed":
                logger.debug(
                    "Plan generation execution %s failed",
                    latest_generation.execution.id,
                )
                return ProcessingStatus.NEEDS_RETRY

    # Check for any in-progress work FIRST (before checking if plan is completed)
    plan_in_progress = plans and plans.create_status in ["in_progress", "pending"]

    assessments_in_progress = assessments and any(
        a.status in ["in_progress", "pending"] for a in assessments
    )

    # Check if recording is in progress (not stuck, not failed)
    recording_in_progress = False
    if intake.recording_session and intake.recording_session.execution:
        exec_status = intake.recording_session.execution.status
        if exec_status in ["in_progress", "pending"]:
            # Only consider in progress if not stuck
            if not is_execution_stuck(intake.recording_session.execution):
                recording_in_progress = True

    # Check if the LATEST plan generation is in progress (not all generations)
    generations_in_progress = False
    if plan_generations:
        logger.debug("Checking %d plan generations", len(plan_generations))

        # Sort generations by created_at to get the latest one
        sorted_generations = sorted(
            plan_generations,
            key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        latest_generation = sorted_generations[0] if sorted_generations else None

        if latest_generation:
            execution = latest_generation.execution
            execution_status = execution.status if execution else None
            logger.debug(
                "Latest generation %s execution status: %s",
                latest_generation.id,
                execution_status,
            )

            generations_in_progress = (
                execution_status in ["in_progress", "pending"]
                if execution_status
                else False
            )

        logger.debug("Latest generation in progress: %s", generations_in_progress)

    # Return IN_PROGRESS if anything is actively running (highest priority)
    if plan_in_progress or generations_in_progress:
        logger.debug(
            "Returning IN_PROGRESS - plan_in_progress: %s, generations_in_progress: %s",
            plan_in_progress,
            generations_in_progress,
        )
        return ProcessingStatus.IN_PROGRESS
    elif assessments_in_progress:
        logger.debug("Returning IN_PROGRESS - assessments in progress")
        return ProcessingStatus.IN_PROGRESS
    elif recording_in_progress:
        logger.debug("Returning IN_PROGRESS - recording in progress")
        return ProcessingStatus.IN_PROGRESS

    # If plan creation is completed and nothing is in progress, overall status is completed
    if plans and plans.create_status == "completed":
        logger.debug(
            "Returning COMPLETED - plan create_status is completed and nothing in progress"
        )
        return ProcessingStatus.COMPLETED

    # Check if we have completed assessments
    has_completed_assessments = assessments and any(
        a.status == "completed" for a in assessments
    )

    # Check if we have any failed assessments
    has_failed_assessments = assessments and any(
        a.status == "failed" for a in assessments
    )

    # If plan failed and we have completed assessments, needs retry
    if has_completed_assessments and plans and plans.create_status == "failed":
        return ProcessingStatus.NEEDS_RETRY

    # If all assessments failed, needs retry
    if assessments and all(a.status == "failed" for a in assessments):
        return ProcessingStatus.NEEDS_RETRY

    # If any assessments failed (but not all), needs retry
    # This handles the case where some assessments completed but others failed
    if has_failed_assessments:
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

    if status_filter or sort_by == "status":
        # TODO change this so we use the database status index.
        sorted_clients = await compute_priority_order(bq_clients, session)
        full_response = await build_response_for_clients(
            sorted_clients, session, 1, len(sorted_clients)
        )

        # filtering still require information about intake and plan
        # that for now, we don't do database filtering.
        filtered_or_sorted_items = []
        if status_filter:
            for item in full_response["items"]:
                intake_status = item["intake"]["status"] if item["intake"] else None
                frontend_status = compute_frontend_status(
                    intake_status, item["processing_status"]
                )
                if frontend_status == status_filter:
                    filtered_or_sorted_items.append(item)
        elif sort_by == "status":
            filtered_or_sorted_items = [
                c
                for c in sorted(
                    full_response["items"],
                    key=lambda c: get_status_priority(
                        compute_frontend_status(
                            c.get("intake", {}).get("status")
                            if c.get("intake")
                            else None,
                            c.get("processing_status"),
                        ).lower()
                    ),
                    reverse=(sort_order == "desc"),
                )
            ]

        start = (page - 1) * page_size
        end = start + page_size

        return {
            "items": filtered_or_sorted_items[start:end],
            "total": len(filtered_or_sorted_items),
            "page": page,
            "size": page_size,
            "pages": (
                (len(filtered_or_sorted_items) + page_size - 1) // page_size
                if filtered_or_sorted_items
                else 0
            ),
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
    stmt = sqlalchemy.text(
        f"""
        SELECT DISTINCT client_pseudo_id, MIN(process_stage_order) as min_order
        FROM client_view
        WHERE client_pseudo_id IN ({placeholders})
        GROUP BY client_pseudo_id
        ORDER BY min_order ASC
    """
    )

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


async def compute_processing_status_by_intake_id(session, intake_id: str):
    # 1. Fetch intake
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        return None

    client_pseudo_id = intake.client_pseudo_id

    # 2. Fetch plan + execution
    plan_with_exec = await session.exec(
        select(Plan, Execution)
        .where(Plan.client_pseudo_id == client_pseudo_id)
        .outerjoin(Execution, Plan.create_execution_id == Execution.id)
    )
    plan_row = plan_with_exec.first()

    plan: Optional[Plan] = None
    if plan_row:
        plan, exec_data = plan_row
        plan.create_execution = exec_data

    # 3. Fetch assessments + executions
    assessments_with_execs = await session.exec(
        select(Assessment, Execution)
        .where(Assessment.client_pseudo_id == client_pseudo_id)
        .outerjoin(Execution, Assessment.execution_id == Execution.id)
    )

    assessments = []
    for a, e in assessments_with_execs:
        a.execution = e
        assessments.append(a)

    # 4. Fetch generations for this plan
    generations = []
    if plan:
        generations_with_execs = await session.exec(
            select(PlanGeneration, Execution)
            .where(PlanGeneration.plan_id == plan.id)
            .outerjoin(Execution, PlanGeneration.execution_id == Execution.id)
        )
        for generation, execution in generations_with_execs:
            generation.execution = execution
            generations.append(generation)

    return compute_processing_status(
        assessments=assessments,
        plans=plan,
        intake=intake,
        plan_generations=generations,
    )


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
        intake_stmt = sqlalchemy.text(
            f"""
            SELECT client_pseudo_id
            FROM intake
            WHERE client_pseudo_id IN ({placeholders}) AND status = 'completed'
        """
        )

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


async def get_processing_status(
    session: AsyncSession,
    staff_pseudo_id: str | None,
) -> dict[str, ProcessingStatus]:
    """Return a map of client_pseudo_id -> ProcessingStatus for the given staff member."""

    if not staff_pseudo_id:
        return {}

    try:
        staff_clients = (
            Queries.get_clients_by_pseudonymized_staff_id(staff_pseudo_id) or []
        )
    except Exception:
        return {}

    if not staff_clients:
        return {}

    response = await build_response_for_clients(
        staff_clients, session, 1, len(staff_clients)
    )

    return {
        item["client_pseudo_id"]: item["processing_status"]
        for item in response.get("items", [])
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

    for intake in intakes_list:
        await session.delete(intake)
        total_deleted += 1

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

    assessments = await session.exec(
        select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    )
    for assessment in assessments.all():
        await session.delete(assessment)
        total_deleted += 1

    return total_deleted
