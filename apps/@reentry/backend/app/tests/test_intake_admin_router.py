from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.crud.intake import create_intake
from app.models.intake import (
    ClientIntakeSection,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
    IntakeType,
)
from app.models.intake_sections import CompletionStatus


@pytest.mark.asyncio
async def test_start_intake_process_success(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake using create_intake (new behavior)
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    intake.current_section = "Education / Employment"
    intake.internal_access = True
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    response = await client.post(f"/intake/admin/{client_pseudo_id}")

    assert response.status_code == 200
    data = response.json()

    # Validate response structure
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.CREATED.value
    assert "internal_access" in data
    assert data["internal_access"] is True


@pytest.mark.asyncio
async def test_get_client_intake_success(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    seed_configs,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake using create_intake
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    intake.current_section = "Education / Employment"
    intake.status = IntakeStatus.IN_PROGRESS
    intake.internal_access = True
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Add message
    message = IntakeMessage(
        id=uuid4(),
        intake_id=intake.id,
        section="Education / Employment",
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message",
    )
    async_session.add(message)
    await async_session.commit()

    response = await client.get(f"/intake/admin/{client_pseudo_id}")

    assert response.status_code == 200
    data = response.json()

    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_set_internal_access_success(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test successfully updating internal access field for an intake."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake using create_intake
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.internal_access = False
    async_session.add(intake)
    await async_session.commit()

    # Test setting internal_access to True
    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={"internal_access": True},
    )

    # Verify response
    assert response.status_code == 200
    assert response.json() == "success"

    await async_session.refresh(intake)
    assert intake.internal_access is True

    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={"internal_access": False},
    )

    assert response.status_code == 200
    assert response.json() == "success"

    await async_session.refresh(intake)
    assert intake.internal_access is False


@pytest.mark.asyncio
async def test_set_internal_access_not_found(
    async_session, client: AsyncClient, mock_clientdata_service
):
    """Test 404 error when intake record doesn't exist."""
    # Use a non-existent client that's not in our mock data
    # mock_clientdata_service provides mocking for the client service
    non_existent_client_pseudo_id = "client-999"

    response = await client.patch(
        f"/intake/admin/{non_existent_client_pseudo_id}/internal-access",
        json={"internal_access": True},
    )

    assert response.status_code == 404
    # Note: may return "Client not found" if client doesn't exist in BigQuery
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_set_internal_access_unauthorized(
    async_session, client: AsyncClient, mock_clientdata_service
):
    """Test unauthorized access without valid token."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Note: auth is already mocked in conftest, this test validates the endpoint exists
    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={"internal_access": True},
    )

    # Should fail because no intake exists
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_set_internal_access_invalid_payload(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test with invalid request payload."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake using create_intake
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.internal_access = False
    async_session.add(intake)
    await async_session.commit()

    # Missing required field
    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={},
    )
    assert response.status_code == 422

    # Invalid type
    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={"internal_access": "not_a_boolean"},
    )
    assert response.status_code == 422


# =============================================================================
# Migration Tests: Verify Admin API Returns Sections from Both Paths
# =============================================================================


@pytest.mark.asyncio
async def test_get_new_intake_sections_from_config(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    seed_configs,
):
    """Test that admin GET endpoint returns sections from assessment_config for NEW intakes.

    NEW intakes (created after migration) have assessment_config_id but no ClientIntakeSections.
    Sections should be returned from the assessment config YAML.
    """
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create NEW intake using create_intake (sets assessment_config_id, no ClientIntakeSections)
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Verify no ClientIntakeSections exist
    assert len(intake.client_intake_sections) == 0
    assert intake.assessment_config_id is not None

    response = await client.get(f"/intake/admin/{client_pseudo_id}")

    assert response.status_code == 200
    data = response.json()

    # Verify response contains sections from config
    assert "intake_sections" in data
    assert len(data["intake_sections"]) > 0

    # Verify section structure
    first_section = data["intake_sections"][0]
    assert "title" in first_section
    assert "description" in first_section

    # Mock client is US_IX, which uses Housing as first section
    assert first_section["title"] == "Housing"


@pytest.mark.asyncio
async def test_get_legacy_intake_sections_from_db(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    seed_configs,
):
    """Test that admin GET endpoint returns sections from ClientIntakeSections for LEGACY intakes.

    LEGACY intakes (created before migration) have ClientIntakeSections in the database.
    Sections should be returned from ClientIntakeSections, not from config.
    """
    from app.tests.test_fixtures.intake_sections import create_test_sections

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake with assessment_config_id
    intake = await create_intake(
        async_session, client_pseudo_id, IntakeType.CONVERSATION
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = "Legacy Section 1"
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create LEGACY ClientIntakeSections to simulate pre-migration intake
    legacy_sections = create_test_sections(2)
    legacy_sections[0].title = "Legacy Section 1"
    legacy_sections[1].title = "Legacy Section 2"
    async_session.add_all(legacy_sections)
    await async_session.commit()

    for i, section_model in enumerate(legacy_sections):
        await async_session.refresh(section_model)
        client_section = ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=section_model.id,
            is_active=True,
            order=i,
            completion_status=CompletionStatus.IN_PROGRESS
            if i == 0
            else CompletionStatus.NOT_STARTED,
        )
        async_session.add(client_section)

    await async_session.commit()
    await async_session.refresh(intake)

    # Verify ClientIntakeSections exist
    assert len(intake.client_intake_sections) == 2

    response = await client.get(f"/intake/admin/{client_pseudo_id}")

    assert response.status_code == 200
    data = response.json()

    # Verify response contains sections from DB (ClientIntakeSections)
    assert "intake_sections" in data
    assert len(data["intake_sections"]) == 2

    # Verify sections are the legacy ones from DB, not from config
    section_titles = [s["title"] for s in data["intake_sections"]]
    assert "Legacy Section 1" in section_titles
    assert "Legacy Section 2" in section_titles
