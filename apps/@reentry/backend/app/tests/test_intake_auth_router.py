from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.routes.intake_auth_router import (
    VerifyDobFullnameRequest,
    VerifyStateDocIdRequest,
    verify_dob_fullname,
    verify_state_doc_id,
)
from fastapi import HTTPException


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def mock_request():
    return MagicMock()


@pytest.fixture
def valid_data():
    return {
        "recaptchaToken": "valid_token",
        "date_of_birth": "1990-01-01",
        "first_name": "John",
        "last_name": "Doe",
    }


@patch("httpx.AsyncClient")
@patch("app.routes.intake_auth_router.validate_dob_fullname")
async def test_validate_non_pseudo_id_verify_success(
    mock_validate, mock_httpx, mock_session, mock_request, valid_data
):
    # Mock reCAPTCHA response
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_httpx.return_value.__aenter__.return_value.post.return_value = mock_response

    # Mock validation result
    mock_result = MagicMock()
    mock_result.success = True
    mock_result.token_data = {"token": "jwt_token"}
    mock_result.client_pseudo_id = "client-pseudo-id-01"
    mock_validate.return_value = mock_result

    result = await verify_dob_fullname(
        mock_request, VerifyDobFullnameRequest(**valid_data), mock_session
    )

    assert result.status is True
    assert result.access_token == "jwt_token"
    assert result.client_pseudo_id == "client-pseudo-id-01"
    assert result.message == "Verification successful"


# TODO: Uncomment when reCAPTCHA is ready
# async def test_validate_non_pseudo_id_missing_recaptcha_token(
#     mock_session, mock_request
# ):
#     data = {
#         "recaptchaToken": "",
#         "date_of_birth": "1990-01-01",
#         "first_name": "John",
#         "last_name": "Doe",
#     }

#     with pytest.raises(HTTPException) as exc_info:
#         await verify_dob_fullname(
#             mock_request, VerifyDobFullnameRequest(**data), mock_session
#         )
#         pass

#     assert exc_info.value.status_code == 400

#     assert "Recaptcha token is required" in str(exc_info.value.detail)


# TODO: Uncomment when reCAPTCHA is ready
# @patch("httpx.AsyncClient")
# async def test_validate_non_pseudo_id_invalid_recaptcha(
#     mock_httpx, mock_session, mock_request, valid_data
# ):
#     # Mock invalid reCAPTCHA response
#     mock_response = MagicMock()
#     mock_response.json.return_value = {"success": False}
#     mock_httpx.return_value.__aenter__.return_value.post.return_value = mock_response

#     with pytest.raises(HTTPException) as exc_info:
#         await verify_dob_fullname(
#             mock_request, VerifyDobFullnameRequest(**valid_data), mock_session
#         )
#         pass

#     assert exc_info.value.status_code == 400
#     assert "Invalid reCAPTCHA token" in str(exc_info.value.detail)


@patch("httpx.AsyncClient")
@patch("app.routes.intake_auth_router.validate_dob_fullname")
async def test_validate_non_pseudo_id_validation_failure(
    mock_validate, mock_httpx, mock_session, mock_request, valid_data
):
    # Mock successful reCAPTCHA
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_httpx.return_value.__aenter__.return_value.post.return_value = mock_response

    # Mock validation failure
    mock_result = MagicMock()
    mock_result.success = False
    mock_result.error_message = "Validation failed"
    mock_validate.return_value = mock_result

    with pytest.raises(HTTPException) as exc_info:
        await verify_dob_fullname(
            mock_request, VerifyDobFullnameRequest(**valid_data), mock_session
        )
        pass

    assert exc_info.value.status_code == 400
    assert "Validation failed" in str(exc_info.value.detail)


@pytest.fixture
def valid_state_doc_id_data():
    return {
        "doc_id": "12345",
        "state_code": "US_ID",
    }


@patch("app.routes.intake_auth_router.validate_state_docid")
async def test_verify_state_doc_id_success(
    mock_validate, mock_session, mock_request, valid_state_doc_id_data
):
    # Mock validation result
    mock_result = MagicMock()
    mock_result.success = True
    mock_result.token_data = {"token": "jwt_token"}
    mock_result.client_pseudo_id = "client-pseudo-id-01"
    mock_validate.return_value = mock_result

    result = await verify_state_doc_id(
        mock_request, VerifyStateDocIdRequest(**valid_state_doc_id_data), mock_session
    )

    assert result.status is True
    assert result.access_token == "jwt_token"
    assert result.client_pseudo_id == "client-pseudo-id-01"
    assert result.message == "Verification successful"


@patch("app.routes.intake_auth_router.validate_state_docid")
async def test_verify_state_doc_id_validation_failure(
    mock_validate, mock_session, mock_request, valid_state_doc_id_data
):
    # Mock validation failure
    mock_result = MagicMock()
    mock_result.success = False
    mock_result.error_message = "No match for the provided DOC ID and state."
    mock_result.user_facing = True
    mock_validate.return_value = mock_result

    with pytest.raises(HTTPException) as exc_info:
        await verify_state_doc_id(
            mock_request,
            VerifyStateDocIdRequest(**valid_state_doc_id_data),
            mock_session,
        )

    assert exc_info.value.status_code == 400
    assert "No match for the provided DOC ID and state" in str(exc_info.value.detail)


