"""Tests for client CRUD operations with pseudonymized IDs."""

from unittest.mock import MagicMock, patch

import pytest
import sqlalchemy
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.client import (
    compute_frontend_status,
    count_intakes_for_client,
    get_paginated_client_list,
    reset_client_data,
)
from app.models.base import IntakeStatus
from app.models.intake import Intake
from app.routes.shared_models import ProcessingStatus
from app.utils.processing_status_utils import (
    compute_processing_status,
    compute_processing_status_by_intake_id,
)


class StubStaffClient:
    """Minimal stand-in object exposing pseudonymized_client_id attribute."""

    def __init__(self, pseudonymized_client_id: str):
        self.pseudonymized_client_id = pseudonymized_client_id


@pytest.fixture(scope="function")
async def create_client_view(async_session):
    """Create the client_view in the test database."""
    # Execute the DDL statement to create the view
    await async_session.execute(
        sqlalchemy.text(
            """
        CREATE OR REPLACE VIEW client_view AS
        -- INTAKE CLIENTS (earliest in process): Order values 10-30
        SELECT
            i.client_pseudo_id,
            i.id AS intake_id,
            i.status::text AS intake_status,
            CASE i.status::text
                WHEN 'created' THEN 1
                WHEN 'in_progress' THEN 2
                WHEN 'paused' THEN 3
                WHEN 'error' THEN 4
                WHEN 'system_error' THEN 5
                WHEN 'needs_human' THEN 6
                WHEN 'review' THEN 7
                WHEN 'completed' THEN 8
                WHEN 'transferred' THEN 9
                ELSE 10
            END AS intake_order,
            CASE
                WHEN i.status::text = 'created' THEN 10   -- Lowest priority - show at top
                WHEN i.status::text = 'in_progress' THEN 15
                WHEN i.status::text = 'paused' THEN 20
                WHEN i.status::text IN ('error', 'system_error', 'needs_human', 'review') THEN 25
                WHEN i.status::text = 'completed' THEN 30
                ELSE 100
            END AS process_stage_order
        FROM
            intake i
        WHERE
            -- For intake clients, only include those without assessments or with incomplete assessments
            NOT EXISTS (
                SELECT 1 FROM assessment a
                LEFT JOIN execution e ON a.execution_id = e.id
                WHERE a.client_pseudo_id = i.client_pseudo_id AND e.status = 'completed'
            )

        UNION

        -- ASSESSMENT CLIENTS (middle of process): Order values 40-60
        SELECT
            a.client_pseudo_id,
            NULL AS intake_id,
            NULL AS intake_status,
            999 AS intake_order,
            CASE
                WHEN a.execution_id IS NULL THEN 40           -- Assessment created
                WHEN e.status = 'pending' THEN 45             -- Assessment pending
                WHEN e.status = 'in_progress' THEN 50         -- Assessment in progress
                WHEN e.status = 'completed' THEN 60           -- Assessment completed
                ELSE 55                                        -- Other status (failed, etc.)
            END AS process_stage_order
        FROM
            assessment a
        LEFT JOIN
            execution e ON a.execution_id = e.id
        WHERE
            -- Include completed intake clients with assessments
            EXISTS (
                SELECT 1 FROM intake i
                WHERE i.client_pseudo_id = a.client_pseudo_id AND i.status = 'completed'
            )
            -- For assessment clients, only include those without plans or with incomplete plans
            AND NOT EXISTS (
                SELECT 1 FROM plan p
                LEFT JOIN execution e ON p.create_execution_id = e.id
                WHERE p.client_pseudo_id = a.client_pseudo_id AND e.status = 'completed'
            )

        UNION

        -- PLAN CLIENTS (latest in process): Order values 70-90
        SELECT
            p.client_pseudo_id,
            NULL AS intake_id,
            NULL AS intake_status,
            999 AS intake_order,
            CASE
                WHEN p.create_execution_id IS NULL THEN 70     -- Plan created
                WHEN e.status = 'pending' THEN 75              -- Plan pending
                WHEN e.status = 'in_progress' THEN 80          -- Plan in progress
                WHEN e.status = 'completed' THEN 90            -- Plan completed
                ELSE 85                                         -- Other status (failed, etc.)
            END AS process_stage_order
        FROM
            plan p
        LEFT JOIN
            execution e ON p.create_execution_id = e.id
        WHERE
            -- Include completed intake clients with plans
            EXISTS (
                SELECT 1 FROM intake i
                WHERE i.client_pseudo_id = p.client_pseudo_id AND i.status = 'completed'
            )
            -- Include completed assessment clients with plans
            AND EXISTS (
                SELECT 1 FROM assessment a
                LEFT JOIN execution e ON a.execution_id = e.id
                WHERE a.client_pseudo_id = p.client_pseudo_id AND e.status = 'completed'
            )
    """
        )
    )
    await async_session.commit()
    yield
    # Clean up view
    await async_session.execute(sqlalchemy.text("DROP VIEW IF EXISTS client_view;"))
    await async_session.commit()


