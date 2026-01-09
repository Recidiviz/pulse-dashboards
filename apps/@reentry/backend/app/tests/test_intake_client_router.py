import os
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.core.db import AsyncSession
from app.models.intake import (
    COMPLETION_SECTION,
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
    IntakeToken,
)
from app.models.intake_sections import CompletionStatus


@pytest.mark.asyncio
async def test_get_client_intake_by_token(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test retrieving client intake data with token"""
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.internal_access = False
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    token_value = "test-token-12345"
    # Create token
    token = IntakeToken(
        token=token_value,
        intake_id=mock_intake.id,
    )
    async_session.add(token)
    await async_session.commit()
    print(f"Test setup: client_pseudo_id={client_pseudo_id}, token={token_value}")

    mock_intake.current_section = "Test Section 1"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)
    print(
        f"Created intake: id={mock_intake.id}, client_pseudo_id={mock_intake.client_pseudo_id}"
    )

    # Create messages for the current section
    message1 = IntakeMessage(
        intake_id=mock_intake.id,
        from_role=IntakeMessageRole.CASEWORKER,
        content="Test message 1",
        section="Test Section 1",
    )
    message2 = IntakeMessage(
        intake_id=mock_intake.id,
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
            f"/external/client/by-token/{token_value}",
            headers={"Authorization": "Bearer test-token"},
        )

        # Debug the response
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(mock_intake.id)
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Test Section 1"

    assert data["client_name"] == "John Doe"  # This should match what's in the fixture

    # Sections now come from assessment_config, not ClientIntakeSection
    assert len(data["intake_sections"]) >= 1  # Config has sections defined

    assert len(data["current_section_messages"]) == 2
    # Check that the token is not in the response
    data = response.json()
    assert "token" not in data
    assert "intake_token" not in data

    # Ensure no nested objects contain the token
    response_text = response.text
    assert token_value not in response_text


@pytest.mark.asyncio
async def test_get_client_intake_nonexistent(
    client: AsyncClient, async_session: AsyncSession, assert_response
):
    """Test retrieving intake for a non-existent client returns 404."""
    # Use a non-existent client ID
    non_existent_client_pseudo_id = "non-existent-client"

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_decode_jwt_token:
        mock_decode_jwt_token.return_value = {
            "sub": non_existent_client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            "/external/client/",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 404)


@pytest.mark.asyncio
async def test_get_client_intake_token_mismatch(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test retrieving intake with incorrect token returns 401."""
    # Create a client with valid intake but mismatched token
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    correct_token = "correct-token-value"
    incorrect_token = "incorrect-token-value"

    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.current_section = "Test Section"
    mock_intake.internal_access = False
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create token associated with the intake
    from app.models.intake import IntakeToken

    # Create token
    token = IntakeToken(
        token=correct_token,
        intake_id=mock_intake.id,
    )
    async_session.add(token)
    await async_session.commit()

    # Note: ClientIntakeSections are no longer used - sections come from assessment_config

    # Make request with incorrect token
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            f"/external/client/by-token/{incorrect_token}",
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
            f"/external/client/by-token/{correct_token}",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)


