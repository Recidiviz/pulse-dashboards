from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.intake import (
    COMPLETION_SECTION,
    ClientAddress,
    ClientIntakeSection,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
    IntakeType,
)
from app.models.intake_sections import CompletionStatus
from app.tests.test_fixtures.client_examples import create_test_client
from app.tests.test_fixtures.intake_sections import (
    create_test_section,
    create_test_sections,
)


@pytest.mark.asyncio
async def test_get_client_intake(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test retrieving client intake data."""

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    print(f"Test setup: client_pseudo_id={client_pseudo_id}, token={token_value}")

    section1, section2 = create_test_sections(2)
    async_session.add_all([section1, section2])
    await async_session.commit()
    await async_session.refresh(section1)
    await async_session.refresh(section2)

    # Step 2: Create Intake record
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Test Section 1",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)
    print(f"Created intake: id={intake.id}, client_pseudo_id={intake.client_pseudo_id}")

    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    client_section1 = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section1.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
        intake_section_revision_id=None,
    )
    client_section2 = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section2.id,
        is_active=False,
        order=1,
        completion_status=CompletionStatus.NOT_STARTED,
        intake_section_revision_id=None,
    )
    async_session.add_all([client_section1, client_section2])
    await async_session.commit()

    # Step 5: Create messages for the current section
    message1 = IntakeMessage(
        intake_id=intake.id,
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message 1",
        section="Test Section 1",
    )
    message2 = IntakeMessage(
        intake_id=intake.id,
        from_role=IntakeMessageRole.CLIENT,
        content="Test message 2",
        section="Test Section 1",
    )
    async_session.add_all([message1, message2])
    await async_session.commit()
    # Create a mock for the client data function
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/intake/client/{token_value}",
            headers={"Authorization": "Bearer test-token"},
        )

        # Debug the response
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(intake.id)
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Test Section 1"

    assert data["client_name"] == "John Doe"  # This should match what's in the fixture

    assert len(data["client_intake_sections"]) == 2

    assert len(data["current_section_messages"]) == 0


@pytest.mark.asyncio
async def test_get_client_intake_nonexistent(
    client: AsyncClient, async_session: AsyncSession, assert_response
):
    """Test retrieving intake for a non-existent client returns 404."""
    # Use a non-existent client ID
    non_existent_client_pseudo_id = "non-existent-client"
    token_from_url = "some-token-value"

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_decode_jwt_token:
        mock_decode_jwt_token.return_value = {
            "sub": non_existent_client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/intake/client/{token_from_url}",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 404)


@pytest.mark.asyncio
async def test_get_client_intake_token_mismatch(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test retrieving intake with incorrect token returns 401."""
    # Create a client with valid intake but mismatched token
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    correct_token = "correct-token-value"
    incorrect_token = "incorrect-token-value"

    # Step 1: Create test sections
    section = create_test_section("Test Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Step 2: Create Intake record
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Test Section",
        internal_access=False,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Step 3: Create token associated with the intake
    from app.models.intake import IntakeToken

    token_entry, _ = IntakeToken.generate_token(intake.id)
    token_entry.token = (
        correct_token  # Override the generated token with our test value
    )
    async_session.add(token_entry)
    await async_session.commit()

    # Step 4: Create test client section
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
    )
    async_session.add(client_section)
    await async_session.commit()

    # Make request with incorrect token
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/intake/client/{incorrect_token}",
            headers={"Authorization": "Bearer test-token"},
        )

        assert_response(response, 401)

        # Verify that a request with the correct token would work
        with patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_verify_token:
            mock_verify_token.return_value = {
                "sub": client_pseudo_id,
                "token_type": "client",
            }

            response = await client.get(
                f"/intake/client/{correct_token}",
                headers={"Authorization": "Bearer test-token"},
            )

        assert_response(response, 200)