@pytest.fixture
def mock_clientdata():
    """Setup mock client data for get_clients_by_pseudonymized_staff_id"""
    from app.tests.test_fixtures.client_examples import (
        create_jane_smith,
        create_john_doe,
    )

    # Use standardized client examples
    client1 = create_john_doe()
    client2 = create_jane_smith()

    return [client1, client2]


@pytest.mark.asyncio
async def test_get_paginated_client_list_without_pseudonymized_id(
    async_session: AsyncSession, create_client_view
):
    """Test that without a pseudonymized ID we get empty results."""
    result = await get_paginated_client_list(
        session=async_session, page=1, page_size=20, pseudonymized_staff_id=None
    )

    # Should return empty results
    assert result["total"] == 0
    assert len(result["items"]) == 0
    assert result["page"] == 1
    assert result["pages"] == 0


@pytest.mark.asyncio
async def test_get_paginated_client_list_with_unknown_id(
    async_session: AsyncSession, create_client_view
):
    """Test with an unknown pseudonymized ID."""
    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        # Return empty list for unknown staff ID
        mock_get_clients.return_value = []

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="unknown-id",
        )

        # Should return empty results
        assert result["total"] == 0
        assert len(result["items"]) == 0
        assert result["page"] == 1
        assert result["pages"] == 0

        # Verify mock was called correctly
        mock_get_clients.assert_called_once_with("unknown-id")


# Zero-caseload user but no locations → no facility clients
@pytest.mark.asyncio
async def test_zero_caseload_user_without_locations(async_session):
    """If zero-caseload but staff has no locations → empty."""
    with (
        patch(
            "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
        ) as mock_get_clients,
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_pseudonymized_id"
        ) as mock_caseworker,
    ):
        mock_get_clients.return_value = []  # No caseload clients
        mock_caseworker.return_value = MagicMock(locations=[])

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff123",
            is_zero_caseload_user=True,
        )

        assert result["total"] == 0
        assert result["items"] == []
        assert result["pages"] == 0


# Zero-caseload user with locations but no facility clients returned
@pytest.mark.asyncio
async def test_zero_caseload_user_with_locations_but_no_facility_clients(async_session):
    """Staff has facilities but BigQuery returns no facility-level clients."""
    with (
        patch(
            "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
        ) as mock_get_clients,
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_pseudonymized_id"
        ) as mock_caseworker,
        patch(
            "app.services.client_data.queries.Queries.get_clients_by_facility_access"
        ) as mock_get_facility_clients,
    ):
        mock_get_clients.return_value = []  # No caseload clients
        mock_caseworker.return_value = MagicMock(locations=["FAC1", "FAC2"])
        mock_get_facility_clients.return_value = []  # No facility clients found

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff123",
            is_zero_caseload_user=True,
        )

        assert result["total"] == 0
        assert result["items"] == []
        assert result["pages"] == 0

        called_staff_id, called_locations = mock_get_facility_clients.call_args.args

        assert called_staff_id == "staff123"
        assert set(called_locations) == {"FAC1", "FAC2"}


