from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.base import IntakeType
from app.models.intake import (
    ClientIntakeSection,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
)
from app.models.intake_sections import CompletionStatus
from app.utils.string_utils import normalize_code


@pytest.mark.asyncio
async def test_get_client_intake_success(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    mock_intake,
):
    mock_intake.current_section = "Education / Employment"
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.internal_access = True
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Add message
    message = IntakeMessage(
        id=uuid4(),
        intake_id=mock_intake.id,
        section="Education / Employment",
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message",
    )
    async_session.add(message)
    await async_session.commit()

    response = await client.get(f"/intake/admin/{mock_intake.id}")

    assert response.status_code == 200
    data = response.json()

    assert data["client_pseudo_id"] == mock_intake.client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value


# =============================================================================
# Migration Tests: Verify Admin API Returns Sections from Both Paths
# =============================================================================


@pytest.mark.asyncio
async def test_get_new_intake_sections_from_config(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    mock_intake,
):
    """Test that admin GET endpoint returns sections from assessment_config for NEW intakes.

    NEW intakes (created after migration) have assessment_config_id but no ClientIntakeSections.
    Sections should be returned from the assessment config YAML.
    """

    # Create NEW intake using create_intake (sets assessment_config_id, no ClientIntakeSections)
    mock_intake.status = IntakeStatus.CREATED
    await async_session.commit()
    await async_session.refresh(mock_intake)

    #
    await mock_intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(mock_intake)

    # Verify no ClientIntakeSections exist
    assert len(mock_intake.client_intake_sections) == 0
    assert mock_intake.assessment_config_id is not None

    response = await client.get(f"/intake/admin/{mock_intake.id}")

    assert response.status_code == 200
    data = response.json()

    # Verify response contains sections from config
    assert "intake_sections" in data
    assert len(data["intake_sections"]) > 0

    # Verify section structure
    first_section = data["intake_sections"][0]
    assert "title" in first_section
    assert "description" in first_section

    # Mock client is US_IX, which uses Employment as first section
    assert first_section["title"] == "Employment"


@pytest.mark.asyncio
async def test_get_legacy_intake_sections_from_db(
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
    mock_intake,
):
    """Test that admin GET endpoint returns sections from ClientIntakeSections for LEGACY intakes.

    LEGACY intakes (created before migration) have ClientIntakeSections in the database.
    Sections should be returned from ClientIntakeSections, not from config.
    """
    from app.tests.test_fixtures.intake_sections import create_test_sections

    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.current_section = "Legacy Section 1"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create LEGACY ClientIntakeSections to simulate pre-migration intake
    legacy_sections = create_test_sections(2)
    legacy_sections[0].title = "Legacy Section 1"
    legacy_sections[1].title = "Legacy Section 2"
    async_session.add_all(legacy_sections)
    await async_session.commit()

    for i, section_model in enumerate(legacy_sections):
        await async_session.refresh(section_model)
        client_section = ClientIntakeSection(
            intake_id=mock_intake.id,
            intake_section_id=section_model.id,
            is_active=True,
            order=i,
            completion_status=CompletionStatus.IN_PROGRESS
            if i == 0
            else CompletionStatus.NOT_STARTED,
        )
        async_session.add(client_section)

    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Verify ClientIntakeSections exist
    assert len(mock_intake.client_intake_sections) == 2

    response = await client.get(f"/intake/admin/{mock_intake.id}")

    assert response.status_code == 200
    data = response.json()

    # Verify response contains sections from DB (ClientIntakeSections)
    assert "intake_sections" in data
    assert len(data["intake_sections"]) == 2

    # Verify sections are the legacy ones from DB, not from config
    section_titles = [s["title"] for s in data["intake_sections"]]
    assert "Legacy Section 1" in section_titles
    assert "Legacy Section 2" in section_titles


# =============================================================================
# Tests for POST /intake/admin (Create Intake)
# =============================================================================