@patch("app.routes.intake_auth_router.validate_state_docid")
async def test_verify_state_doc_id_internal_error(
    mock_validate, mock_session, mock_request, valid_state_doc_id_data
):
    # Mock an exception being raised
    mock_validate.side_effect = Exception("Database connection error")

    with pytest.raises(HTTPException) as exc_info:
        await verify_state_doc_id(
            mock_request,
            VerifyStateDocIdRequest(**valid_state_doc_id_data),
            mock_session,
        )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail["user_facing"] is False


# --------- Tests for verify_date_of_birth (dob+urltoken) ---------
@pytest.fixture
def valid_dob_urltoken_data():
    return {
        "token_from_url": "test-token-123",
        "date_of_birth": "1990-01-01",
    }


@patch("app.routes.intake_auth_router.validate_dob_urltoken")
async def test_verify_dob_urltoken_success(
    mock_validate, mock_session, mock_request, valid_dob_urltoken_data
):
    from app.routes.intake_auth_router import (
        VerifyDobUrlTokenRequest,
        verify_date_of_birth,
    )

    # Mock redis client on request
    mock_request.app.state.redis_client = MagicMock()

    # Mock validation result
    mock_result = MagicMock()
    mock_result.success = True
    mock_result.token_data = {"token": "jwt_token"}
    mock_result.client_pseudo_id = "client-pseudo-id-01"
    mock_validate.return_value = mock_result

    result = await verify_date_of_birth(
        mock_request, VerifyDobUrlTokenRequest(**valid_dob_urltoken_data), mock_session
    )

    assert result.status is True
    assert result.access_token == "jwt_token"
    assert result.client_pseudo_id == "client-pseudo-id-01"
    assert result.message == "Date of birth verified successfully"


@patch("app.routes.intake_auth_router.validate_dob_urltoken")
async def test_verify_dob_urltoken_validation_failure(
    mock_validate, mock_session, mock_request, valid_dob_urltoken_data
):
    from app.routes.intake_auth_router import (
        VerifyDobUrlTokenRequest,
        verify_date_of_birth,
    )

    # Mock redis client on request
    mock_request.app.state.redis_client = MagicMock()

    # Mock validation failure
    mock_result = MagicMock()
    mock_result.success = False
    mock_result.token_data = None
    mock_result.error_message = "Invalid date of birth"
    mock_validate.return_value = mock_result

    with pytest.raises(HTTPException) as exc_info:
        await verify_date_of_birth(
            mock_request,
            VerifyDobUrlTokenRequest(**valid_dob_urltoken_data),
            mock_session,
        )

    assert exc_info.value.status_code == 400
    assert "Invalid date of birth" in str(exc_info.value.detail)


@patch("app.routes.intake_auth_router.validate_dob_urltoken")
async def test_verify_dob_urltoken_internal_error(
    mock_validate, mock_session, mock_request, valid_dob_urltoken_data
):
    from app.routes.intake_auth_router import (
        VerifyDobUrlTokenRequest,
        verify_date_of_birth,
    )

    # Mock redis client on request
    mock_request.app.state.redis_client = MagicMock()

    # Mock an exception being raised
    mock_validate.side_effect = Exception("Internal server error")

    with pytest.raises(HTTPException) as exc_info:
        await verify_date_of_birth(
            mock_request,
            VerifyDobUrlTokenRequest(**valid_dob_urltoken_data),
            mock_session,
        )

    assert exc_info.value.status_code == 500
    assert "Internal server error" in str(exc_info.value.detail)


# --------- Tests for verify_firebase_token ---------
@pytest.fixture
def valid_firebase_request_data():
    return {
        "firebase_token": "abcd1234",
    }


@patch("httpx.AsyncClient")
@patch("app.routes.intake_auth_router.verify_client_from_firebase_token")
async def test_validate_firebase_token_success(
    mock_validate, mock_httpx, mock_session, mock_request, valid_firebase_request_data
):
    from app.routes.intake_auth_router import (
        VerifyFirebaseTokenRequest,
        verify_firebase_token,
    )

    # Mock validation result
    mock_result = MagicMock()
    mock_result.success = True
    mock_result.token_data = {"token": "jwt_token"}
    mock_result.client_pseudo_id = "client-pseudo-id-01"
    mock_validate.return_value = mock_result

    result = await verify_firebase_token(
        mock_request,
        VerifyFirebaseTokenRequest(**valid_firebase_request_data),
        mock_session,
    )

    assert result.status is True
    assert result.access_token == "jwt_token"
    assert result.client_pseudo_id == "client-pseudo-id-01"
    assert result.message == "Verification successful"


@patch("httpx.AsyncClient")
@patch("app.routes.intake_auth_router.verify_client_from_firebase_token")
async def test_validate_firebase_token_failure(
    mock_validate, mock_httpx, mock_session, mock_request, valid_firebase_request_data
):
    from app.routes.intake_auth_router import (
        VerifyFirebaseTokenRequest,
        verify_firebase_token,
    )

    # Mock validation failure
    mock_result = MagicMock()
    mock_result.success = False
    mock_result.error_message = "Validation failed"
    mock_validate.return_value = mock_result

    with pytest.raises(HTTPException) as exc_info:
        await verify_firebase_token(
            mock_request,
            VerifyFirebaseTokenRequest(**valid_firebase_request_data),
            mock_session,
        )

    assert exc_info.value.status_code == 400
    assert "Validation failed" in str(exc_info.value.detail)
