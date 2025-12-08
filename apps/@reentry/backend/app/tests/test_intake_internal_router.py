from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.routes.intake_internal_router import (
    VerifyNonPseudoId,
    VerifyStateDocId,
    verify_non_pseudonymized_id,
    verify_state_doc_id,
)


@pytest.mark.asyncio
async def test_verify_pseudo_date_of_birth_direct(
    async_session: AsyncSession,
):
    """Test the verify_pseudo_date_of_birth function directly."""

    from app.auth.intake.utils import ValidationResult
    from app.routes import intake_internal_router

    async def mock_validate_pseudo_dob(*args, **kwargs):
        """Mocked version that always returns success"""
        client_pseudo_id = "client-001"
        token_data = {
            "token": "test-token-12345",
            "client_pseudo_id": client_pseudo_id,
            "client_name": "John Doe",
            "full_name": {"given_name": "John", "surname": "Doe"},
        }
        return ValidationResult.success_result(token_data, client_pseudo_id)

    original_validate = intake_internal_router.validate_pseudo_dob
    intake_internal_router.validate_pseudo_dob = mock_validate_pseudo_dob

    try:
        # Test data
        pseudonymized_id = "pc-001"
        last_name = "Doe"
        date_of_birth = "1985/1/1"

        request = MagicMock()

        mock_app = MagicMock()
        mock_state = MagicMock()
        mock_state.redis_client = MagicMock()
        mock_app.state = mock_state
        request.app = mock_app

        data = MagicMock()
        data.last_name = last_name
        data.date_of_birth = date_of_birth

        response = await intake_internal_router.verify_pseudo_date_of_birth(
            request=request,
            data=data,
            pseudonymized_id=pseudonymized_id,
            session=async_session,
        )

        assert response.status is True
        assert response.access_token == "test-token-12345"
        assert response.token_type == "bearer"
        assert (
            response.message == "Verification successful"
        )  # Updated to match your actual message

    finally:
        intake_internal_router.validate_pseudo_dob = original_validate


@pytest.mark.asyncio
async def test_verify_pseudo_date_of_birth_wrong_name(
    async_session: AsyncSession,
    mock_clientdata_service,
):
    """Test validation failure due to incorrect last name."""

    client_pseudo_id = "pc-001"

    from app.auth.intake.utils import ValidationResult
    from app.routes import intake_internal_router

    async def mock_validate_pseudo_dob(*args, **kwargs):
        if "WrongName" in str(args) or "WrongName" in str(kwargs):
            return ValidationResult.error_result(
                "Incorrect last name. Please try again; 2 attempts remaining."
            )

        token_data = {"token": "fake-token"}
        return ValidationResult.success_result(token_data, client_pseudo_id)

    original_validate = intake_internal_router.validate_pseudo_dob
    intake_internal_router.validate_pseudo_dob = mock_validate_pseudo_dob

    try:
        # Test data
        last_name = "WrongName"  # Incorrect last name
        date_of_birth = "1985/1/1"  # Correct DOB

        request = MagicMock()

        mock_app = MagicMock()
        mock_state = MagicMock()
        mock_state.redis_client = MagicMock()
        mock_app.state = mock_state
        request.app = mock_app

        # Create request data
        data = MagicMock()
        data.last_name = last_name
        data.date_of_birth = date_of_birth

        with pytest.raises(HTTPException) as exc_info:
            await intake_internal_router.verify_pseudo_date_of_birth(
                request=request,
                data=data,
                pseudonymized_id=client_pseudo_id,
                session=async_session,
            )

        assert exc_info.value.status_code == 400
        assert "Incorrect last name" in exc_info.value.detail

    finally:
        intake_internal_router.validate_pseudo_dob = original_validate


@pytest.mark.asyncio
async def test_verify_pseudo_date_of_birth_wrong_dob(
    async_session: AsyncSession,
    mock_clientdata_service,
):
    """Test validation failure due to incorrect date of birth."""

    pseudonymized_id = "pc-001"

    from app.auth.intake.utils import ValidationResult
    from app.routes import intake_internal_router

    async def mock_validate_pseudo_dob(*args, **kwargs):
        if "1990/1/1" in str(args) or "1990/1/1" in str(kwargs):
            return ValidationResult.error_result(
                "Incorrect date of birth. Please try again; 2 attempts remaining."
            )

        token_data = {"token": "fake-token"}
        return ValidationResult.success_result(token_data, pseudonymized_id)

    original_validate = intake_internal_router.validate_pseudo_dob
    intake_internal_router.validate_pseudo_dob = mock_validate_pseudo_dob

    try:
        last_name = "Doe"
        date_of_birth = "1990/1/1"

        request = MagicMock()

        mock_app = MagicMock()
        mock_state = MagicMock()
        mock_state.redis_client = MagicMock()
        mock_app.state = mock_state
        request.app = mock_app

        data = MagicMock()
        data.last_name = last_name
        data.date_of_birth = date_of_birth

        with pytest.raises(HTTPException) as exc_info:
            await intake_internal_router.verify_pseudo_date_of_birth(
                request=request,
                data=data,
                pseudonymized_id=pseudonymized_id,
                session=async_session,
            )

        assert exc_info.value.status_code == 400
        assert "Incorrect date of birth" in exc_info.value.detail

    finally:
        intake_internal_router.validate_pseudo_dob = original_validate


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
@patch("app.routes.intake_internal_router.validate_non_pseudo_id")
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

    result = await verify_non_pseudonymized_id(
        mock_request, VerifyNonPseudoId(**valid_data), mock_session
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
#         await verify_non_pseudonymized_id(
#             mock_request, VerifyNonPseudoId(**data), mock_session
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
#         await verify_non_pseudonymized_id(
#             mock_request, VerifyNonPseudoId(**valid_data), mock_session
#         )
#         pass

#     assert exc_info.value.status_code == 400
#     assert "Invalid reCAPTCHA token" in str(exc_info.value.detail)


@patch("httpx.AsyncClient")
@patch("app.routes.intake_internal_router.validate_non_pseudo_id")
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
        await verify_non_pseudonymized_id(
            mock_request, VerifyNonPseudoId(**valid_data), mock_session
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


@patch("app.routes.intake_internal_router.validate_state_doc_id")
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
        mock_request, VerifyStateDocId(**valid_state_doc_id_data), mock_session
    )

    assert result.status is True
    assert result.access_token == "jwt_token"
    assert result.client_pseudo_id == "client-pseudo-id-01"
    assert result.message == "Verification successful"


@patch("app.routes.intake_internal_router.validate_state_doc_id")
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
            mock_request, VerifyStateDocId(**valid_state_doc_id_data), mock_session
        )

    assert exc_info.value.status_code == 400
    assert "No match for the provided DOC ID and state" in str(exc_info.value.detail)


@patch("app.routes.intake_internal_router.validate_state_doc_id")
async def test_verify_state_doc_id_internal_error(
    mock_validate, mock_session, mock_request, valid_state_doc_id_data
):
    # Mock an exception being raised
    mock_validate.side_effect = Exception("Database connection error")

    with pytest.raises(HTTPException) as exc_info:
        await verify_state_doc_id(
            mock_request, VerifyStateDocId(**valid_state_doc_id_data), mock_session
        )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail["user_facing"] is False