@pytest.mark.asyncio
async def test_create_intake_success(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test successfully creating a new intake."""
    # Default client is US_IX, so use a US_IX config
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(assessment_config_id),
        },
    )

    assert response.status_code == 201
    data = response.json()

    assert "id" in data
    assert data["status"] == "created"
    assert data["assessment_config_code"] == "facr"

    # Verify the intake was created in the database
    from app.crud.intake import get_intake_by_id

    intake = await get_intake_by_id(async_session, data["id"])
    assert intake is not None
    assert intake.client_pseudo_id == client_pseudo_id
    assert intake.status == IntakeStatus.CREATED
    assert intake.assessment_config_id == assessment_config_id


@pytest.mark.asyncio
async def test_create_intake_conflict_in_progress_conversation(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test 409 conflict when client already has an IN_PROGRESS conversation intake."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create an existing IN_PROGRESS conversation intake
    existing_intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(existing_intake)
    await async_session.commit()

    # Try to create a new intake for the same client
    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(assessment_config_id),
        },
    )

    assert response.status_code == 409
    assert "in_progress" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_intake_conflict_with_created_intake(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test 409 conflict when client already has a CREATED intake."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create an existing CREATED intake
    existing_intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.CREATED,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(existing_intake)
    await async_session.commit()

    # Try to create a new intake for the same client
    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(assessment_config_id),
        },
    )

    # Should fail because client already has an active (CREATED) intake
    assert response.status_code == 409
    assert "active" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_intake_allows_multiple_completed(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test that multiple intakes are allowed when previous ones are COMPLETED."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create an existing COMPLETED intake
    existing_intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(existing_intake)
    await async_session.commit()

    # Should be able to create a new intake since the previous one is completed
    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(assessment_config_id),
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "created"


@pytest.mark.asyncio
async def test_create_intake_assessment_config_not_found(
    async_session, client: AsyncClient, mock_clientdata_service
):
    """Test 404 when assessment_config_id doesn't exist."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    fake_config_id = uuid4()

    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(fake_config_id),
        },
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_intake_inactive_assessment_config(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test 400 when assessment config is not active."""
    from app.models.assessment_config import AssessmentConfig

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create an inactive assessment config for the client's state (US_IX)
    inactive_config = AssessmentConfig(
        state_code="US_IX",
        code=normalize_code("INACTIVE"),
        version=1,
        display_name="Inactive Config",
        config_yaml="metadata:\n  code: INACTIVE\n  version: 1",
        is_active=False,
    )
    async_session.add(inactive_config)
    await async_session.commit()
    await async_session.refresh(inactive_config)

    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(inactive_config.id),
        },
    )

    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_intake_state_mismatch(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test 400 when client state doesn't match assessment config state."""
    # client-002ps is US_AZ, try to use US_UT config (should fail)
    client_pseudo_id = "client-002ps"  # This is a US_AZ client
    # Use active version of UT config
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 2)]

    response = await client.post(
        "/intake/admin",
        json={
            "client_pseudo_id": client_pseudo_id,
            "assessment_config_id": str(assessment_config_id),
        },
    )

    assert response.status_code == 400
    assert "state" in response.json()["detail"].lower()


# =============================================================================
# Tests for PATCH /intake/admin/{intake_id}/internal-access (Updated Endpoint)
# =============================================================================


@pytest.mark.asyncio
async def test_set_internal_access_by_intake_id_success(
    async_session, client: AsyncClient, mock_clientdata_service, mock_intake
):
    """Test successfully updating internal access field using intake_id."""
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.internal_access = False
    async_session.add(mock_intake)
    await async_session.commit()

    # Test setting internal_access to True using intake_id
    response = await client.patch(
        f"/intake/admin/{mock_intake.id}/internal-access",
        json={"internal_access": True},
    )

    assert response.status_code == 200
    assert response.json() == "success"

    await async_session.refresh(mock_intake)
    assert mock_intake.internal_access is True

    # Test setting it back to False
    response = await client.patch(
        f"/intake/admin/{mock_intake.id}/internal-access",
        json={"internal_access": False},
    )

    assert response.status_code == 200
    await async_session.refresh(mock_intake)
    assert mock_intake.internal_access is False


@pytest.mark.asyncio
async def test_set_internal_access_by_intake_id_not_found(
    async_session, client: AsyncClient, mock_clientdata_service
):
    """Test 404 when intake_id doesn't exist."""
    fake_intake_id = uuid4()

    response = await client.patch(
        f"/intake/admin/{fake_intake_id}/internal-access",
        json={"internal_access": True},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
