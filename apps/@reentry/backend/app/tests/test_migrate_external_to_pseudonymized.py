from unittest.mock import AsyncMock, patch

import pytest

from app.manage.migrate_external_to_pseudonymized import (
    CLIENT_MAPPING,
    _migrate_ids,
    migrate_ids,
)
from app.models.intake import Intake, IntakeStatus, IntakeType

# Create intakes in the actual database
from app.tests.test_fixtures.client_examples import create_jane_smith, create_john_doe

john_doe = create_john_doe()

jane_smith = create_jane_smith()


johnny = create_john_doe()

johnny.pseudonymized_client_id = "something"
johnny.state_code = "US_AZ"


@pytest.mark.asyncio
@patch("app.manage.migrate_external_to_pseudonymized.get_session_async_manager")
async def test_migrate_ids(mock_get_session_async_manager):
    # Mock session and its methods
    mock_session = AsyncMock()
    mock_get_session_async_manager.return_value.__aenter__.return_value = mock_session

    # Mock the _migrate_ids function
    with patch(
        "app.manage.migrate_external_to_pseudonymized._migrate_ids", new=AsyncMock()
    ) as mock_migrate:
        await migrate_ids()
        mock_migrate.assert_called_once_with(mock_session, CLIENT_MAPPING)


@pytest.mark.asyncio
async def test_migrate_ids_no_conflict(async_session):
    # Mock get_clients_by_external_id to return a new client each time
    with patch(
        "app.manage.migrate_external_to_pseudonymized.get_clients_by_external_id",
        side_effect=[
            [john_doe],
            [jane_smith],
        ],
    ):
        intake_1 = Intake(
            client_id=john_doe.external_client_id,
            current_section="Education / Employment",
            status=IntakeStatus.CREATED,
            internal_access=True,
            intake_type=IntakeType.CONVERSATION,
        )
        intake_2 = Intake(
            client_id=jane_smith.external_client_id,
            current_section="Housing",
            status=IntakeStatus.CREATED,
            internal_access=True,
            intake_type=IntakeType.CONVERSATION,
        )
        async_session.add(intake_1)
        async_session.add(intake_2)
        await async_session.commit()

        client_mapping = {john_doe.external_client_id: john_doe.state_code}

        # Run the migration function
        await _migrate_ids(async_session, client_mapping)

        # Verify the results in the database
        updated_intake_1 = await async_session.get(Intake, intake_1.id)
        updated_intake_2 = await async_session.get(Intake, intake_2.id)

        # Ensure the first intake was updated with one of the pseudonymized IDs
        assert updated_intake_1.client_pseudo_id == john_doe.pseudonymized_client_id
        assert updated_intake_2.client_pseudo_id == jane_smith.pseudonymized_client_id


@pytest.mark.asyncio
async def test_migrate_ids_with_multiple_clients(async_session):
    # Mock get_clients_by_external_id to return multiple clients for one call
    with patch(
        "app.manage.migrate_external_to_pseudonymized.get_clients_by_external_id",
        side_effect=[
            [john_doe, johnny],
            [jane_smith],
        ],
    ):
        intake_1 = Intake(
            client_id=john_doe.external_client_id,
            current_section="Education / Employment",
            status=IntakeStatus.CREATED,
            internal_access=True,
            intake_type=IntakeType.CONVERSATION,
        )
        intake_2 = Intake(
            client_id=jane_smith.external_client_id,
            current_section="Housing",
            status=IntakeStatus.CREATED,
            internal_access=True,
            intake_type=IntakeType.CONVERSATION,
        )
        async_session.add(intake_1)
        async_session.add(intake_2)
        await async_session.commit()

        client_mapping = {john_doe.external_client_id: john_doe.state_code}

        # Run the migration function
        await _migrate_ids(async_session, client_mapping)

        # Verify the results in the database
        updated_intake_1 = await async_session.get(Intake, intake_1.id)
        updated_intake_2 = await async_session.get(Intake, intake_2.id)

        # Ensure the first intake was updated with one of the pseudonymized IDs
        assert updated_intake_1.client_pseudo_id == john_doe.pseudonymized_client_id
        assert updated_intake_2.client_pseudo_id == jane_smith.pseudonymized_client_id