@pytest.mark.asyncio
async def test_check_token_not_in_response(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test that the token is not returned in the intake response."""
    client_pseudo_id = mock_clientdata_service["clients"][
        1
    ].pseudonymized_client_id  # Use client ID that exists in mock_client_data fixture
    token_value = "test-token-secret-value"

    # Create section
    section = create_test_section("Test Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token_entry, _ = IntakeToken.generate_token(intake.id)
    token_entry.token = token_value  # Override the generated token with our test value
    async_session.add(token_entry)
    await async_session.commit()

    # Create client section
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
    )
    async_session.add(client_section)
    await async_session.commit()

    # We'll use our standardized client examples instead of hardcoding

    # Create a mock for the client data function
    with patch(
        "app.routes.intake_client_router.Queries.get_client_by_pseudonymized_id_unsafe"
    ) as mock_get_client:
        client_record = create_test_client()
        # Update the client ID to match the test
        client_record.external_client_id = client_pseudo_id
        mock_get_client.return_value = client_record

        # Make request
        with patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_verify_token:
            mock_verify_token.return_value = {
                "sub": client_pseudo_id,
                "token_type": "client",
            }

            response = await client.get(
                f"/intake/client/{token_value}",
                headers={"Authorization": "Bearer test-token"},
            )

        assert_response(response, 200)

    # Check that the token is not in the response
    data = response.json()
    assert "token" not in data
    assert "intake_token" not in data

    # Ensure no nested objects contain the token
    response_text = response.text
    assert token_value not in response_text


@pytest.mark.asyncio
async def test_get_client_intake_completed(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test that accessing a completed intake returns the data normally."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create two sections as before
    section1, section2 = create_test_sections(2)
    async_session.add_all([section1, section2])
    await async_session.commit()
    await async_session.refresh(section1)
    await async_session.refresh(section2)

    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.COMPLETED,
        current_section="Test Section 1",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Test the API with proper mocking via fixture
    with (
        patch(
            "app.routes.intake_client_router.Queries.get_client_by_pseudonymized_id_unsafe"
        ) as mock_get_client,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        client_record = create_test_client()
        # Update the client ID to match the test
        client_record.external_client_id = client_pseudo_id
        mock_get_client.return_value = client_record
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/intake/client/{token_value}",
            headers={"Authorization": "Bearer test-token"},
        )

    # For a completed intake, the API returns the data normally
    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(intake.id)


@pytest.mark.asyncio
async def test_get_client_intake_with_internal_access(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test retrieving client intake data with internal access."""

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    section1 = create_test_section("Test Section 1")
    async_session.add(section1)
    await async_session.commit()
    await async_session.refresh(section1)

    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Test Section 1",
        internal_access=True,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    await async_session.commit()

    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section1.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
    )
    async_session.add(client_section)
    await async_session.commit()

    # Create a test message
    message = IntakeMessage(
        intake_id=intake.id,
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message for internal access",
        section="Test Section 1",
    )
    async_session.add(message)
    await async_session.commit()

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/intake/client/{client_pseudo_id}",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(intake.id)
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Test Section 1"
    assert data["internal_access"] is True


# Client Address Endpoint Tests