@pytest.mark.asyncio
async def test_get_client_intake_with_internal_access(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test retrieving client intake data with internal access."""
    mock_intake.status = IntakeStatus.IN_PROGRESS
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    mock_intake.current_section = "Test Section 1"
    mock_intake.internal_access = True
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Sections now come from assessment_config, not ClientIntakeSection

    # Create a test message
    message = IntakeMessage(
        intake_id=mock_intake.id,
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
            "login_timestamp": datetime.utcnow().timestamp(),
        }

        response = await client.get(
            "/external/client/",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(mock_intake.id)
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Test Section 1"
    assert data["internal_access"] is True


@pytest.mark.asyncio
async def test_get_client_intake_completed(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test that a client with no active intakes do not get access."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    mock_intake.status = IntakeStatus.COMPLETED
    mock_intake.current_section = "Completion"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Test the API with proper mocking via fixture
    with (
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        # Update the client ID to match the test
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }

        response = await client.get(
            "/external/client/",
            headers={"Authorization": "Bearer test-token"},
        )

    # For an in progress intake, the API returns the data normally
    assert_response(response, 404)


@pytest.mark.asyncio
async def test_get_client_intake_legacy_with_client_intake_sections(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test that legacy intakes with ClientIntakeSection records still work."""
    from unittest.mock import patch

    from app.models.intake_sections import ClientIntakeSection, IntakeSection

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.status = IntakeStatus.IN_PROGRESS

    mock_intake.current_section = "Legacy Section"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create legacy IntakeSection and ClientIntakeSection
    section1 = IntakeSection(
        title="Legacy Section",
        description="A legacy section",
        required_information="Legacy info",
        order=0,
    )
    section2 = IntakeSection(
        title="Another Legacy Section",
        description="Another legacy section",
        required_information="More legacy info",
        order=1,
    )
    async_session.add_all([section1, section2])
    await async_session.commit()
    await async_session.refresh(section1)
    await async_session.refresh(section2)

    client_section1 = ClientIntakeSection(
        intake_id=mock_intake.id,
        intake_section_id=section1.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
    )
    client_section2 = ClientIntakeSection(
        intake_id=mock_intake.id,
        intake_section_id=section2.id,
        is_active=True,
        order=1,
        completion_status=CompletionStatus.NOT_STARTED,
    )
    async_session.add_all([client_section1, client_section2])
    await async_session.commit()

    # Refresh intake to load the client_intake_sections relationship
    await async_session.refresh(mock_intake)

    # Create messages for the current section with created_at in the past
    # so that it gets filtered out by the login_timestamp filter
    past_time = datetime.now() - timedelta(hours=1)
    message1 = IntakeMessage(
        intake_id=mock_intake.id,
        from_role=IntakeMessageRole.CASEWORKER,
        content="Legacy message 1",
        section="Legacy Section",
        created_at=past_time,
    )
    async_session.add(message1)
    await async_session.commit()

    # Mock JWT verification with login_timestamp after the message was created
    # to ensure the message is filtered out (it's before login time)
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
            "login_timestamp": datetime.now().timestamp(),
        }

        response = await client.get(
            "/external/client/",
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()

    assert data["id"] == str(mock_intake.id)
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["status"] == IntakeStatus.IN_PROGRESS.value
    assert data["current_section"] == "Legacy Section"

    # Should return sections from ClientIntakeSection (legacy path)
    assert len(data["intake_sections"]) == 2
    assert data["intake_sections"][0]["title"] == "Legacy Section"
    assert data["intake_sections"][1]["title"] == "Another Legacy Section"

    assert len(data["current_section_messages"]) == 0


# Client Address Endpoint Tests
@pytest.mark.asyncio
async def test_submit_address_new(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test submitting a new address for client intake."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create intake with IN_PROGRESS status
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.current_section = "Address Section"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

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
            f"/external/client/{mock_intake.id}/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert "intake_completed" in data

    # Verify address was saved to database
    from sqlmodel import select

    result = await async_session.exec(
        select(ClientAddress).where(ClientAddress.intake_id == mock_intake.id)
    )
    saved_address = result.first()

    assert saved_address is not None
    assert saved_address.street_address == "123 Main St"
    assert saved_address.city == "Springfield"
    assert saved_address.state == "IL"
    assert saved_address.intake_id == mock_intake.id


@pytest.mark.asyncio
async def test_submit_address_optional_street(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test submitting address without street address (optional field)."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.status = IntakeStatus.IN_PROGRESS
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
            f"/external/client/{mock_intake.id}/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert data["intake_completed"] is False

    # Verify address was saved with null street_address
    from sqlmodel import select

    result = await async_session.exec(
        select(ClientAddress).where(ClientAddress.intake_id == mock_intake.id)
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
    mock_intake,
):
    """Test submitting address with missing required city field."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

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
            f"/external/client/{mock_intake.id}/address",
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
    mock_intake,
):
    """Test submitting address with missing required state field."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

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
            f"/external/client/{mock_intake.id}/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 422)


@pytest.mark.asyncio
async def test_submit_address_no_auth_header(
    client: AsyncClient, async_session: AsyncSession, assert_response, mock_intake
):
    """Test submitting address without authorization header."""
    address_data = {
        "street_address": "123 Main St",
        "city": "Springfield",
        "state": "IL",
    }

    response = await client.post(
        f"/external/client/{mock_intake.id}/address",
        json=address_data,
    )

    assert response.status_code in [401, 422]


@pytest.mark.asyncio
async def test_submit_address_nonexistent_client(
    client: AsyncClient, async_session: AsyncSession, assert_response, mock_intake
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
            f"/external/client/{mock_intake.id}/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 401)


@pytest.mark.asyncio
async def test_submit_address_completes_intake_when_in_completion_section(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test that submitting address completes intake when current section is completion section."""
    from unittest.mock import patch

    # Create a test intake
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.current_section = COMPLETION_SECTION  # Set to completion section so address submission completes intake
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

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
                f"/external/client/{mock_intake.id}/address",
                json=address_data,
                headers={"Authorization": "Bearer test-token"},
            )

        assert_response(response, 200)
        data = response.json()
        print(f"Response data: {data}")
        print(f"Intake current_section: {mock_intake.current_section}")
        assert data["intake_completed"] is True

        # Verify intake status changed to COMPLETED
        await async_session.refresh(mock_intake)
        assert mock_intake.status == IntakeStatus.COMPLETED

        # Verify schedule_assessment was called
        mock_schedule.assert_called_once()


@pytest.mark.asyncio
async def test_submit_address_does_not_complete_intake_when_not_in_completion_section(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test that submitting address does not complete intake when not in completion section."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.status = IntakeStatus.IN_PROGRESS
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
            f"/external/client/{mock_intake.id}/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    assert_response(response, 200)
    data = response.json()
    assert data["intake_completed"] is False

    # Verify intake status remained IN_PROGRESS
    await async_session.refresh(mock_intake)
    assert mock_intake.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_submit_address_does_not_complete_intake_when_already_completed(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test that submitting address for already completed intake returns 404 (no active intake found)."""
    from unittest.mock import patch

    # Create a test intake with COMPLETED status
    # Since get_latest_active_intake only returns CREATED/IN_PROGRESS, this won't be found
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.status = IntakeStatus.COMPLETED
    mock_intake.current_section = COMPLETION_SECTION
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create existing address
    existing_address = ClientAddress(
        intake_id=mock_intake.id,
        street_address="456 Old St",
        city="Oldtown",
        state="CA",
    )
    async_session.add(existing_address)
    await async_session.commit()

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
            "/external/client/address",
            json=address_data,
            headers={"Authorization": "Bearer test-token"},
        )

    # Should return 404 because completed intakes are not returned by get_latest_active_intake
    assert_response(response, 404)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transcribe_audio_success(client: AsyncClient, mock_clientdata_service):
    """Test successful audio transcription using a real audio file"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    assert os.path.exists(
        audio_file_abs_path
    ), "Test audio file test-audio-libopus-webm.webm doesn't exist"

    # Read the audio file
    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    # Upload the file to the transcribe endpoint
    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram API to avoid real API calls
    mock_response = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "This is a successful test transcription"}
                    ]
                }
            ]
        }
    }

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        mock_transcribe.return_value = mock_response

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        # The test audio file contains "testing" or similar
        assert isinstance(result["transcription"], str)
        assert len(result["transcription"]) > 0
        assert result["transcription"] == "This is a successful test transcription"
        # Verify the mock was called
        mock_transcribe.assert_called_once()


@pytest.mark.asyncio
async def test_transcribe_audio_no_file(client: AsyncClient, mock_clientdata_service):
    """Test transcription endpoint without providing a file"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        response = await client.post(
            "external/client/transcribe",
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 422  # Unprocessable Entity
    assert "field required" in response.text.lower()


@pytest.mark.asyncio
async def test_transcribe_audio_empty_file(
    client: AsyncClient, mock_clientdata_service
):
    """Test transcription with an empty audio file"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # Create empty file
    files = {"file": ("empty.webm", BytesIO(b""), "audio/webm")}

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        # Mock the deepgram API to return an error or empty result
        mock_transcribe.side_effect = Exception("Invalid audio content")

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Invalid audio content" in result["detail"]


@pytest.mark.asyncio
async def test_transcribe_audio_deepgram_error(
    client: AsyncClient, mock_clientdata_service
):
    """Test transcription when Deepgram API fails"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        mock_transcribe.side_effect = Exception("Deepgram API error")

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Deepgram API error" in result["detail"]


@pytest.mark.asyncio
async def test_transcribe_audio_mocked_success(
    client: AsyncClient, mock_clientdata_service
):
    """Test transcription with mocked Deepgram response"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram response
    mock_response = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "This is a test transcription from Deepgram"}
                    ]
                }
            ]
        }
    }

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        mock_transcribe.return_value = mock_response

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        assert result["transcription"] == "This is a test transcription from Deepgram"
        # Verify the mock was called with correct parameters
        mock_transcribe.assert_called_once()
        call_args = mock_transcribe.call_args
        assert call_args[1]["diarize"] is False


@pytest.mark.asyncio
async def test_transcribe_audio_missing_transcript_in_response(
    client: AsyncClient, mock_clientdata_service
):
    """Test transcription when Deepgram response is missing transcript"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram response with missing transcript
    mock_response = {"results": {"channels": []}}

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        mock_transcribe.return_value = mock_response

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        # Should return None or empty when transcript is missing
        assert result["transcription"] is None or result["transcription"] == ""


@pytest.mark.asyncio
async def test_transcribe_audio_different_file_type(
    client: AsyncClient, mock_clientdata_service
):
    """Test transcription with a different audio file type"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    audio_file_relative_path = "data/audio/conversion/sample-1.mp3"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    if not os.path.exists(audio_file_abs_path):
        pytest.skip(f"Test audio file {audio_file_abs_path} doesn't exist")

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.mp3", BytesIO(audio_content), "audio/mp3")}

    # Mock Deepgram to handle different file type
    mock_response = {
        "results": {
            "channels": [
                {"alternatives": [{"transcript": "MP3 transcription successful"}]}
            ]
        }
    }

    with (
        patch(
            "app.routes.intake_client_router.deepgram_transcription_diarization",
            new_callable=AsyncMock,
        ) as mock_transcribe,
        patch("app.auth.intake.auth_client_user.decode_jwt_token") as mock_verify_token,
    ):
        mock_verify_token.return_value = {
            "sub": client_pseudo_id,
            "token_type": "client",
        }
        mock_transcribe.return_value = mock_response

        response = await client.post(
            "external/client/transcribe",
            files=files,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        assert result["transcription"] == "MP3 transcription successful"


# @pytest.mark.asyncio
# async def test_start_assessment_action_plan_creates_intake_and_schedules(
#     client: AsyncClient,
#     async_session: AsyncSession,
#     assert_response,
#     mock_clientdata_service,
#     seed_configs,
# ):
#     """Endpoint should create intake with external chat messages and schedule assessment."""

#     client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
#     # Get US_AZ assessment config ID (which has external intake type)
#     assessment_config_id = seed_configs["assessments"][("US_AZ", "default", 0)]

#     with (
#         patch(
#             "app.auth.intake.auth_client_user.decode_jwt_token"
#         ) as mock_decode_jwt_token,
#     ):
#         mock_decode_jwt_token.return_value = {
#             "clientPseudoId": client_pseudo_id,
#             "sub": client_pseudo_id,
#             "stateCode": "US_AZ",
#             "token_type": "client",
#         }

#         # Payload with messages and address
#         payload = {
#             "assessment_config_id": str(assessment_config_id),
#             "messages": [
#                 {"role": "caseworker", "content": "Welcome to the assessment"},
#                 {"role": "client", "content": "Hello, I'm ready"},
#                 {"role": "caseworker", "content": "Let's begin", "section": ""},
#             ],
#             "address": {
#                 "street_address": "123 Main St",
#                 "city": "New York",
#                 "state": "NY",
#             },
#         }

#         response = await client.post(
#             "/external/client/start-assessment-action-plan",
#             json=payload,
#             headers={"Authorization": "Bearer test-token"},
#         )

#         assert_response(response, 200)
#         data = response.json()

#         # Verify response structure
#         assert "intake_id" in data
#         assert "status" in data
#         assert "message" in data


# @pytest.mark.asyncio
# async def test_start_assessment_action_plan_rejects_wrong_intake_type(
#     client: AsyncClient,
#     assert_response,
#     async_session: AsyncSession,
#     mock_clientdata_service,
#     seed_configs,
#     mock_intake,
# ):
#     """Endpoint should reject if intake exists but is not EXTERNAL type."""

#     client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
#     # Get US_AZ assessment config ID (which has external intake type)
#     assessment_config_id = seed_configs["assessments"][("US_AZ", "default", 0)]

#     # Mock intake with wrong type (TRANSCRIPTION instead of EXTERNAL) and commit it
#     mock_intake.status = IntakeStatus.IN_PROGRESS
#     mock_intake.intake_type = IntakeType.TRANSCRIPTION
#     async_session.add(mock_intake)
#     await async_session.commit()
#     await async_session.refresh(mock_intake)

#     with (
#         patch(
#             "app.auth.intake.auth_client_user.decode_jwt_token"
#         ) as mock_decode_jwt_token,
#     ):
#         mock_decode_jwt_token.return_value = {
#             "clientPseudoId": client_pseudo_id,
#             "sub": client_pseudo_id,
#             "stateCode": "US_AZ",
#             "token_type": "client",
#         }

#         # Payload with messages and address
#         payload = {
#             "assessment_config_id": str(assessment_config_id),
#             "messages": [
#                 {"role": "caseworker", "content": "Welcome to the assessment"},
#                 {"role": "client", "content": "Hello, I'm ready"},
#                 {"role": "caseworker", "content": "Let's begin", "section": ""},
#             ],
#             "address": {
#                 "street_address": "123 Main St",
#                 "city": "New York",
#                 "state": "Ny",
#             },
#         }

#         response = await client.post(
#             "/external/client/start-assessment-action-plan",
#             json=payload,
#             headers={"Authorization": "Bearer test-token"},
#         )

#         # Since get_latest_active_external_intake filters by EXTERNAL type,
#         # it won't find the TRANSCRIPTION intake and will create a new EXTERNAL intake
#         # So this should succeed with 200
#         assert response.status_code == 200


# @pytest.mark.asyncio
# async def test_start_assessment_action_plan_rejects_non_external_config(
#     client: AsyncClient,
#     assert_response,
#     async_session: AsyncSession,
#     mock_clientdata_service,
#     seed_configs,
# ):
#     """Endpoint should reject if the assessment config is not of type EXTERNAL."""

#     client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
#     # Get US_UT assessment config ID (which has conversation intake type, not external)
#     assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

#     with (
#         patch(
#             "app.auth.intake.auth_client_user.decode_jwt_token"
#         ) as mock_decode_jwt_token,
#     ):
#         # Use US_UT which has conversation-type assessment config (not external)
#         mock_decode_jwt_token.return_value = {
#             "clientPseudoId": client_pseudo_id,
#             "sub": client_pseudo_id,
#             "stateCode": "US_UT",
#             "token_type": "client",
#         }

#         # Payload with messages and address
#         payload = {
#             "assessment_config_id": str(assessment_config_id),
#             "messages": [
#                 {"role": "caseworker", "content": "Welcome to the assessment"},
#                 {"role": "client", "content": "Hello, I'm ready"},
#                 {"role": "caseworker", "content": "Let's begin", "section": ""},
#             ],
#             "address": {
#                 "street_address": "123 Main St",
#                 "city": "New York",
#                 "state": "NY",
#             },
#         }

#         response = await client.post(
#             "/external/client/start-assessment-action-plan",
#             json=payload,
#             headers={"Authorization": "Bearer test-token"},
#         )

#         # Should return 422 error because assessment config is not external type
#         assert response.status_code == 422
#         assert "Invalid Intake type" in response.json()["detail"]


# @pytest.mark.asyncio
# async def test_start_assessment_action_plan_validates_messages(
#     client: AsyncClient,
#     async_session: AsyncSession,
#     assert_response,
#     mock_clientdata_service,
# ):
#     """Endpoint should validate message structure."""
#     client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

#     # Missing required fields
#     invalid_payloads = [
#         # Missing messages
#         {"address": {"street_address": "123 Main St", "city": "Boise", "state": "ID"}},
#         # Missing address
#         {
#             "messages": [
#                 {"role": "caseworker", "content": "Test"},
#             ]
#         },
#         # Invalid message structure (missing content)
#         {
#             "messages": [{"role": "caseworker"}],
#             "address": {
#                 "street_address": "123 Main St",
#                 "city": "Boise",
#                 "state": "ID",
#             },
#         },
#         # Invalid address (missing required field)
#         {
#             "messages": [
#                 {"role": "caseworker", "content": "Test"},
#             ],
#             "address": {
#                 "street_address": "123 Main St",
#                 "city": "Boise",
#                 # Missing state
#             },
#         },
#     ]

#     with (
#         patch(
#             "app.auth.intake.auth_client_user.decode_jwt_token"
#         ) as mock_decode_jwt_token,
#     ):
#         mock_decode_jwt_token.return_value = {
#             "clientPseudoId": client_pseudo_id,
#             "sub": client_pseudo_id,
#             "stateCode": "US_ID",
#             "token_type": "client",
#         }

#         for invalid_payload in invalid_payloads:
#             response = await client.post(
#                 "/external/client/start-assessment-action-plan",
#                 json=invalid_payload,
#                 headers={"Authorization": "Bearer test-token"},
#             )

#             # Pydantic validation errors return 422
#             assert response.status_code == 422
