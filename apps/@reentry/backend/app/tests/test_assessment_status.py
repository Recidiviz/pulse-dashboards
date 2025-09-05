from unittest.mock import AsyncMock, patch

import pytest

from app.models.assessment import Assessment
from app.models.execution import Execution, ExecutionStatus

pytestmark = pytest.mark.asyncio


@patch("app.models.assessment.Assessment.schedule_plan_generation")
async def test_assessment_update_status(mock_schedule_plan):
    """
    Test that update_status correctly updates the execution status
    """
    # Setup
    session = AsyncMock()
    execution = Execution(status=ExecutionStatus.IN_PROGRESS.value)
    assessment = Assessment(client_pseudo_id="test_client")
    assessment.execution = execution

    # For test simplicity, mock the schedule_plan_generation to avoid db calls
    mock_schedule_plan.return_value = None

    # Act
    await assessment.update_status(session, ExecutionStatus.COMPLETED.value)

    # Assert
    assert execution.status == ExecutionStatus.COMPLETED.value
    session.add.assert_called()
    session.commit.assert_called_once()
    session.refresh.assert_called_once()


@patch("app.models.assessment.Assessment.schedule_plan_generation")
async def test_assessment_update_status_triggers_plan_generation(mock_schedule_plan):
    """
    Test that update_status correctly triggers plan generation
    when status is COMPLETED
    """
    # Setup
    session = AsyncMock()
    execution = Execution(status=ExecutionStatus.IN_PROGRESS.value)
    assessment = Assessment(client_pseudo_id="test_client")
    assessment.execution = execution

    # Act
    await assessment.update_status(session, ExecutionStatus.COMPLETED.value)

    # Assert
    mock_schedule_plan.assert_called_once_with(session)


@patch("app.models.assessment.Assessment.schedule_plan_generation")
async def test_assessment_update_status_does_not_trigger_plan_when_not_completed(
    mock_schedule_plan,
):
    """
    Test that update_status doesn't trigger plan generation
    when status is not COMPLETED
    """
    # Setup
    session = AsyncMock()
    execution = Execution(status=ExecutionStatus.IN_PROGRESS.value)
    assessment = Assessment(client_pseudo_id="test_client")
    assessment.execution = execution

    # Act
    await assessment.update_status(session, ExecutionStatus.FAILED.value)

    # Assert
    mock_schedule_plan.assert_not_called()


@patch("app.crud.plan.get_plan_by_client_pseudo_id")
@patch("app.crud.plan.create_plan")
async def test_schedule_plan_generation_creates_new_plan(
    mock_create_plan, mock_get_plan
):
    """
    Test that schedule_plan_generation creates a new plan when none exists
    """
    # Setup
    session = AsyncMock()
    execution = Execution(status=ExecutionStatus.COMPLETED.value)
    assessment = Assessment(client_pseudo_id="test_client")
    assessment.execution = execution

    # Configure mocks
    mock_get_plan.return_value = None
    mock_created_plan = AsyncMock()
    mock_create_plan.return_value = mock_created_plan

    # Act
    await assessment.schedule_plan_generation(session)

    # Assert
    mock_get_plan.assert_called_once_with(session, "test_client")
    mock_create_plan.assert_called_once()
    mock_created_plan.schedule_initial_creation.assert_called_once_with(session)


@patch("app.crud.plan.get_plan_by_client_pseudo_id")
@patch("app.crud.plan.create_plan")
async def test_schedule_plan_generation_uses_existing_plan(
    mock_create_plan, mock_get_plan
):
    """
    Test that schedule_plan_generation uses existing plan when one exists
    """
    # Setup
    session = AsyncMock()
    execution = Execution(status=ExecutionStatus.COMPLETED.value)
    assessment = Assessment(client_pseudo_id="test_client")
    assessment.execution = execution

    # Configure mocks
    existing_plan = AsyncMock()
    existing_plan.id = "existing-plan-id"
    mock_get_plan.return_value = existing_plan

    # Act
    result = await assessment.schedule_plan_generation(session)

    # Assert
    mock_get_plan.assert_called_once_with(session, "test_client")
    mock_create_plan.assert_not_called()
    assert result == "existing-plan-id"