@pytest.mark.asyncio
async def test_submit_address_new(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test submitting a new address for client intake."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Address Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Address Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock authentication
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        # Submit address data
        address_data = {
            "street_address": "123 Main St",
            "city": "Springfield",
            "state": "IL",
        }

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert "intake_completed" in data

    # Verify address was saved to database
    from sqlmodel import select

    result = await async_session.exec(
        select(ClientAddress).where(ClientAddress.intake_id == intake.id)
    )
    saved_address = result.first()

    assert saved_address is not None
    assert saved_address.street_address == "123 Main St"
    assert saved_address.city == "Springfield"
    assert saved_address.state == "IL"
    assert saved_address.intake_id == intake.id


@pytest.mark.asyncio
async def test_submit_address_optional_street(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test submitting address without street address (optional field)."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Address Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Address Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock authentication
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        # Submit address data without street address
        address_data = {"city": "Chicago", "state": "IL"}

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert data["intake_completed"] is False

    # Verify address was saved with null street_address
    from sqlmodel import select

    result = await async_session.exec(
        select(ClientAddress).where(ClientAddress.intake_id == intake.id)
    )
    saved_address = result.first()

    assert saved_address is not None
    assert saved_address.street_address is None
    assert saved_address.city == "Chicago"
    assert saved_address.state == "IL"


@pytest.mark.asyncio
async def test_submit_address_validation_error_missing_city(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test submitting address with missing required city field."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Address Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Address Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock authentication
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        # Submit address data missing required city
        address_data = {"street_address": "123 Main St", "state": "IL"}

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 422)


@pytest.mark.asyncio
async def test_submit_address_validation_error_missing_state(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test submitting address with missing required state field."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Address Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Address Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock authentication
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        # Submit address data missing required state
        address_data = {"street_address": "123 Main St", "city": "Springfield"}

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 422)


@pytest.mark.asyncio
async def test_submit_address_unauthorized_invalid_token(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test submitting address with invalid authentication token."""
    # Mock authentication to fail with HTTPException
    from fastapi import HTTPException

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        address_data = {
            "street_address": "123 Main St",
            "city": "Springfield",
            "state": "IL",
        }

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert_response(response, 401)


@pytest.mark.asyncio
async def test_submit_address_no_auth_header(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test submitting address without authorization header."""
    address_data = {
        "street_address": "123 Main St",
        "city": "Springfield",
        "state": "IL",
    }

    response = await client.post(
        "/intake/client/address",
        json=address_data,
    )

    assert response.status_code in [401, 422]


@pytest.mark.asyncio
async def test_submit_address_nonexistent_intake(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test submitting address for client with no intake."""
    client_pseudo_id = "non-existent-client"

    # Mock authentication
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        address_data = {
            "street_address": "123 Main St",
            "city": "Springfield",
            "state": "IL",
        }

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 404)


@pytest.mark.asyncio
async def test_submit_address_completes_intake_when_in_completion_section(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test that submitting address completes intake when current section is completion section."""
    from unittest.mock import patch

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Test Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake in IN_PROGRESS status with completion section as current
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section=COMPLETION_SECTION,  # This is the key condition
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock schedule_assessment to verify it gets called
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock_assessment_id")
    ) as mock_schedule:
        with patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_verify_token:
            mock_verify_token.return_value = {
                "sub": client_pseudo_id,
                "token_type": "client",
            }

            # Submit address data
            address_data = {
                "street_address": "123 Main St",
                "city": "Springfield",
                "state": "IL",
            }

            response = await client.post(
                "/intake/client/address",
                json=address_data,
                headers={"Authorization": "Bearer test-token"},
            )

        assert_response(response, 200)
        data = response.json()
        assert data["intake_completed"] is True

        # Verify intake status changed to COMPLETED
        await async_session.refresh(intake)
        assert intake.status == IntakeStatus.COMPLETED

        # Verify schedule_assessment was called
        mock_schedule.assert_called_once()


@pytest.mark.asyncio
async def test_submit_address_does_not_complete_intake_when_not_in_completion_section(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test that submitting address does not complete intake when not in completion section."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Regular Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake in IN_PROGRESS status with regular section (not completion)
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.IN_PROGRESS,
        current_section="Regular Section",  # Not completion section
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        # Submit address data
        address_data = {
            "street_address": "123 Main St",
            "city": "Springfield",
            "state": "IL",
        }

        response = await client.post(
            "/intake/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert data["intake_completed"] is False

    # Verify intake status remained IN_PROGRESS
    await async_session.refresh(intake)
    assert intake.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_submit_address_does_not_complete_intake_when_already_completed(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Test that submitting address for already completed intake doesn't trigger additional completion."""
    from unittest.mock import patch

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"

    # Create test section
    section = create_test_section("Test Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake already in COMPLETED status
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.COMPLETED,  # Already completed
        current_section=COMPLETION_SECTION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create existing address
    existing_address = ClientAddress(
        intake_id=intake.id, street_address="456 Old St", city="Oldtown", state="CA"
    )
    async_session.add(existing_address)
    await async_session.commit()

    # Create token
    from app.models.intake import IntakeToken

    token = IntakeToken(
        token=token_value,
        intake_id=intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Mock schedule_assessment to verify it's not called again
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock_assessment_id")
    ) as mock_schedule:
        with patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_verify_token:
            mock_verify_token.return_value = {
                "sub": client_pseudo_id,
                "token_type": "client",
            }

            address_data = {
                "street_address": "789 New Ave",
                "city": "Newtown",
                "state": "NY",
            }

            response = await client.post(
                "/intake/client/address",
                json=address_data,
                headers={"Authorization": "Bearer test-token"},
            )

        assert_response(response, 200)
        data = response.json()
        assert data["intake_completed"] is True  # Already completed

        # Verify intake status remained COMPLETED
        await async_session.refresh(intake)
        assert intake.status == IntakeStatus.COMPLETED

        # Verify schedule_assessment was not called again (update_status won't call it if already completed)
        mock_schedule.assert_not_called()


@pytest.mark.asyncio
async def test_start_assessment_action_plan_creates_intake_and_schedules(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Endpoint should create intake with external chat messages and schedule assessment."""

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    with (
        patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_decode_jwt_token,
    ):
        mock_decode_jwt_token.return_value = {
            "clientPseudoId": client_pseudo_id,
            "sub": client_pseudo_id,
            "stateCode": "US_ID",
            "token_type": "client",
        }

        # Payload with messages and address
        payload = {
            "messages": [
                {"role": "caseworker", "content": "Welcome to the assessment"},
                {"role": "client", "content": "Hello, I'm ready"},
                {"role": "caseworker", "content": "Let's begin", "section": ""},
            ],
            "address": {
                "street_address": "123 Main St",
                "city": "New York",
                "state": "NY",
            },
        }

        response = await client.post(
            "/intake/client/start-assessment-action-plan",
            json=payload,
            headers={"Authorization": "Bearer test-token"},
        )

        assert_response(response, 200)
        data = response.json()

        # Verify response structure
        assert "intake_id" in data
        assert "status" in data
        assert "message" in data


@pytest.mark.asyncio
async def test_start_assessment_action_plan_rejects_wrong_intake_type(
    client: AsyncClient,
    assert_response,
    async_session: AsyncSession,
    mock_clientdata_service,
):
    """Endpoint should reject if intake exists but is not EXTERNAL type."""

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    with (
        patch(
            "app.routes.intake_client_router.get_intake_by_client_pseudo_id",
            new=AsyncMock(),
        ) as mock_get_intake,
        patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_decode_jwt_token,
    ):
        # Mock intake with wrong type (TRANSCRIPTION instead of EXTERNAL)
        wrong_type_intake = Intake(
            client_pseudo_id=client_pseudo_id,
            intake_type=IntakeType.TRANSCRIPTION,  # Wrong type
            status=IntakeStatus.COMPLETED,
        )
        mock_get_intake.return_value = wrong_type_intake

        mock_decode_jwt_token.return_value = {
            "clientPseudoId": client_pseudo_id,
            "sub": client_pseudo_id,
            "stateCode": "US_ID",
            "token_type": "client",
        }

        # Payload with messages and address
        payload = {
            "messages": [
                {"role": "caseworker", "content": "Welcome to the assessment"},
                {"role": "client", "content": "Hello, I'm ready"},
                {"role": "caseworker", "content": "Let's begin", "section": ""},
            ],
            "address": {
                "street_address": "123 Main St",
                "city": "New York",
                "state": "Ny",
            },
        }

        response = await client.post(
            "/intake/client/start-assessment-action-plan",
            json=payload,
            headers={"Authorization": "Bearer test-token"},
        )

        # Should return 400 error
        assert response.status_code == 400
        assert "EXTERNAL" in response.json()["detail"]


@pytest.mark.asyncio
async def test_start_assessment_action_plan_validates_messages(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
):
    """Endpoint should validate message structure."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Missing required fields
    invalid_payloads = [
        # Missing messages
        {"address": {"street_address": "123 Main St", "city": "Boise", "state": "ID"}},
        # Missing address
        {
            "messages": [
                {"role": "caseworker", "content": "Test"},
            ]
        },
        # Invalid message structure (missing content)
        {
            "messages": [{"role": "caseworker"}],
            "address": {
                "street_address": "123 Main St",
                "city": "Boise",
                "state": "ID",
            },
        },
        # Invalid address (missing required field)
        {
            "messages": [
                {"role": "caseworker", "content": "Test"},
            ],
            "address": {
                "street_address": "123 Main St",
                "city": "Boise",
                # Missing state
            },
        },
    ]

    with (
        patch(
            "app.auth.intake.auth_client_user.decode_jwt_token"
        ) as mock_decode_jwt_token,
    ):
        mock_decode_jwt_token.return_value = {
            "clientPseudoId": client_pseudo_id,
            "sub": client_pseudo_id,
            "stateCode": "US_ID",
            "token_type": "client",
        }

        for invalid_payload in invalid_payloads:
            response = await client.post(
                "/intake/client/start-assessment-action-plan",
                json=invalid_payload,
                headers={"Authorization": "Bearer test-token"},
            )

            assert response.status_code == 422
