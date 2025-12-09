"""
Tests for the assessment task functionality
============================================

This module tests the assessment task, which is responsible for:
- Determining assessment types from configs
- Loading assessment trees
- Processing different intake types (CONVERSATION, TRANSCRIPTION, None)
- Running assessment runners on trees
- Handling errors and edge cases
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import structlog

from app.crud.assessment import get_assessment_by_id
from app.crud.intake import create_intake
from app.models.assessment import Assessment
from app.models.assessment_tree import AssessmentTree, AssessmentTreeRevision, InputType
from app.models.base import IntakeType
from app.models.execution import Execution, ExecutionStatus
from app.tasks.assessment import assessment as assessment_task


# Helper function to create test assessment trees
async def create_test_assessment_tree(
    session,
    name: str,
    assessment_type: str,
    mermaid_content: str,
    input_data: list[str] | None = None,
    enabled: bool = True,
) -> AssessmentTree:
    """Helper to create test assessment tree with revision"""
    tree = AssessmentTree(
        name=name,
        assessment_type=assessment_type,
        enabled=enabled,
        current_revision_id=None,
    )
    session.add(tree)
    await session.commit()
    await session.refresh(tree)

    revision = AssessmentTreeRevision(
        assessment_tree_id=tree.id,
        mermaid_content=mermaid_content,
        additional_structured_data={},
        input_data=input_data or [],
        content_hash="",
    )
    session.add(revision)
    await session.commit()
    await session.refresh(revision)

    # Reload tree with revisions
    tree = await session.get(AssessmentTree, tree.id)
    return tree


# Simple mermaid content for tests
SIMPLE_MERMAID = """
graph TD
    A[Start: Assessment]
    A --> B{Q1}
    B --> C[End: Complete]