@pytest.mark.asyncio
async def test_merge_caseload_and_facility_clients(async_session):
    """Test merging caseload + facility clients with deduplication."""

    # Fake client objects with required attribute pseudonymized_client_id
    caseload_client_1 = MagicMock(pseudonymized_client_id="C1")
    caseload_client_2 = MagicMock(pseudonymized_client_id="C2")

    facility_client_1 = MagicMock(
        pseudonymized_client_id="C2"
    )  # duplicate → should be removed
    facility_client_2 = MagicMock(pseudonymized_client_id="C3")

    with (
        patch(
            "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
        ) as mock_get_clients,
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_pseudonymized_id"
        ) as mock_caseworker,
        patch(
            "app.services.client_data.queries.Queries.get_clients_by_facility_access"
        ) as mock_facility_clients,
        patch("app.crud.client.build_response_for_clients") as mock_build_response,
    ):
        # Mock caseload clients
        mock_get_clients.return_value = [caseload_client_1, caseload_client_2]

        # Mock staff has locations
        mock_caseworker.return_value = MagicMock(locations=["LOC1"])

        # Mock facility clients (with 1 duplicate)
        mock_facility_clients.return_value = [facility_client_1, facility_client_2]

        # Expected merged + deduped result
        expected_unique = [caseload_client_1, caseload_client_2, facility_client_2]

        # Mock build response
        mock_build_response.return_value = {
            "items": expected_unique,
            "total": 3,
            "page": 1,
            "pages": 1,
        }

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff123",
            is_zero_caseload_user=True,
        )

        # Assertions
        assert result["total"] == 3
        assert len(result["items"]) == 3

        # ensure dedupe happened (C2 appears once)
        returned_ids = [c["client_pseudo_id"] for c in result["items"]]
        assert returned_ids.count("C2") == 1

        # ensure the three unique clients are present
        assert set(returned_ids) == {"C1", "C2", "C3"}

        mock_get_clients.assert_called_once()
        mock_facility_clients.assert_called_once_with("staff123", ["LOC1"])


@pytest.mark.asyncio
async def test_compute_processing_status_not_started(async_session: AsyncSession):
    """compute_processing_status returns NOT_STARTED when no intake exists"""
    result = compute_processing_status(plans=None, intake=None, plan_generations=None)
    assert result == ProcessingStatus.NOT_STARTED


@pytest.mark.asyncio
async def test_compute_processing_status_completed(
    async_session: AsyncSession, mock_intake
):
    """compute_processing_status returns COMPLETED when plan is done"""
    from app.models.models import Execution, Plan

    client_pseudo_id = "client-001ps"

    # Setup completed intake
    mock_intake.client_pseudo_id = client_pseudo_id
    mock_intake.status = IntakeStatus.COMPLETED
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create completed assessment
    exec_assess = Execution(status="completed")
    async_session.add(exec_assess)
    await async_session.commit()

    # Create completed plan
    exec_plan = Execution(status="completed")
    async_session.add(exec_plan)
    await async_session.commit()
    await async_session.refresh(exec_plan)

    plan = Plan(
        client_pseudo_id=client_pseudo_id,
        create_execution_id=exec_plan.id,
        create_status="completed",
        intake_id=mock_intake.id,
    )
    async_session.add(plan)
    await async_session.commit()
    await async_session.refresh(plan)

    # Load execution into plan
    plan.create_execution = exec_plan

    result = compute_processing_status(
        plans=plan, intake=mock_intake, plan_generations=None
    )
    assert result == ProcessingStatus.COMPLETED


@pytest.mark.asyncio
async def test_compute_processing_status_needs_retry(
    async_session: AsyncSession, mock_intake
):
    """compute_processing_status returns NEEDS_RETRY when plan has failed after assessment"""
    from app.models.models import Execution, Plan

    client_pseudo_id = "client-002ps"

    # Setup completed intake
    mock_intake.client_pseudo_id = client_pseudo_id
    mock_intake.status = IntakeStatus.COMPLETED
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create completed assessment
    exec_assess = Execution(status="completed")
    async_session.add(exec_assess)
    await async_session.commit()

    # Create failed plan
    exec_plan = Execution(status="failed")
    async_session.add(exec_plan)
    await async_session.commit()
    await async_session.refresh(exec_plan)

    plan = Plan(
        client_pseudo_id=client_pseudo_id,
        create_execution_id=exec_plan.id,
        create_status="failed",
        intake_id=mock_intake.id,
    )
    async_session.add(plan)
    await async_session.commit()
    await async_session.refresh(plan)

    # Load execution into plan
    plan.create_execution = exec_plan

    result = compute_processing_status(
        plans=plan, intake=mock_intake, plan_generations=None
    )
    assert result == ProcessingStatus.NEEDS_RETRY


