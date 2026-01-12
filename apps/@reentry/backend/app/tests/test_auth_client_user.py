from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.auth.intake.auth_client_user import verify_client_from_firebase_token
from app.services.client_data.types import ClientDataRecord, FullNameModel
from firebase_admin import auth


@pytest.fixture
def mock_request():
    return MagicMock()


@pytest.fixture
def mock_sentry():
    return MagicMock()


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def valid_firebase_token():
    return "token"


@pytest.fixture
def mock_decoded_token():
    """Mock decoded Firebase token with required claims."""
    return {
        "uid": "firebase-uid-123",
        "stateCode": "US_XX",
        "externalId": "ext-id-1",
        "iat": 1234567890,
        "exp": 9999999999,
    }


@pytest.fixture
def mock_client_record():
    """Mock client data record."""
    return ClientDataRecord(
        pseudonymized_client_id="pseudo-id-1",
        state_code="US_XX",
        external_client_id="ext-id-1",
        full_name=FullNameModel(given_names="John", surname="Doe"),
        birthdate=date(1985, 1, 1),
    )


@pytest.fixture
def mock_intake_record():
    """Mock intake record with internal access enabled."""
    mock_intake = MagicMock()
    mock_intake.client_pseudo_id = "pseudo-id-1"
    mock_intake.internal_access = True
    return mock_intake


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.sentry_sdk.capture_exception")
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_invalid_token(
    mock_verify_token,
    mock_sentry,
    mock_request,
    mock_session,
    valid_firebase_token,
):
    mock_verify_token.side_effect = auth.InvalidIdTokenError("Invalid token")

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    mock_sentry.assert_called()

    assert result.success is False
    assert result.error_message is not None
    assert (
        result.error_message
        == "Verification for user with Firebase token failed. Please contact your case worker for assistance."
    )
    assert result.token_data is None
    assert result.client_pseudo_id is None


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.sentry_sdk.capture_exception")
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_missing_state_code(
    mock_verify_token,
    mock_sentry,
    mock_request,
    mock_session,
    valid_firebase_token,
):
    mock_verify_token.return_value = {
        "uid": "firebase-uid-123",
        "externalId": "ext-id-1",
    }

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    mock_sentry.assert_called()

    assert result.success is False
    assert result.error_message is not None
    assert result.error_message == "Missing required claim from Firebase token"
    assert result.token_data is None
    assert result.client_pseudo_id is None


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.sentry_sdk.capture_exception")
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_missing_external_id(
    mock_verify_token,
    mock_sentry,
    mock_request,
    mock_session,
    valid_firebase_token,
):
    mock_verify_token.return_value = {
        "uid": "firebase-uid-123",
        "stateCode": "US_XX",
    }

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    mock_sentry.assert_called()

    assert result.success is False
    assert result.error_message is not None
    assert result.error_message == "Missing required claim from Firebase token"
    assert result.token_data is None
    assert result.client_pseudo_id is None


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.sentry_sdk.capture_exception")
@patch(
    "app.auth.intake.auth_client_user.Queries.get_client_by_doc_id_and_state"
)
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_client_not_found(
    mock_verify_token,
    mock_get_client,
    mock_sentry,
    mock_request,
    mock_session,
    valid_firebase_token,
    mock_decoded_token,
):
    mock_verify_token.return_value = mock_decoded_token
    mock_get_client.return_value = None

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    assert result.success is False
    assert result.error_message == "Could not find a matching client. Please try again."
    assert result.token_data is None
    assert result.client_pseudo_id is None

    mock_sentry.assert_called_once_with("Could not find a matching client")


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.get_latest_active_conversation_intake")
@patch(
    "app.auth.intake.auth_client_user.Queries.get_client_by_doc_id_and_state"
)
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_no_intake_record(
    mock_verify_token,
    mock_get_client,
    mock_get_intake,
    mock_request,
    mock_session,
    valid_firebase_token,
    mock_decoded_token,
    mock_client_record,
):
    mock_verify_token.return_value = mock_decoded_token
    mock_get_client.return_value = mock_client_record
    mock_get_intake.return_value = None

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    assert result.success is False
    assert (
        result.error_message
        == "Intake not enabled. Please contact your case worker for assistance."
    )
    assert result.token_data is None
    assert result.client_pseudo_id is None


@pytest.mark.asyncio
@patch("app.auth.intake.auth_client_user.create_client_response")
@patch("app.auth.intake.auth_client_user.get_latest_active_conversation_intake")
@patch(
    "app.auth.intake.auth_client_user.Queries.get_client_by_doc_id_and_state"
)
@patch("app.auth.intake.auth_client_user.auth.verify_id_token")
async def test_verify_client_from_firebase_token_success(
    mock_verify_token,
    mock_get_client,
    mock_get_intake,
    mock_create_response,
    mock_request,
    mock_session,
    valid_firebase_token,
    mock_decoded_token,
    mock_client_record,
    mock_intake_record,
):
    mock_verify_token.return_value = mock_decoded_token
    mock_get_client.return_value = mock_client_record
    mock_get_intake.return_value = mock_intake_record
    mock_create_response.return_value = {
        "token": "jwt-token-123",
        "client_pseudo_id": "pseudo-id-1",
        "client_name": "John Doe",
    }

    result = await verify_client_from_firebase_token(
        mock_request, valid_firebase_token, mock_session
    )

    assert result.success is True
    assert result.token_data is not None
    assert result.client_pseudo_id == "pseudo-id-1"
    assert result.error_message is None

    mock_verify_token.assert_called_once_with(valid_firebase_token)

    mock_get_client.assert_called_once_with(state_code="US_XX", doc_id="ext-id-1")

    mock_get_intake.assert_called_once_with(mock_session, "pseudo-id-1")

    mock_create_response.assert_called_once_with(
        "pseudo-id-1", mock_client_record.full_name
    )
