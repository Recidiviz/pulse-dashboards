"""Tests for client CRUD operations with pseudonymized IDs."""

from unittest.mock import patch

import pytest
import sqlalchemy
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.client import get_paginated_client_list


@pytest.fixture(scope="function")
async def create_client_view(async_session):
    """Create the client_view in the test database."""
    # Execute the DDL statement to create the view
    await async_session.execute(
        sqlalchemy.text("""
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
    """)
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


# TODO: Test is currently failing due to temporary logic that matches caseworkers to clients
# @pytest.mark.asyncio
# async def test_get_paginated_client_list_with_pseudonymized_id(
#     async_session: AsyncSession, mock_clientdata, create_client_view
# ):
#     """Test getting client list with a pseudonymized staff ID."""
#     # Create test data in the database
#     client_pseudo_id = "client-001"
#     intake = Intake(client_pseudo_id=client_pseudo_id, status=IntakeStatus.IN_PROGRESS)
#     async_session.add(intake)
#     await async_session.commit()

#     # Setup our mocks
#     pseudonymized_staff_id = "test-pseudonymized-id"

#     # Mock get_clients_by_pseudonymized_staff_id to return our test data
#     with patch(
#         "app.services.client_data.queries.get_clients_by_pseudonymized_staff_id"
#     ) as mock_get_clients:
#         mock_get_clients.return_value = mock_clientdata

#         # Mock get_clients_by_external_ids to return a dict of our clients
#         with patch(
#             "app.services.client_data.queries.get_clients_by_external_ids"
#         ) as mock_get_by_ids:
#             client_map = {
#                 client.external_client_id: client for client in mock_clientdata
#             }
#             mock_get_by_ids.return_value = client_map

#             # Call the function with a pseudonymized staff ID
#             result = await get_paginated_client_list(
#                 session=async_session,
#                 page=1,
#                 page_size=20,
#                 pseudonymized_staff_id=pseudonymized_staff_id,
#             )

#             # Assert results
#             assert result["total"] == 1  # should match the number of clients with same state_code as the caseworker
#             assert len(result["items"]) == 1
#             assert result["page"] == 1

#             # Assert client info is correct
#             client_pseudo_ids = {item["client_pseudo_id"] for item in result["items"]}
#             assert "client-001" in client_pseudo_ids
#             # assert "client-002" in client_pseudo_ids

#             # Verify the intake was associated with the client
#             for item in result["items"]:
#                 if item["client_pseudo_id"] == "client-001":
#                     assert item["intake"] is not None
#                     assert item["intake"]["status"] == "in_progress"

#             # Verify mock was called correctly
#             mock_get_clients.assert_called_once_with(pseudonymized_staff_id)


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
