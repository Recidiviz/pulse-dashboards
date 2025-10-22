"""
Assessment Task
========================


"""

from uuid import UUID

import structlog
from taskiq import TaskiqDepends
from taskiq.depends.progress_tracker import ProgressTracker

from app.core.db import AsyncSession, get_session
from app.crud.assessment import get_assessment_by_id
from app.crud.assessment_tree import get_assessment_trees
from app.models.assessment import Assessment
from app.models.assessment_tree import AssessmentTree, AssessmentTreeRevision, InputType
from app.models.execution import ExecutionStatus
from app.utils.assessment_runner import AssessmentRunner
from app.utils.mermaid import MermaidParser

from ..utils.transcription.transcription_messages import (
    get_transcription_messages_from_gcp,
)
from .base import broker
from .scheduler import Execution, execution_context

logger = structlog.get_logger(__name__)


@broker.task
async def assessment_task(
    execution_id: UUID,
    assessment_id: UUID,
    progress: ProgressTracker[int] = TaskiqDepends(),
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(
            execution_id=execution_id.hex, assessment_id=assessment_id.hex
        )

        await assessment(
            execution=execution,
            assessment_id=assessment_id,
            progress=progress,
            session=session,
            task_logger=task_logger,
        )


async def assessment(
    execution: Execution,
    assessment_id: UUID,
    progress: ProgressTracker[int],
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    from app.crud.intake import get_intake_messages
    from app.models.intake import IntakeType

    # Get the assessment
    task_logger.debug(assessment_id)
    assessment: Assessment = await get_assessment_by_id(
        session, assessment_id=assessment_id
    )

    # Check if assessment has an associated intake
    intake = None
    if assessment.intake_id:
        # Use the existing linked intake
        intake = assessment.intake
    else:
        # Try to find an intake for this client
        from app.crud.intake import get_intake_by_client_pseudo_id

        intake = await get_intake_by_client_pseudo_id(
            session, client_pseudo_id=assessment.client_pseudo_id
        )

    # Only proceed with trees that need intake data if an intake is present
    task_logger.debug("Checking for intake availability")
    has_intake = intake is not None

    # Determine assessment_type based on client's state if not already set
    if not assessment.assessment_type:
        task_logger.debug("Assessment type not set, determining from client state")
        from app.services.client_data.queries import Queries
        from app.utils.assessment_runner import get_assessments_type

        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            assessment.client_pseudo_id
        )
        assessments_types = get_assessments_type(client_record.state_code)
        assessment_type = assessments_types[0] if assessments_types else "lsir"

        task_logger.debug(f"Client state: {client_record.state_code}")
        task_logger.debug(f"Determined assessment type: {assessment_type}")

        # Update the assessment record with the determined type
        assessment.assessment_type = assessment_type
        session.add(assessment)
        await session.commit()
        await session.refresh(assessment)
    else:
        assessment_type = assessment.assessment_type
        task_logger.debug(f"Using existing assessment type: {assessment_type}")

    # load assessment trees
    task_logger.debug("Load enabled assessment trees")
    assessment_trees = await get_assessment_trees(
        session,
        assessment_type=assessment_type,
        include_revisions=True,
        filter_enabled=True,
    )
    task_logger.debug(f"Found {len(assessment_trees)} assessment trees")

    if has_intake:
        task_logger.debug(
            f"Using intake for assessment: id {intake.id} intake type {intake.intake_type}"
        )

        # Get all messages for this specific intake
        if intake.intake_type == IntakeType.CONVERSATION.value:
            messages = await get_intake_messages(session, intake_id=intake.id)

            # Check if we have any messages
            if not messages:
                task_logger.warning(f"No messages found for intake {intake.id}")
                # Skip intake-based assessment trees
                assessment_trees = [
                    tree
                    for tree in assessment_trees
                    if tree.revisions
                    and not any(
                        InputType.INTAKE_CONVERSATION.value in revision.input_data
                        for revision in tree.revisions
                    )
                ]
        elif intake.intake_type == IntakeType.TRANSCRIPTION.value:
            messages = await get_transcription_messages_from_gcp(
                intake.recording_session.id, session
            )
        elif intake.intake_type == IntakeType.EXTERNAL.value:
            messages = intake.external_chat_messages
    else:
        task_logger.debug("No intake available, skipping intake-based assessments")
        # Skip assessment trees that require intake conversations
        assessment_trees = [
            tree
            for tree in assessment_trees
            if tree.revisions
            and not any(
                InputType.INTAKE_CONVERSATION.value in revision.input_data
                for revision in tree.revisions
            )
        ]
        # Create empty messages list
        messages = []

    task_logger.debug(
        f"Will process {len(assessment_trees)} applicable assessment trees"
    )

    # Format messages for the assessment runner
    formatted_client_messages_list = []
    if intake and intake.intake_type == IntakeType.CONVERSATION.value:
        for message in messages:
            role = message.from_role
            content = message.content
            line = f"{role}: {content}"
            formatted_client_messages_list.append(line)
    elif intake and intake.intake_type == IntakeType.TRANSCRIPTION.value:
        try:
            formatted_client_messages_list = [
                f"{message['role']}: {message['content']}" for message in messages
            ]
        except TypeError as error:
            logger.error(
                "Error formatting messages for transcription-based assessment",
                error=error,
                messages=messages,
            )
    elif intake and intake.intake_type == IntakeType.EXTERNAL.value:
        for msg in messages:
            role = msg.get("from_role") or "unknown"
            content = msg.get("content")
            formatted_client_messages_list.append(f"{role}: {content}")

    formatted_client_messages = "\n".join(formatted_client_messages_list)

    step_results = {}
    score_results = {}
    misses_results = {}
    revisions = []
    # create
    for tree in assessment_trees:
        tree: AssessmentTree = tree
        revision = tree.revisions[-1]
        revisions.append(revision)
        if not isinstance(revision, AssessmentTreeRevision):
            # This should never happen, if the ORM works and we always create a revision.
            # I mostly check for later type hints
            logger.error("Assessment tree has an invalid latest revision", tree)
            logger.error("revision:", revision)
            raise RuntimeError("Couln not load tree revision")
        try:
            graph = MermaidParser.parse(
                revision.mermaid_content, revision.additional_structured_data
            )
            runner = AssessmentRunner(
                graph, formatted_client_messages, tree.assessment_type
            )
            result = await runner.run_decision_tree()
            step_results[tree.name] = [step.model_dump() for step in result.steps]
            score_results[tree.name] = result.final_score
            misses_results[tree.name] = result.misses
        except ValueError as e:
            ## TODO log this to sentry
            task_logger.debug(f"{tree.name} got an incorrect LLM response {e}")

    if len(list(step_results.values())) == 0:
        await assessment.update_status(session, ExecutionStatus.FAILED)

    from app.crud.assessment import update_assessment_with_tree_results

    return await update_assessment_with_tree_results(
        session=session,
        assessment=assessment,
        revisions=revisions,
        step_results=step_results,
        score_results=score_results,
        misses_results=misses_results,
    )
