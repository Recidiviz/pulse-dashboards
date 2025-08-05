import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.models.execution import Execution, ExecutionStatus
from app.utils.intake_summary_runner import format_assessments_list


@pytest.mark.asyncio
async def test_assessment_to_str_unfinished(async_session: AsyncSession):
    """Test to_str method when assessment execution is not finished."""
    client_id = "test-client-id"
    assessment = Assessment(client_id=client_id)

    # Assessment has no execution, so is_execution_finished should be False
    assert assessment.to_str() is None


@pytest.mark.asyncio
async def test_assessment_to_str_no_scores(async_session: AsyncSession):
    """Test to_str method when assessment has finished but has no scores."""
    client_id = "test-client-id"

    # Create execution with completed status
    execution = Execution(
        status=ExecutionStatus.COMPLETED,
        table_name="assessmenttrees",
        task_kwargs={"assessment_id": str(uuid.uuid4())},
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create assessment with execution but no scores
    assessment = Assessment(
        client_id=client_id, execution_id=execution.id, execution=execution
    )

    assert assessment.to_str() is None


@pytest.mark.asyncio
async def test_assessment_to_str_with_scores(async_session: AsyncSession):
    """Test to_str method when assessment has finished and has scores."""
    client_id = "test-client-id"

    # Create execution with completed status
    execution = Execution(
        status=ExecutionStatus.COMPLETED,
        table_name="assessmenttrees",
        task_kwargs={"assessment_id": str(uuid.uuid4())},
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create assessment with execution and scores
    assessment = Assessment(
        client_id=client_id,
        execution_id=execution.id,
        execution=execution,
        scores={"tree1": 5, "tree2": 8},
        misses_counts={"tree1": 2, "tree2": 1},
    )

    result = assessment.to_str()
    assert result is not None
    assert "tree1: 5 (2 unanswered questions)" in result
    assert "tree2: 8 (1 unanswered questions)" in result


@pytest.mark.asyncio
async def test_format_assessments_list_empty():
    """Test format_assessments_list with empty list."""
    result = format_assessments_list([])
    assert result == "No assessments available."


@pytest.mark.asyncio
async def test_format_assessments_list(async_session: AsyncSession):
    """Test format_assessments_list with multiple assessments."""
    # Create execution with completed status
    execution = Execution(
        status=ExecutionStatus.COMPLETED,
        table_name="assessmenttrees",
        task_kwargs={"assessment_id": str(uuid.uuid4())},
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    # Create assessments
    assessment1 = Assessment(
        client_id="client-1",
        execution_id=execution.id,
        execution=execution,
        scores={"tree1": 5, "tree2": 8},
        misses_counts={"tree1": 2, "tree2": 1},
    )

    assessment2 = Assessment(client_id="client-2", execution_id=None, execution=None)

    result = format_assessments_list([assessment1, assessment2])

    assert "Assessments Summary:" in result
    assert "Assessment #1" in result
    assert "Client ID: client-1" in result
    assert "Status: completed" in result
    assert "tree1: 5 (2 unanswered questions)" in result

    assert "Assessment #2" in result
    assert "Client ID: client-2" in result
    assert "Status: not_started" in result
    assert "No scores available yet" in result
