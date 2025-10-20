"""
Clean, systematic tests for processing status detection and retry functionality.

Test matrix:
- Entities: assessment, plan, recording, plan_generation
- Scenarios: stuck_pending, stuck_in_progress, failed, healthy_pending, healthy_in_progress, missing_entity, missing_execution

Rules:
- stuck_pending, stuck_in_progress, failed, missing_entity, missing_execution → NEEDS_RETRY + retry succeeds
- healthy_pending, healthy_in_progress → IN_PROGRESS + retry returns 400 error
"""

from datetime import UTC, datetime, timedelta
from typing import Literal, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.client import get_processing_status
from app.models.assessment import Assessment
from app.models.intake import Intake, IntakeStatus
from app.models.models import Execution, Plan, PlanGeneration
from app.models.recording import RecordingSession
from app.routes.shared_models import ProcessingStatus


class TestCase:
    """Defines a test scenario."""

    def __init__(
        self,
        entity_type: Literal["assessment", "plan", "recording", "plan_generation"],
        scenario: Literal[
            "stuck_pending",
            "stuck_in_progress",
            "failed",
            "healthy_pending",
            "healthy_in_progress",
            "missing_entity",
            "missing_execution",
        ],
    ):
        self.entity_type = entity_type
        self.scenario = scenario
        self.id = f"{scenario}_{entity_type}"
        self.description = (
            f"{entity_type.replace('_', ' ').title()} - {scenario.replace('_', ' ')}"
        )

    @property
    def expected_status(self) -> ProcessingStatus:
        """Derive expected processing status from scenario."""
        # Special case: plan generations are user-initiated, so missing/missing_execution = COMPLETED
        if self.entity_type == "plan_generation" and self.scenario in [
            "missing_entity",
            "missing_execution",
        ]:
            return ProcessingStatus.COMPLETED

        if self.scenario in [
            "stuck_pending",
            "stuck_in_progress",
            "failed",
            "missing_entity",
            "missing_execution",
        ]:
            return ProcessingStatus.NEEDS_RETRY
        else:  # healthy_pending, healthy_in_progress
            return ProcessingStatus.IN_PROGRESS

    @property
    def should_retry(self) -> bool:
        """Derive whether retry should work from scenario."""
        return self.expected_status == ProcessingStatus.NEEDS_RETRY

    @property
    def time_elapsed_minutes(self) -> int:
        """Time elapsed for this scenario."""
        if self.scenario == "stuck_pending":
            return 4 * 60  # 4 hours (>3 hour threshold)
        elif self.scenario == "stuck_in_progress":
            return 45  # 45 minutes (>30 min threshold)
        elif self.scenario == "healthy_pending":
            return 60  # 1 hour (<3 hour threshold)
        elif self.scenario == "healthy_in_progress":
            return 10  # 10 minutes (<30 min threshold)
        else:  # failed, missing_entity, missing_execution
            return 10  # doesn't matter


# Generate all test cases
TEST_CASES = [
    TestCase(entity, scenario)
    for entity in ["assessment", "plan", "recording", "plan_generation"]
    for scenario in [
        "stuck_pending",
        "stuck_in_progress",
        "failed",
        "healthy_pending",
        "healthy_in_progress",
        "missing_entity",
        "missing_execution",
    ]
]


def get_execution_status(scenario: str) -> Optional[str]:
    """Map scenario to execution status."""
    if scenario in ["stuck_pending", "healthy_pending"]:
        return "pending"
    elif scenario in ["stuck_in_progress", "healthy_in_progress"]:
        return "in_progress"
    elif scenario == "failed":
        return "failed"
    elif scenario in ["missing_entity", "missing_execution"]:
        return None  # No execution or no entity
    else:
        raise ValueError(f"Unknown scenario: {scenario}")


