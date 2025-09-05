from datetime import datetime, timedelta
from unittest.mock import patch
from uuid import uuid4

import jwt
import pytest
from httpx import AsyncClient

from app.models.intake import (
    ClientIntakeSection,
    CompletionStatus,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
    IntakeType,
)
from app.tests.test_fixtures.intake_sections import create_test_section


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_start_intake_process_success(
    mock_validate_token, async_session, client: AsyncClient, mock_clientdata_service
):
    # Simulate a validated token
    mock_validate_token.return_value = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "name": "John Doe",
    }

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake_id = uuid4()
    section_id = uuid4()

    intake = Intake(
        id=intake_id,
        client_pseudo_id=client_pseudo_id,
        current_section="Education / Employment",
        status=IntakeStatus.CREATED,
        internal_access=True,
        intake_type=IntakeType.CONVERSATION,
    )

    section = create_test_section("Education / Employment")
    section.id = section_id
    section.description = "Education and work history"
    section.required_information = "Employment information"

    from app.tests.test_fixtures.intake_sections import (
        create_test_client_intake_section,
    )

    client_section = create_test_client_intake_section(
        intake_id=intake_id,
        intake_section_id=section_id,
        completion_status=CompletionStatus.IN_PROGRESS,
        is_active=True,
    )

    message = IntakeMessage(
        id=uuid4(),
        intake_id=intake_id,
        section="Education / Employment",
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message",
    )

    async_session.add_all([intake, section, client_section, message])
    await async_session.commit()

    payload = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(minutes=10)).timestamp(),
    }
    token = jwt.encode(payload, "dummy-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(f"/intake/admin/{client_pseudo_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Validate response structure
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.CREATED.value
    assert data["current_section"] == "Education / Employment"
    assert len(data["client_intake_sections"]) == 1
    assert "internal_access" in data
    assert data["internal_access"] is True


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_get_client_intake_success(
    mock_validate_token,
    async_session,
    client: AsyncClient,
    mock_clientdata_service,
):
    # Simulate a validated token
    mock_validate_token.return_value = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "name": "John Doe",
    }

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake_id = uuid4()
    section_id = uuid4()

    intake = Intake(
        id=intake_id,
        client_pseudo_id=client_pseudo_id,
        current_section="Education / Employment",
        status=IntakeStatus.IN_PROGRESS,
        internal_access=True,
    )

    section = create_test_section("Education / Employment")
    section.id = section_id
    section.description = "Education and work history"
    section.required_information = "Employment information"

    client_section = ClientIntakeSection(
        intake_id=intake_id,
        intake_section_id=section_id,
        completion_status=CompletionStatus.IN_PROGRESS,
        is_active=True,
    )

    message = IntakeMessage(
        id=uuid4(),
        intake_id=intake_id,
        section="Education / Employment",
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message",
    )

    async_session.add_all([intake, section, client_section, message])
    await async_session.commit()

    payload = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(minutes=10)).timestamp(),
    }
    token = jwt.encode(payload, "dummy-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get(f"/intake/admin/{client_pseudo_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Education / Employment"
    assert len(data["client_intake_sections"]) == 1
    # Since we're using client-001 which doesn't have doc_id
    assert data["client"]["pseudonymized_client_id"] == client_pseudo_id


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_set_internal_access_success(
    mock_validate_token, async_session, client: AsyncClient, mock_clientdata_service
):
    """Test successfully updating internal access field for an intake."""

    mock_validate_token.return_value = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "name": "John Doe",
    }

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake_id = uuid4()

    intake = Intake(
        id=intake_id,
        client_pseudo_id=client_pseudo_id,
        current_section="Education / Employment",
        status=IntakeStatus.IN_PROGRESS,
        internal_access=False,
    )

    async_session.add(intake)
    await async_session.commit()

    payload = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(minutes=10)).timestamp(),
    }
    token = jwt.encode(payload, "dummy-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    # Test setting internal_access to True
    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        headers=headers,
        json={"internal_access": True},
    )

    # Verify response
    assert response.status_code == 200
    assert response.json() == "success"

    await async_session.refresh(intake)
    assert intake.internal_access is True

    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        headers=headers,
        json={"internal_access": False},
    )

    assert response.status_code == 200
    assert response.json() == "success"

    await async_session.refresh(intake)
    assert intake.internal_access is False


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_set_internal_access_not_found(
    mock_validate_token, async_session, client: AsyncClient
):
    """Test 404 error when intake record doesn't exist."""

    mock_validate_token.return_value = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "name": "John Doe",
    }

    non_existent_client_pseudo_id = "client-999"

    payload = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(minutes=10)).timestamp(),
    }
    token = jwt.encode(payload, "dummy-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.patch(
        f"/intake/admin/{non_existent_client_pseudo_id}/internal-access",
        headers=headers,
        json={"internal_access": True},
    )

    assert response.status_code == 404
    assert (
        response.json()["detail"]
        == f"Intake record not found for client ID: {non_existent_client_pseudo_id}"
    )


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_set_internal_access_unauthorized(
    mock_validate_token, async_session, client: AsyncClient, mock_clientdata_service
):
    """Test unauthorized access without valid token."""

    mock_validate_token.side_effect = Exception("Invalid token")

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        json={"internal_access": True},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
@patch("app.auth.auth_core.validate_token")
async def test_set_internal_access_invalid_payload(
    mock_validate_token, async_session, client: AsyncClient, mock_clientdata_service
):
    """Test with invalid request payload."""

    mock_validate_token.return_value = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "name": "John Doe",
    }

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    intake_id = uuid4()

    intake = Intake(
        id=intake_id,
        client_pseudo_id=client_pseudo_id,
        current_section="Education / Employment",
        status=IntakeStatus.IN_PROGRESS,
        internal_access=False,
    )

    async_session.add(intake)
    await async_session.commit()

    payload = {
        "sub": "auth0|1234567890",
        "email": "john.doe@example.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(minutes=10)).timestamp(),
    }
    token = jwt.encode(payload, "dummy-secret", algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        headers=headers,
        json={},  # Missing required field
    )

    assert response.status_code == 422

    response = await client.patch(
        f"/intake/admin/{client_pseudo_id}/internal-access",
        headers=headers,
        json={"internal_access": "not_a_boolean"},
    )

    assert response.status_code == 422
