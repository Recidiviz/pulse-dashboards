"""
Initial plan creation
=====================

"""

import json
from uuid import UUID

import structlog
from taskiq import TaskiqDepends
from taskiq.depends.progress_tracker import ProgressTracker

from app.core.db import AsyncSession, get_session
from app.crud.assessment import get_assessments_by_intake_id
from app.crud.intake import get_intake_by_client_pseudo_id, get_intake_messages
from app.crud.plan import Plan, get_plan_by_id
from app.crud.plan_asset import PlanAsset, get_asset_by_filename
from app.crud.plan_decision_tree import get_plan_decision_tree_by_plan_id
from app.crud.plan_generation import PlanGeneration, create_plan_generation
from app.utils.intake_summary_runner import generate_summary

from ..models.intake import IntakeType
from ..utils.transcription.transcription_messages import (
    get_transcription_messages_from_gcp,
)
from .action_plan import ensure_tree_execution_task
from .base import broker
from .scheduler import Execution, execution_context

logger = structlog.get_logger(__name__)

TIMEOUT_EXECUTION_DT = 5 * 60


async def fetch_assets(
    session: AsyncSession,
    plan: Plan,
    task_logger: structlog.BoundLogger,
):
    task_logger.info("Fetching intake for client")
    intake = await get_intake_by_client_pseudo_id(
        session, client_pseudo_id=plan.client_pseudo_id
    )
    if not intake:
        task_logger.error(
            f"No intake found for client_pseudo_id {plan.client_pseudo_id}"
        )
        raise ValueError(
            f"No intake found for client_pseudo_id {plan.client_pseudo_id}"
        )

    task_logger.info(
        f"Fetching messages from database id {intake.id} intake type: {intake.intake_type}"
    )

    if intake.intake_type == IntakeType.CONVERSATION.value:
        intake_messages = await get_intake_messages(session, intake_id=intake.id)
    elif intake.intake_type == IntakeType.TRANSCRIPTION.value:
        task_logger.info("Intake type is transcription, fetching messages")
        intake_messages = await get_transcription_messages_from_gcp(
            intake.recording_session.id, session
        )
    elif intake.intake_type == IntakeType.EXTERNAL.value:
        intake_messages = intake.external_chat_messages

    if not intake_messages:
        task_logger.error(f"No messages found for intake {intake.id}")
        raise ValueError(f"No messages found for intake {intake.id}")

    task_logger.debug("Got messages", count=len(intake_messages))

    # Convert to JSON-serializable format for storage
    # todo: we need to modify the messages format to be alinged in both cases, for one of them we are use "caseworker" as role, for the other one we use "assistant"
    messages_json = []
    formatted_messages = ""
    if intake.intake_type == IntakeType.CONVERSATION.value:
        # messages format used to save the messages.json file
        for msg in intake_messages:
            messages_json.append(
                {"role": msg.from_role, "content": msg.content, "section": msg.section}
            )

        # messages format to be used in the summary generation
        formatted_messages_list = []
        for msg in intake_messages:
            role = "client" if msg.from_role == "client" else "assistant"
            formatted_messages_list.append(f'{role}: "{msg.content}"')
        formatted_messages = "\n".join(formatted_messages_list)
    elif intake.intake_type == IntakeType.TRANSCRIPTION.value:
        messages_json = intake_messages
        try:
            formatted_client_messages_list = [
                f"{'client' if message['role'] == 'client' else 'assistant' }: {message['content']}"
                for message in intake_messages
            ]
            formatted_messages = "\n".join(formatted_client_messages_list)
        except TypeError as error:
            logger.error(
                "Error formatting messages for transcription-based intake in plan creation",
                error=error,
                messages=intake_messages,
            )
    elif intake.intake_type == IntakeType.EXTERNAL.value:
        try:
            formatted_messages_list = []
            for msg in intake_messages:
                role = msg.get("role") or msg.get("from_role") or "assistant"
                role_norm = "client" if role == "client" else "assistant"
                formatted_messages_list.append(
                    f'{role_norm}: "{msg.get("content", "").strip()}"'
                )
            formatted_messages = "\n".join(formatted_messages_list)
            task_logger.info(
                "Formatted messages for EXTERNAL intake", messages=intake_messages
            )
        except TypeError as error:
            logger.error(
                "Error formatting messages for external-based intake in plan creation",
                error=error,
                messages=intake_messages,
            )

    task_logger.info("Generating summary from intake messages")

    # Fetch assessments related to this intake
    task_logger.info("Fetching assessments for intake")
    assessments = await get_assessments_by_intake_id(session, intake_id=intake.id)
    task_logger.info(f"Assessments query result: {assessments}")

    # If no assessments found by intake_id, try by client_pseudo_id as fallback
    if not assessments:
        task_logger.info("No assessments found by intake_id, trying client_pseudo_id")
        from app.crud.assessment import get_assessments_by_client_pseudo_id

        assessments = await get_assessments_by_client_pseudo_id(
            session, client_pseudo_id=plan.client_pseudo_id
        )
        task_logger.info(f"Assessments by client_pseudo_id query result: {assessments}")

    if assessments:
        task_logger.info(
            f"Found {len(assessments)} assessment(s) for intake {intake.id}"
        )

        # Check if assessments.json already exists
        existing_assessments_asset = await get_asset_by_filename(
            session, plan.id, "assessments.json"
        )
        if not existing_assessments_asset or not existing_assessments_asset.file_blob:
            # Convert assessment data to JSON for storage
            assessments_json = []
            for assessment in assessments:
                assessment_data = {
                    "id": str(assessment.id),
                    "client_pseudo_id": assessment.client_pseudo_id,
                    "scores": assessment.scores,
                    "runs_steps": assessment.runs_steps,
                    "misses_counts": assessment.misses_counts,
                    "status": assessment.status,
                }
                assessments_json.append(assessment_data)

            # Store assessments as a plan asset
            asset_assessments_json = PlanAsset(
                plan_id=plan.id,
                filename="assessments.json",
                file_blob=json.dumps(assessments_json).encode("utf8"),
                mimetype="application/json",
            )
            session.add(asset_assessments_json)
            task_logger.info("Created assessments.json asset")
        else:
            task_logger.info("Reusing existing assessments.json asset")
    else:
        task_logger.info(f"No assessments found for intake {intake.id}")

    # Check if summary already exists before generating
    existing_summary_asset = await get_asset_by_filename(session, plan.id, "summary.md")
    if not existing_summary_asset or not existing_summary_asset.file_blob:
        task_logger.info("Generating new summary")
        summary, assessment = await generate_summary(
            formatted_messages, assessments or []
        )
        task_logger.debug("Generated summary", summary=summary)
    else:
        task_logger.info("Reusing existing summary.md asset, skipping generation")
        summary = None  # Don't create new summary assets
        assessment = None

    # Check if messages.json already exists
    if messages_json:
        existing_messages_asset = await get_asset_by_filename(
            session, plan.id, "messages.json"
        )
        if not existing_messages_asset or not existing_messages_asset.file_blob:
            asset_intake_json = PlanAsset(
                plan_id=plan.id,
                filename="messages.json",
                file_blob=json.dumps(messages_json).encode("utf8"),
                mimetype="application/json",
            )
            session.add(asset_intake_json)
            task_logger.info("Created messages.json asset")
        else:
            task_logger.info("Reusing existing messages.json asset")

    if summary:
        asset_summary_json = PlanAsset(
            plan_id=plan.id,
            filename="summary.md",
            file_blob=summary.encode("utf8"),
            mimetype="text/markdown",
        )
        session.add(asset_summary_json)
        task_logger.info("Created summary.md asset")

        if assessment:
            asset_assessment_summary_md = PlanAsset(
                plan_id=plan.id,
                filename="assessment_summary.md",
                file_blob=assessment.encode("utf8"),
                mimetype="text/markdown",
            )
            session.add(asset_assessment_summary_md)
            task_logger.info("Created assessment_summary.md asset")
    else:
        task_logger.info("Skipped creating summary assets (reusing existing)")

    await session.commit()


