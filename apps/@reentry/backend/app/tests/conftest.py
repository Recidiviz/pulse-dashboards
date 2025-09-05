import os
from pathlib import Path
from unittest.mock import MagicMock

# Set environment variable BEFORE any imports that might use settings
os.environ["RECIDIVIZ_ENABLE_AUTH_MIDDLEWARE"] = "false"

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import engine
from app.utils import permission_utils
from main import app as fastapi_app

test_data_directory = Path(__file__).parent / "data"


@pytest.fixture
def assert_response():
    def _assert_response(resp, expected_status_code):
        if resp.status_code != expected_status_code:
            pytest.fail(
                f"Expected status code {expected_status_code}, got {resp.status_code}. "
                f"Response body: {resp.text}"
            )
        assert resp.status_code == expected_status_code

    return _assert_response


@pytest_asyncio.fixture(scope="function")
async def async_session() -> AsyncSession:
    import app.models.models  # noqa
    import app.models.decision_tree  # noqa
    import app.models.plan_decision_tree  # noqa
    import app.models.assessment_tree  # noqa
    import app.models.execution  # noqa
    import app.models.assessment  # noqa
    import app.models.intake  # noqa
    import sqlalchemy

    session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Necessary in case the database is not empty
    async with engine.begin() as conn:
        # Drop the view before dropping tables
        try:
            await conn.execute(sqlalchemy.text("DROP VIEW IF EXISTS client_view;"))
        except Exception:
            pass
        await conn.run_sync(SQLModel.metadata.drop_all)

    async with session() as s:
        async with engine.begin() as conn:
            # Print all tables that will be created
            await conn.run_sync(SQLModel.metadata.create_all)

            # Create the client_view in all test databases by default
            try:
                await conn.execute(
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
            except Exception as e:
                # If the view creation fails, log the error but continue
                print(f"WARNING: Failed to create client_view: {e}")

        yield s

    async with engine.begin() as conn:
        # Drop the view before dropping tables
        try:
            await conn.execute(sqlalchemy.text("DROP VIEW IF EXISTS client_view;"))
        except Exception:
            pass
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def client():
    # Import auth functions
    from app.auth.auth_core import get_pseudonymized_id

    # Save original dependency
    original_dependencies = fastapi_app.dependency_overrides.copy()

    # Override authentication dependency for tests
    async def mock_get_pseudonymized_id():
        return "test_pseudonymized_id"

    # Apply the override
    fastapi_app.dependency_overrides[get_pseudonymized_id] = mock_get_pseudonymized_id

    # Create and yield the test client
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as client:
        yield client

    # Restore original dependencies after test
    fastapi_app.dependency_overrides = original_dependencies


@pytest_asyncio.fixture(scope="function")
async def seed_decision_trees(async_session):
    import app.manage.base  # noqa: F401
    from app.manage.import_decision_tree import import_decision_tree_db

    for filepath in test_data_directory.glob("*.mermaid"):
        await import_decision_tree_db(session=async_session, filepath=filepath)


@pytest_asyncio.fixture(scope="function")
async def seed_default_sections(async_session):
    from app.manage.intake import seed_default_sections

    await seed_default_sections(async_session)


@pytest.fixture(scope="session", autouse=True)
def mock_bigquery():
    """Mock BigQuery client globally for all tests"""
    from app.services.client_data.utils import set_bigquery_client

    # Create a mock BigQuery client
    mock_client = MagicMock()

    # Set up the mock client with necessary methods
    mock_query_job = MagicMock()
    mock_query_job.result.return_value = []
    mock_client.query.return_value = mock_query_job

    # Apply the mock to our module
    set_bigquery_client(mock_client)

    return mock_client


@pytest.fixture(scope="function")
def mock_client_data():
    """Mock data for client service"""
    from app.tests.test_fixtures.client_examples import (
        create_case_manager,
        create_jane_smith,
        create_john_doe,
    )

    # Get standardized client and staff records
    client1 = create_john_doe()
    client2 = create_jane_smith()
    staff = create_case_manager()

    return {
        "clients": [client1, client2],
        "staff": staff,
        "clients_by_pseudo_id": {"client-001ps": client1, "client-002ps": client2},
        "client_pseudo_id": "client-001ps",
    }


@pytest.fixture
def mock_clientdata_service(monkeypatch, mock_client_data):
    """Mock the clientdata service functions"""

    from app.services.client_data.queries import Queries

    # Mock get_client_data_by_pseudonymized_id
    def mock_get_client_data_by_pseudonymized_id(
        pseudonymized_client_id: str, pseudonymized_staff_id: str
    ):
        return mock_client_data["clients_by_pseudo_id"].get(pseudonymized_client_id)

    # Mock mock_get_client_by_pseudonymized_id_unsafe
    def mock_get_client_by_pseudonymized_id_unsafe(
        pseudonymized_id: str,
    ):
        return mock_client_data["clients_by_pseudo_id"].get(pseudonymized_id)

    # Mock get_clients_by_pseudonymized_staff_id to return an empty list for the test ID
    def mock_get_clients_by_pseudonymized_staff_id(pseudonymized_staff_id: str):
        if pseudonymized_staff_id == "no-clients-id":
            return []

        return mock_client_data["clients"]

    # Mock get_caseworker_by_pseudonymized_id
    def mock_get_caseworker_by_pseudonymized_id(pseudonymized_staff_id: str):
        return mock_client_data["staff"]

    def mock_check_access(client_pseudo_id, pseudonymized_id):
        return client_pseudo_id in ["client-001", "client-002"]

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)
    monkeypatch.setattr(
        Queries,
        "get_client_data_by_pseudonymized_id",
        mock_get_client_data_by_pseudonymized_id,
    )
    monkeypatch.setattr(
        Queries,
        "get_client_by_pseudonymized_id_unsafe",
        mock_get_client_by_pseudonymized_id_unsafe,
    )
    monkeypatch.setattr(
        Queries,
        "get_clients_by_pseudonymized_staff_id",
        mock_get_clients_by_pseudonymized_staff_id,
    )
    monkeypatch.setattr(
        Queries,
        "get_caseworker_by_pseudonymized_id",
        mock_get_caseworker_by_pseudonymized_id,
    )

    return mock_client_data