@pytest.mark.asyncio
async def test_compute_processing_status_by_intake_id(
    async_session: AsyncSession, mock_intake
):
    """Test compute_processing_status_by_intake_id fetches data and computes status"""
    from app.models.models import Execution, Plan

    client_pseudo_id = "client-003ps"

    # Setup completed intake
    mock_intake.client_pseudo_id = client_pseudo_id
    mock_intake.status = IntakeStatus.COMPLETED
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create completed assessment
    exec_assess = Execution(status="completed")
    async_session.add(exec_assess)
    await async_session.commit()

    # Create completed plan
    exec_plan = Execution(status="completed")
    async_session.add(exec_plan)
    await async_session.commit()

    plan = Plan(
        client_pseudo_id=client_pseudo_id,
        create_execution_id=exec_plan.id,
        create_status="completed",
        intake_id=mock_intake.id,
    )
    async_session.add(plan)
    await async_session.commit()

    # Test the by_intake_id function
    result = await compute_processing_status_by_intake_id(
        async_session, str(mock_intake.id)
    )
    assert result == ProcessingStatus.COMPLETED


@pytest.mark.asyncio
async def test_compute_frontend_status():
    """Test compute_frontend_status returns correct frontend status strings"""
    # No intake
    assert compute_frontend_status(None, ProcessingStatus.NOT_STARTED) == "new"

    # Created intake
    assert (
        compute_frontend_status("created", ProcessingStatus.NOT_STARTED)
        == "intake_enabled"
    )

    # In progress intake
    assert (
        compute_frontend_status("in_progress", ProcessingStatus.NOT_STARTED)
        == "intake_in_progress"
    )

    # Completed intake with processing in progress
    assert (
        compute_frontend_status("completed", ProcessingStatus.IN_PROGRESS)
        == "processing"
    )

    # Completed intake with processing completed
    assert (
        compute_frontend_status("completed", ProcessingStatus.COMPLETED)
        == "intake_complete"
    )

    # Completed intake with processing needing retry
    assert compute_frontend_status("completed", ProcessingStatus.NEEDS_RETRY) == "error"

    # Error intake
    assert compute_frontend_status("error", ProcessingStatus.NOT_STARTED) == "error"


@pytest.mark.asyncio
async def test_count_intakes_for_client(async_session: AsyncSession):
    """Test counting intakes for a client"""
    client_pseudo_id = "client-004"

    # Create test intakes
    intake1 = Intake(client_pseudo_id=client_pseudo_id, status=IntakeStatus.CREATED)
    intake2 = Intake(client_pseudo_id=client_pseudo_id, status=IntakeStatus.COMPLETED)
    intake3 = Intake(client_pseudo_id=client_pseudo_id, status=IntakeStatus.IN_PROGRESS)

    async_session.add_all([intake1, intake2, intake3])
    await async_session.commit()

    count = await count_intakes_for_client(async_session, client_pseudo_id)
    assert count == 3


@pytest.mark.asyncio
async def test_count_intakes_for_client_zero(async_session: AsyncSession):
    """Test counting intakes returns 0 when none exist"""
    count = await count_intakes_for_client(async_session, "nonexistent-client")
    assert count == 0


@pytest.mark.asyncio
async def test_reset_client_data(async_session: AsyncSession, seed_configs):
    """Test reset_client_data deletes all client data"""
    from app.models.models import Plan

    client_pseudo_id = "client-005"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    # Create intake with proper config
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create plan
    plan = Plan(client_pseudo_id=client_pseudo_id, intake_id=intake.id)
    async_session.add(plan)
    await async_session.commit()

    # Reset client data
    total_deleted = await reset_client_data(async_session, client_pseudo_id)

    assert total_deleted >= 2  # At least intake, assessment, plan

    # Verify everything is deleted
    remaining_intakes = await count_intakes_for_client(async_session, client_pseudo_id)
    assert remaining_intakes == 0


# ===== Tests for new filtering and sorting functionality =====