async def select_decision_trees(
    session: AsyncSession, plan: Plan, task_logger: structlog.BoundLogger
):
    task_logger.info("Selecting decision trees")
    execution = await plan.schedule_plan_decision_tree_select(session)

    task_logger.info("Wait for decision tree selection")
    await execution.wait(session=session, timeout=TIMEOUT_EXECUTION_DT)

    if execution.is_failed:
        logger.warning("Decision tree selection failed")


async def run_action_plan_generation(
    session: AsyncSession,
    plan: Plan,
    task_logger: structlog.BoundLogger,
):
    # create a generation
    gen = PlanGeneration(plan_id=plan.id)
    gen = await create_plan_generation(session, plan_generation=gen)

    task_logger.info("Run Action Plan generation")
    execution = await gen.schedule_execution(session)

    task_logger.info("Wait for Action Plan generation")
    await execution.wait(session=session, timeout=TIMEOUT_EXECUTION_DT)

    if execution.is_failed:
        raise ValueError("Action Plan generation failed")


@broker.task
async def plan_create_task(
    execution_id: UUID,
    plan_id: UUID,
    progress: ProgressTracker[int] = TaskiqDepends(),
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(
            execution_id=execution_id.hex,
            plan_id=plan_id.hex,
        )
        await plan_create(
            execution=execution,
            plan_id=plan_id,
            progress=progress,
            session=session,
            task_logger=task_logger,
        )


async def plan_create(
    execution: Execution,
    plan_id: UUID,
    progress: ProgressTracker[int],
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
    include_decision_tree: bool = True,
):
    task_logger.info("Create the initial plan")
    await execution.log_progress(session, 1, "Fetching plan", logger=task_logger)
    plan = await get_plan_by_id(
        session,
        plan_id=plan_id,
    )
    if not plan:
        raise ValueError(f"Plan with id {plan_id} not found")

    # fetch assets
    await execution.log_progress(session, 10, "Fetching assets", logger=task_logger)
    await fetch_assets(session=session, plan=plan, task_logger=task_logger)

    # select decision trees
    if include_decision_tree:
        await execution.log_progress(
            session, 20, "Selecting decision trees", logger=task_logger
        )
        await select_decision_trees(
            session=session,
            plan=plan,
            task_logger=task_logger,
        )

    # execute all selected decision trees
    plan_decision_trees = await get_plan_decision_tree_by_plan_id(
        session,
        plan_id=plan.id,
        with_decision_tree=True,
    )
    if plan_decision_trees:
        progress = 40
        for plan_decision_tree in plan_decision_trees:
            await execution.log_progress(
                session,
                progress,
                f"Running decision tree {plan_decision_tree.decision_tree.name}",
                logger=task_logger,
            )
            await ensure_tree_execution_task(
                session,
                task_logger=task_logger,
                plan_decision_tree=plan_decision_tree,
            )
            progress += 1

    # now run the plan generation
    await execution.log_progress(
        session, 60, "Generating the action plan", logger=task_logger
    )
    await run_action_plan_generation(
        session,
        plan=plan,
        task_logger=task_logger,
    )

    task_logger.info("Plan created !")
