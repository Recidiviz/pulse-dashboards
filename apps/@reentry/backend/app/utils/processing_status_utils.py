"""
Utility functions for computing processing status of intakes and clients.
"""

from datetime import datetime, timezone
from typing import Optional

import structlog
from sqlmodel import select

from app.core.db import AsyncSession
from app.crud.intake import get_intake_by_id
from app.models.execution import Execution
from app.models.models import Plan, PlanGeneration
from app.routes.shared_models import ProcessingStatus
from app.utils.execution_utils import is_execution_stuck

logger = structlog.getLogger(__name__)


def compute_processing_status(plans, intake, plan_generations=None) -> ProcessingStatus:
    """
    Compute aggregated processing status from  plans and intake.

    This function determines the overall processing status by examining:
    - Recording/transcription status (for transcription-based intakes)
    - Plan creation status
    - Plan generation status

    Args:
        plans: Plan object (or None)
        intake: Intake object (or None)
        plan_generations: Optional list of PlanGeneration objects

    Returns:
        ProcessingStatus enum value (NOT_STARTED, IN_PROGRESS, COMPLETED,
        NEEDS_RETRY, or FAILED)
    """
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
    elif recording_in_progress:
        logger.debug("Returning IN_PROGRESS - recording in progress")
        return ProcessingStatus.IN_PROGRESS

    # If plan creation is completed and nothing is in progress, overall status is completed
    if plans and plans.create_status == "completed":
        logger.debug(
            "Returning COMPLETED - plan create_status is completed and nothing in progress"
        )
        return ProcessingStatus.COMPLETED

    # If plan failed, needs retry
    if plans and plans.create_status == "failed":
        return ProcessingStatus.NEEDS_RETRY

    # Intake completed but no processing has started yet - processing should have started automatically, so this needs retry
    return ProcessingStatus.NEEDS_RETRY


async def compute_processing_status_by_intake_id(
    session: AsyncSession, intake_id: str
) -> ProcessingStatus | None:
    """
    Compute processing status for a specific intake by its ID.

    This function fetches all related data (intake, plan, generations)
    and delegates to compute_processing_status for the actual status computation.

    Args:
        session: The database session
        intake_id: The UUID of the intake

    Returns:
        ProcessingStatus enum value, or None if intake not found
    """
    # 1. Fetch intake
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        return None

    # 2. Fetch plan + execution
    plan_with_exec = await session.exec(
        select(Plan, Execution)
        .where(Plan.intake_id == intake_id)
        .outerjoin(Execution, Plan.create_execution_id == Execution.id)
    )
    plan_row = plan_with_exec.first()

    plan: Optional[Plan] = None
    if plan_row:
        plan, exec_data = plan_row
        plan.create_execution = exec_data

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
        plans=plan,
        intake=intake,
        plan_generations=generations,
    )