"""


@pytest.mark.asyncio
async def test_assessment_with_existing_type(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment task when assessment already has a type"""
    # Create intake and assessment with type
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    # Create execution
    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create test assessment tree
    await create_test_assessment_tree(
        session=async_session,
        name="Test Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    # Mock dependencies
    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        # Setup mocks
        mock_messages.return_value = [
            MagicMock(from_role="user", content="Hello"),
            MagicMock(from_role="assistant", content="Hi there"),
        ]

        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 5
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        # Create progress tracker
        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        # Run assessment
        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify assessment type was not changed
        updated_assessment = await get_assessment_by_id(async_session, assessment.id)
        assert updated_assessment.assessment_type == "lsir"

        # Verify update was called
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_without_type_determines_from_config(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment task determines type from config when not set"""
    # Get a test config
    config = seed_configs["assessments_by_state"]["US_AZ"]

    # Create intake with assessment config
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )
    # Set the assessment config ID
    intake.assessment_config_id = config.id
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create assessment WITHOUT type
    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    # Create execution
    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Mock dependencies
    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.tasks.assessment.get_assessment_trees", new_callable=AsyncMock
        ) as mock_trees,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 3
        mock_result.misses = 0
        mock_runner.return_value = mock_result
        mock_messages.return_value = []
        mock_trees.return_value = []

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        # Run assessment
        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify assessment type was set from config
        updated_assessment = await get_assessment_by_id(async_session, assessment.id)
        assert updated_assessment.assessment_type is not None

        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_with_conversation_intake(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment with CONVERSATION intake type"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create tree that requires intake conversation
    await create_test_assessment_tree(
        session=async_session,
        name="Conversation Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
        input_data=[InputType.INTAKE_CONVERSATION.value],
    )

    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        # Mock messages
        mock_messages.return_value = [
            MagicMock(from_role="user", content="I need help"),
            MagicMock(from_role="assistant", content="How can I help?"),
        ]

        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 3
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify messages were fetched
        mock_messages.assert_called_once_with(async_session, intake_id=intake.id)

        # Verify runner was called with formatted messages
        assert mock_runner.called
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_with_transcription_intake(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment with TRANSCRIPTION intake type"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake first
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.TRANSCRIPTION,
    )

    # Create a recording session with intake_id
    from app.models.recording import RecordingSession

    recording = RecordingSession(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
    )
    async_session.add(recording)
    await async_session.commit()
    await async_session.refresh(recording)

    # Refresh intake to load the relationship
    await async_session.refresh(intake)

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    await create_test_assessment_tree(
        session=async_session,
        name="Transcription Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    with (
        patch(
            "app.tasks.assessment.get_transcription_messages_from_gcp",
            new_callable=AsyncMock,
        ) as mock_transcription,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        # Mock transcription messages
        mock_transcription.return_value = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ]

        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 4
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify transcription messages were fetched
        mock_transcription.assert_called_once()
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_without_intake(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment without intake raises ValueError"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create assessment without intake
    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    progress = MagicMock()
    task_logger = structlog.get_logger(__name__)

    # Expect ValueError since intake is now required
    with pytest.raises(ValueError, match="Cannot run assessment: no intake found"):
        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )


@pytest.mark.asyncio
async def test_assessment_with_no_messages_filters_intake_trees(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test that trees requiring intake are filtered out when no messages exist"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create trees
    await create_test_assessment_tree(
        session=async_session,
        name="Intake Required",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
        input_data=[InputType.INTAKE_CONVERSATION.value],
    )

    await create_test_assessment_tree(
        session=async_session,
        name="No Intake Required",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
        input_data=[],
    )

    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        # Return no messages
        mock_messages.return_value = []

        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 1
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify only the tree without intake requirement was processed
        assert mock_runner.call_count == 1
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_handles_llm_errors(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment handles ValueError from incorrect LLM responses"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    await create_test_assessment_tree(
        session=async_session,
        name="Error Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_messages.return_value = [
            MagicMock(from_role="user", content="Test"),
        ]

        # Simulate LLM error
        mock_runner.side_effect = ValueError("Invalid LLM response")

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify update was still called (with empty results)
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_fails_with_no_results(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment status is set to FAILED when no results are produced"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Get a test config and create intake (now required)
    config = seed_configs["assessments_by_state"]["US_AZ"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )
    intake.assessment_config_id = config.id
    async_session.add(intake)
    await async_session.commit()

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Link execution to assessment
    assessment.execution_id = execution.id
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    # No trees will be created, so no results will be produced

    with (
        patch(
            "app.tasks.assessment.get_assessment_trees", new_callable=AsyncMock
        ) as mock_trees,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        # Return no trees
        mock_trees.return_value = []

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify assessment status was updated to FAILED
        updated_assessment = await get_assessment_by_id(async_session, assessment.id)
        assert updated_assessment.status == ExecutionStatus.FAILED
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_processes_multiple_trees(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test assessment processes multiple assessment trees"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create multiple trees
    await create_test_assessment_tree(
        session=async_session,
        name="Tree 1",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    await create_test_assessment_tree(
        session=async_session,
        name="Tree 2",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    await create_test_assessment_tree(
        session=async_session,
        name="Tree 3",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
    )

    with (
        patch(
            "app.crud.intake.get_intake_messages", new_callable=AsyncMock
        ) as mock_messages,
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_messages.return_value = [
            MagicMock(from_role="user", content="Test"),
        ]

        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 2
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify runner was called for each tree
        assert mock_runner.call_count == 3
        assert mock_update.called


@pytest.mark.asyncio
async def test_assessment_disabled_trees_not_processed(
    async_session,
    seed_configs,
    mock_clientdata_service,
):
    """Test that disabled assessment trees are not processed"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Get a test config and create intake (now required)
    config = seed_configs["assessments_by_state"]["US_AZ"]
    intake = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType.CONVERSATION,
    )
    intake.assessment_config_id = config.id
    async_session.add(intake)
    await async_session.commit()

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=intake.id,
        assessment_type="lsir",
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="assessment",
        table_entity_id=assessment.id,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create enabled tree
    await create_test_assessment_tree(
        session=async_session,
        name="Enabled Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
        enabled=True,
    )

    # Create disabled tree
    await create_test_assessment_tree(
        session=async_session,
        name="Disabled Tree",
        assessment_type="lsir",
        mermaid_content=SIMPLE_MERMAID,
        enabled=False,
    )

    with (
        patch(
            "app.utils.assessment_runner.AssessmentRunner.run_decision_tree",
            new_callable=AsyncMock,
        ) as mock_runner,
        patch(
            "app.crud.assessment.update_assessment_with_tree_results",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_result = MagicMock()
        mock_result.steps = [MagicMock(model_dump=lambda: {"node": "A"})]
        mock_result.final_score = 1
        mock_result.misses = 0
        mock_runner.return_value = mock_result

        progress = MagicMock()
        task_logger = structlog.get_logger(__name__)

        await assessment_task(
            execution=execution,
            assessment_id=assessment.id,
            progress=progress,
            session=async_session,
            task_logger=task_logger,
        )

        # Verify only the enabled tree was processed
        assert mock_runner.call_count == 1
        assert mock_update.called