@pytest.mark.asyncio
async def test_get_paginated_client_list_filter_new(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test filtering for 'new' clients (no intake exists)"""
    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Don't create any intakes - all clients should be "new"
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            status_filter="new",
        )

        # Should return all clients as "new"
        assert result["total"] == 2
        assert len(result["items"]) == 2
        # All should have intake_count=0 and last_completed_date=None
        for item in result["items"]:
            assert item["intake_count"] == 0
            assert item["last_completed_date"] is None


@pytest.mark.asyncio
async def test_get_paginated_client_list_filter_new_excludes_with_intake(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test 'new' filter excludes clients with intakes"""
    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Create intake for first client
        intake = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
        )
        async_session.add(intake)
        await async_session.commit()

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            status_filter="new",
        )

        # Should only return the second client (without intake)
        assert result["total"] == 1
        assert len(result["items"]) == 1
        assert (
            result["items"][0]["client_pseudo_id"]
            == mock_clientdata[1].pseudonymized_client_id
        )


@pytest.mark.asyncio
async def test_get_paginated_client_list_filter_intake_enabled(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test filtering for 'intake_enabled' status (intake.status = 'created')"""
    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Create intakes with different statuses
        intake1 = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.CREATED,  # This should match
        )
        intake2 = Intake(
            client_pseudo_id=mock_clientdata[1].pseudonymized_client_id,
            status=IntakeStatus.IN_PROGRESS,  # This should not match
        )
        async_session.add_all([intake1, intake2])
        await async_session.commit()

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_enabled",
        )

        # Should only return client with 'created' status
        assert result["total"] == 1
        assert len(result["items"]) == 1
        assert (
            result["items"][0]["client_pseudo_id"]
            == mock_clientdata[0].pseudonymized_client_id
        )
        assert result["items"][0]["intake_count"] == 1


@pytest.mark.asyncio
async def test_get_paginated_client_list_filter_intake_in_progress(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test filtering for 'intake_in_progress' status"""
    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Create intakes with different statuses
        intake1 = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.IN_PROGRESS,  # This should match
        )
        intake2 = Intake(
            client_pseudo_id=mock_clientdata[1].pseudonymized_client_id,
            status=IntakeStatus.COMPLETED,  # This should not match
        )
        async_session.add_all([intake1, intake2])
        await async_session.commit()

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_in_progress",
        )

        # Should only return client with 'in_progress' status
        assert result["total"] == 1
        assert len(result["items"]) == 1
        assert (
            result["items"][0]["client_pseudo_id"]
            == mock_clientdata[0].pseudonymized_client_id
        )


@pytest.mark.asyncio
async def test_get_paginated_client_list_sort_by_intake_count(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test sorting by intake_count"""
    from app.crud.client import ClientSort

    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Create multiple intakes for first client (both CREATED to match filter)
        intake1 = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
        )
        intake2 = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
        )
        intake3 = Intake(
            client_pseudo_id=mock_clientdata[1].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
        )
        async_session.add_all([intake1, intake2, intake3])
        await async_session.commit()

        # Test ascending order
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            sort_by=ClientSort.INTAKE_COUNT,
            sort_order="asc",
            status_filter="intake_enabled",
        )

        # Should be sorted by intake_count ascending
        # Note: intake_count reflects only intakes matching the filter (status='created')
        assert len(result["items"]) == 2
        assert result["items"][0]["intake_count"] == 1  # Second client
        assert result["items"][1]["intake_count"] == 2  # First client

        # Test descending order
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            sort_by=ClientSort.INTAKE_COUNT,
            sort_order="desc",
            status_filter="intake_enabled",
        )

        assert len(result["items"]) == 2
        assert result["items"][0]["intake_count"] == 2  # First client
        assert result["items"][1]["intake_count"] == 1  # Second client


@pytest.mark.asyncio
async def test_get_paginated_client_list_sort_by_last_assessment_date(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test sorting by last_assessment_date (last_completed_date)"""
    from datetime import datetime

    from app.crud.client import ClientSort

    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        # Create intakes with different completion dates (naive datetimes)
        older_date = datetime(2024, 1, 1)
        newer_date = datetime(2024, 6, 1)

        intake1 = Intake(
            client_pseudo_id=mock_clientdata[0].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
            completed_at=older_date,
        )
        intake2 = Intake(
            client_pseudo_id=mock_clientdata[1].pseudonymized_client_id,
            status=IntakeStatus.CREATED,
            completed_at=newer_date,
        )
        async_session.add_all([intake1, intake2])
        await async_session.commit()

        # Test ascending order (oldest first)
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            sort_by=ClientSort.LAST_ASSESSMENT_DATE,
            sort_order="asc",
            status_filter="intake_enabled",
        )

        assert len(result["items"]) == 2
        assert result["items"][0]["last_completed_date"] == older_date
        assert result["items"][1]["last_completed_date"] == newer_date

        # Test descending order (newest first)
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            sort_by=ClientSort.LAST_ASSESSMENT_DATE,
            sort_order="desc",
            status_filter="intake_enabled",
        )

        assert len(result["items"]) == 2
        assert result["items"][0]["last_completed_date"] == newer_date
        assert result["items"][1]["last_completed_date"] == older_date