async def setup_test_scenario(
    async_session: AsyncSession, test_case: TestCase, client_pseudo_id: str
) -> tuple[
    Intake,
    Optional[Assessment],
    Optional[Plan],
    Optional[RecordingSession],
    Optional[PlanGeneration],
]:
    """
    Set up database entities for a test scenario.

    Strategy:
    1. Always create completed intake
    2. For each entity type, create prerequisites first
    3. Handle scenario (missing_entity, missing_execution, or create with execution)
    """
    # Always create completed intake
    intake = Intake(client_pseudo_id=client_pseudo_id, status=IntakeStatus.COMPLETED)
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    assessment = None
    plan = None
    recording = None
    plan_generation = None

    time_ago = (
        datetime.now(UTC) - timedelta(minutes=test_case.time_elapsed_minutes)
    ).replace(tzinfo=None)
    execution_status = get_execution_status(test_case.scenario)

    # === ASSESSMENT ===
    if test_case.entity_type == "assessment":
        if test_case.scenario == "missing_entity":
            # Don't create assessment at all
            pass
        elif test_case.scenario == "missing_execution":
            # Create assessment without execution
            assessment = Assessment(
                client_pseudo_id=client_pseudo_id,
                intake_id=intake.id,
                execution_id=None,
            )
            async_session.add(assessment)
            await async_session.commit()
        else:
            # Create assessment with execution
            execution = Execution(
                status=execution_status,
                created_at=time_ago,
                updated_at=time_ago,
                task_id=f"test-task-{test_case.id}",
                table_name="assessment",
                table_entity_id=None,
            )
            async_session.add(execution)
            await async_session.commit()
            await async_session.refresh(execution)

            assessment = Assessment(
                client_pseudo_id=client_pseudo_id,
                execution_id=execution.id,
                intake_id=intake.id,
            )
            async_session.add(assessment)
            await async_session.commit()
            await async_session.refresh(assessment)

            execution.table_entity_id = assessment.id
            async_session.add(execution)
            await async_session.commit()

    # === PLAN ===
    elif test_case.entity_type == "plan":
        # Create prerequisite: completed assessment
        assess_exec = Execution(status="completed")
        async_session.add(assess_exec)
        await async_session.commit()

        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            execution_id=assess_exec.id,
            intake_id=intake.id,
            status="completed",
        )
        async_session.add(assessment)
        await async_session.commit()

        if test_case.scenario == "missing_entity":
            # Don't create plan at all
            pass
        elif test_case.scenario == "missing_execution":
            # Create plan without execution
            plan = Plan(client_pseudo_id=client_pseudo_id, create_execution_id=None)
            async_session.add(plan)
            await async_session.commit()
        else:
            # Create plan with execution
            plan_exec = Execution(
                status=execution_status,
                created_at=time_ago,
                updated_at=time_ago,
                task_id=f"test-task-{test_case.id}",
                table_name="plan",
                table_entity_id=None,
            )
            async_session.add(plan_exec)
            await async_session.commit()
            await async_session.refresh(plan_exec)

            plan = Plan(
                client_pseudo_id=client_pseudo_id, create_execution_id=plan_exec.id
            )
            async_session.add(plan)
            await async_session.commit()
            await async_session.refresh(plan)

            plan_exec.table_entity_id = plan.id
            async_session.add(plan_exec)
            await async_session.commit()

    # === RECORDING ===
    elif test_case.entity_type == "recording":
        if test_case.scenario == "missing_entity":
            # Don't create recording at all
            pass
        elif test_case.scenario == "missing_execution":
            # Create recording without execution
            recording = RecordingSession(
                intake_id=intake.id,
                client_pseudo_id=client_pseudo_id,
                execution_id=None,
                status="processing",
                last_chunk_timestamp=0,
            )
            async_session.add(recording)
            await async_session.commit()
        else:
            # Create recording with execution
            recording_exec = Execution(
                status=execution_status,
                created_at=time_ago,
                updated_at=time_ago,
                task_id=f"test-task-{test_case.id}",
                table_name="recording_session",
                table_entity_id=None,
            )
            async_session.add(recording_exec)
            await async_session.commit()
            await async_session.refresh(recording_exec)

            recording_status = "error" if execution_status == "failed" else "processing"
            recording = RecordingSession(
                intake_id=intake.id,
                client_pseudo_id=client_pseudo_id,
                execution_id=recording_exec.id,
                status=recording_status,
                last_chunk_timestamp=0,
            )
            async_session.add(recording)
            await async_session.commit()
            await async_session.refresh(recording)

            recording_exec.table_entity_id = recording.id
            async_session.add(recording_exec)
            await async_session.commit()

    # === PLAN GENERATION ===
    elif test_case.entity_type == "plan_generation":
        # Create prerequisites: completed assessment and completed plan
        assess_exec = Execution(status="completed")
        async_session.add(assess_exec)
        await async_session.commit()

        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            execution_id=assess_exec.id,
            intake_id=intake.id,
            status="completed",
        )
        async_session.add(assessment)
        await async_session.commit()

        plan_exec = Execution(status="completed")
        async_session.add(plan_exec)
        await async_session.commit()

        plan = Plan(
            client_pseudo_id=client_pseudo_id,
            create_execution_id=plan_exec.id,
            create_status="completed",
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        if test_case.scenario == "missing_entity":
            # Don't create plan generation at all
            pass
        elif test_case.scenario == "missing_execution":
            # Create plan generation without execution
            plan_generation = PlanGeneration(
                plan_id=plan.id,
                execution_id=None,
                prompt="Test prompt",
            )
            async_session.add(plan_generation)
            await async_session.commit()
        else:
            # Create plan generation with execution
            gen_exec = Execution(
                status=execution_status,
                created_at=time_ago,
                updated_at=time_ago,
                task_id=f"test-task-{test_case.id}",
                table_name="plan_generation",
                table_entity_id=None,
            )
            async_session.add(gen_exec)
            await async_session.commit()
            await async_session.refresh(gen_exec)

            plan_generation = PlanGeneration(
                plan_id=plan.id,
                execution_id=gen_exec.id,
                prompt="Test prompt",
            )
            async_session.add(plan_generation)
            await async_session.commit()
            await async_session.refresh(plan_generation)

            gen_exec.table_entity_id = plan_generation.id
            async_session.add(gen_exec)
            await async_session.commit()

    return intake, assessment, plan, recording, plan_generation


@pytest.mark.parametrize("test_case", TEST_CASES, ids=[tc.id for tc in TEST_CASES])
async def test_processing_status_detection(
    mock_clientdata_service,
    async_session: AsyncSession,
    test_case: TestCase,
):
    """Test that compute_processing_status correctly identifies all scenarios."""
    from unittest.mock import patch

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    staff_id = "staff-123"

    # Set up test scenario
    await setup_test_scenario(async_session, test_case, client_pseudo_id)

    # Mock staff-client relationship
    class StubStaffClient:
        def __init__(self, pseudo_id):
            self.pseudonymized_client_id = pseudo_id

    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = [StubStaffClient(client_pseudo_id)]

        # Check processing status
        result = await get_processing_status(async_session, staff_id)

    assert (
        result[client_pseudo_id] == test_case.expected_status
    ), f"Failed for {test_case.description}"


@pytest.mark.parametrize(
    "test_case",
    [tc for tc in TEST_CASES if tc.should_retry],
    ids=[tc.id for tc in TEST_CASES if tc.should_retry],
)
async def test_retry_processing_succeeds(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    test_case: TestCase,
):
    """Test that retry_processing successfully retries for NEEDS_RETRY scenarios."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Set up test scenario
    await setup_test_scenario(async_session, test_case, client_pseudo_id)

    # Mock all task types
    mock_task_result = MagicMock()
    mock_task_result.task_id = "mocked-task-id"
    mock_task_result.wait_result = AsyncMock(return_value=None)

    async def mock_kiq(*args, **kwargs):
        return mock_task_result

    with (
        patch("app.tasks.assessment.assessment_task") as mock_assessment_task,
        patch("app.tasks.plan_create.plan_create_task") as mock_plan_task,
        patch("app.tasks.action_plan.generate_action_plan_task") as mock_gen_task,
        patch("app.tasks.recording.process_recording_task") as mock_recording_task,
    ):
        mock_assessment_task.kiq = mock_kiq
        mock_plan_task.kiq = mock_kiq
        mock_gen_task.kiq = mock_kiq
        mock_recording_task.kiq = mock_kiq

        # Call retry_processing
        response = await client.post(f"/clients/{client_pseudo_id}/retry-processing")

    assert response.status_code == 200, f"Should succeed for {test_case.description}"
    data = response.json()
    assert "id" in data, "Response should contain new execution ID"


@pytest.mark.parametrize(
    "test_case",
    [tc for tc in TEST_CASES if not tc.should_retry],
    ids=[tc.id for tc in TEST_CASES if not tc.should_retry],
)
async def test_retry_processing_rejects_healthy(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    test_case: TestCase,
):
    """Test that retry_processing returns 400 error for healthy scenarios."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Set up test scenario
    await setup_test_scenario(async_session, test_case, client_pseudo_id)

    # Call retry_processing - should return error
    response = await client.post(f"/clients/{client_pseudo_id}/retry-processing")

    assert (
        response.status_code == 400
    ), f"Should reject retry for {test_case.description}"
    data = response.json()
    assert "detail" in data, "Error response should contain detail"
    assert "No retryable operations found" in data["detail"]


@pytest.mark.flaky(reruns=3, reruns_delay=1)
@pytest.mark.parametrize(
    "test_case",
    [
        TestCase("assessment", "stuck_pending"),
        TestCase("plan", "failed"),
        TestCase("recording", "stuck_in_progress"),
        TestCase("plan_generation", "failed"),
    ],
    ids=["assessment", "plan", "recording", "plan_generation"],
)
async def test_retry_processing_race_condition(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    test_case: TestCase,
):
    """Test that retry_processing handles race condition when called twice in quick succession."""
    import asyncio

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Set up test scenario that needs retry
    await setup_test_scenario(async_session, test_case, client_pseudo_id)

    # Mock all task types
    mock_task_result = MagicMock()
    mock_task_result.task_id = "mocked-task-id"
    mock_task_result.wait_result = AsyncMock(return_value=None)

    async def mock_kiq(*args, **kwargs):
        # Add small delay to simulate real async task dispatch
        await asyncio.sleep(0.01)
        return mock_task_result

    with (
        patch("app.tasks.assessment.assessment_task") as mock_assessment_task,
        patch("app.tasks.plan_create.plan_create_task") as mock_plan_task,
        patch("app.tasks.action_plan.generate_action_plan_task") as mock_gen_task,
        patch("app.tasks.recording.process_recording_task") as mock_recording_task,
    ):
        mock_assessment_task.kiq = mock_kiq
        mock_plan_task.kiq = mock_kiq
        mock_gen_task.kiq = mock_kiq
        mock_recording_task.kiq = mock_kiq

        # Call retry_processing twice concurrently
        responses = await asyncio.gather(
            client.post(f"/clients/{client_pseudo_id}/retry-processing"),
            client.post(f"/clients/{client_pseudo_id}/retry-processing"),
            return_exceptions=True,
        )
    # Verify responses: at least one should succeed
    # The second call might get 409 (lock conflict) or 400 (no retryable operations) or even 200
    success_count = sum(
        1 for r in responses if not isinstance(r, Exception) and r.status_code == 200
    )
    conflict_count = sum(
        1 for r in responses if not isinstance(r, Exception) and r.status_code == 409
    )
    no_retry_count = sum(
        1 for r in responses if not isinstance(r, Exception) and r.status_code == 400
    )
    exception_count = sum(1 for r in responses if isinstance(r, Exception))

    # At least one call should succeed
    assert (
        success_count >= 1
    ), f"Expected at least one successful retry for {test_case.description}"

    # No exceptions should be raised (all responses should be HTTP responses)
    assert (
        exception_count == 0
    ), f"Unexpected exceptions raised for {test_case.description}"

    # Verify only one execution was created (this is the key test for race condition)
    from sqlalchemy import select

    from app.models.models import Execution

    result = await async_session.execute(
        select(Execution).where(Execution.task_id == "mocked-task-id")
    )
    executions = result.scalars().all()

    assert len(executions) == 1, (
        f"Race condition: {len(executions)} executions created for {test_case.description}. "
        f"Expected exactly 1. Responses: {success_count} 200s, {conflict_count} 409s, {no_retry_count} 400s"
    )