@pytest.mark.asyncio
async def test_get_paginated_client_list_filter_intake_complete(
    async_session: AsyncSession, create_client_view, mock_clientdata, seed_configs
):
    """Test filtering for 'intake_complete' status (complex filter - Tier 3)"""
    from app.models.assessment import Assessment
    from app.models.models import Execution, Plan

    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        mock_get_clients.return_value = mock_clientdata

        client_pseudo_id = mock_clientdata[0].pseudonymized_client_id
        assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

        # Create completed intake
        intake = Intake(
            client_pseudo_id=client_pseudo_id,
            status=IntakeStatus.COMPLETED,
            assessment_config_id=assessment_config_id,
        )
        async_session.add(intake)
        await async_session.commit()
        await async_session.refresh(intake)

        # Create completed assessment
        exec_assess = Execution(status="completed")
        async_session.add(exec_assess)
        await async_session.commit()

        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            execution_id=exec_assess.id,
            status="completed",
            intake_id=intake.id,
        )
        async_session.add(assessment)
        await async_session.commit()

        # Create completed plan
        exec_plan = Execution(status="completed")
        async_session.add(exec_plan)
        await async_session.commit()

        plan = Plan(
            client_pseudo_id=client_pseudo_id,
            create_execution_id=exec_plan.id,
            create_status="completed",
            intake_id=intake.id,
        )
        async_session.add(plan)
        await async_session.commit()

        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=20,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_complete",
        )

        # Should return the client with completed processing
        assert result["total"] == 1
        assert len(result["items"]) == 1
        assert result["items"][0]["client_pseudo_id"] == client_pseudo_id


@pytest.mark.asyncio
async def test_get_paginated_client_list_pagination(
    async_session: AsyncSession, create_client_view, mock_clientdata
):
    """Test pagination works correctly with filters and sorting"""

    with patch(
        "app.services.client_data.queries.Queries.get_clients_by_pseudonymized_staff_id"
    ) as mock_get_clients:
        # Create 5 mock clients
        from app.services.client_data.types import ClientDataRecord, FullNameModel

        clients = []
        for i in range(5):
            clients.append(
                ClientDataRecord(
                    external_client_id=f"ext-{i}",
                    pseudonymized_client_id=f"client-{i}",
                    full_name=FullNameModel(
                        given_names=f"Client{i}", surname=f"Test{i}"
                    ),
                    birthdate="1990-01-01",
                    state_code="US_UT",
                )
            )
        mock_get_clients.return_value = clients

        # Create intakes for all clients
        for client in clients:
            intake = Intake(
                client_pseudo_id=client.pseudonymized_client_id,
                status=IntakeStatus.CREATED,
            )
            async_session.add(intake)
        await async_session.commit()

        # Test page 1 with page_size=2
        result = await get_paginated_client_list(
            session=async_session,
            page=1,
            page_size=2,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_enabled",
        )

        assert result["total"] == 5
        assert len(result["items"]) == 2
        assert result["pages"] == 3
        assert result["page"] == 1

        # Test page 2
        result = await get_paginated_client_list(
            session=async_session,
            page=2,
            page_size=2,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_enabled",
        )

        assert result["total"] == 5
        assert len(result["items"]) == 2
        assert result["page"] == 2

        # Test page 3 (last page, only 1 item)
        result = await get_paginated_client_list(
            session=async_session,
            page=3,
            page_size=2,
            pseudonymized_staff_id="staff-123",
            status_filter="intake_enabled",
        )

        assert result["total"] == 5
        assert len(result["items"]) == 1
        assert result["page"] == 3
