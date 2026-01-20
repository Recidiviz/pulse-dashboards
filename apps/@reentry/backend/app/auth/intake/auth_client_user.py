import logging
from datetime import date
from typing import Callable, List, Optional, Tuple

import redis.asyncio as redis
import sentry_sdk
import structlog
from app.auth.intake.utils import (
    ValidationResult,
    create_client_response,
    decode_jwt_token,
    validate_credentials_and_dob,
)
from app.auth.intake.verification_attempts import (
    check_cooloff_status,
    get_attempts_remaining,
    record_failed_attempt,
)
from app.core.db import AsyncSession
from app.crud.intake import get_intake_by_token, get_latest_active_conversation_intake
from app.services.client_data.queries import Queries
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.security import HTTPBearer
from firebase_admin import auth
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = structlog.get_logger(__name__)
security = HTTPBearer()


async def handle_rate_limiting(
    redis_client: redis.Redis, token_from_url: str
) -> Tuple[bool, Optional[str], bool]:
    # Early rate limit check using token
    try:
        is_blocked, remaining_minutes, next_attempt_time = await check_cooloff_status(
            redis_client, token_from_url
        )

        if is_blocked and next_attempt_time:
            return (
                False,
                "Too many failed attempts. Please wait a few minutes before you try again.",
                True,
            )
        return True, None, False
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
        return (
            False,
            "Service temporarily unavailable. Please try again later.",
            False,
        )


async def record_validation_failure(
    request: Request, redis_client: redis.Redis, rate_limit_key: str
) -> ValidationResult:
    try:
        client_ip = request.client.host if hasattr(request, "client") else None
        await record_failed_attempt(redis_client, rate_limit_key, client_ip)

        (
            is_blocked,
            remaining_minutes,
            next_attempt_time,
        ) = await check_cooloff_status(redis_client, rate_limit_key)

        if is_blocked and next_attempt_time:
            return ValidationResult.error_result(
                "Too many failed attempts. Please wait a few minutes before you try again."
            )
        else:
            attempts_remaining = await get_attempts_remaining(
                redis_client, rate_limit_key
            )
            error_msg = f"Incorrect; Please try again; {attempts_remaining} attempt"
            error_msg += "s" if attempts_remaining > 1 else ""
            error_msg += " remaining."
            return ValidationResult.error_result(error_msg)

    except Exception as e:
        logger.error(f"Failed to record attempt: {e}")
        return ValidationResult.error_result("Verification failed. Please try again.")


async def validate_dob_urltoken(
    request: Request,
    token_from_url: str,
    date_of_birth: date,
    session: AsyncSession,
    redis_client: redis.Redis,
) -> ValidationResult:
    """
    Validate client using date of birth and token.
    """
    # Early rate limit check
    should_continue, error_message, is_attempt_error = await handle_rate_limiting(
        redis_client, token_from_url
    )
    if not should_continue:
        return ValidationResult.error_result(error_message)
    token_obj, intake = await get_intake_by_token(session, token_from_url)
    if not token_obj or not intake:
        return ValidationResult.error_result("Login failed. Please try again.")
    record = Queries.get_client_by_pseudonymized_id_unsafe(intake.client_pseudo_id)
    if not record:
        return ValidationResult.error_result("Verification failed. Please try again.")

    is_valid, _ = validate_credentials_and_dob(
        record, date_of_birth, validate_name=False
    )
    if not is_valid:
        return await record_validation_failure(request, redis_client, token_from_url)

    token_data = create_client_response(intake.client_pseudo_id, record.full_name)
    return ValidationResult.success_result(token_data, intake.client_pseudo_id)


async def validate_dob_fullname(
    request: Request,
    first_name: str,
    last_name: str,
    date_of_birth: date,
    session: AsyncSession,
) -> ValidationResult:
    """
    Validate client existing in the bigquery database using first name, last name, and date of birth.
    """
    record = Queries.get_client_by_names_and_dob(
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
    )

    if not record:
        return ValidationResult.error_result(
            "No match for the provided name and date of birth. Please try again."
        )

    client_pseudo_id = record.pseudonymized_client_id

    # Check if an intake record exists
    intake_record = await get_latest_active_conversation_intake(
        session, client_pseudo_id
    )
    if not intake_record:
        logger.error(
            f"Intake record not found for client pseudo ID: {client_pseudo_id}"
        )
        return ValidationResult.error_result(
            "Intake not enabled. Please contact your case worker for assistance."
        )

    if not intake_record.internal_access:
        logger.error(f"Intake not enabled for client pseudo ID: {client_pseudo_id}")
        return ValidationResult.error_result(
            "Internal access is not enabled. Please contact your case worker for assistance."
        )

    token_data = create_client_response(client_pseudo_id, record.full_name)
    return ValidationResult.success_result(token_data, client_pseudo_id)


async def validate_state_docid(
    request: Request,
    doc_id: str,
    state_code: str,
    session: AsyncSession,
) -> ValidationResult:
    """
    Validate client existing in the bigquery database using DOC ID and state code.
    """
    record = Queries.get_client_by_doc_id_and_state(
        doc_id=doc_id,
        state_code=state_code,
    )

    if not record:
        return ValidationResult.error_result(
            "No match for the provided DOC ID and state. Please try again."
        )

    client_pseudo_id = record.pseudonymized_client_id

    # Check if an intake record exists
    intake_record = await get_latest_active_conversation_intake(
        session, client_pseudo_id
    )
    if not intake_record:
        logger.error(
            f"Intake record not found for client pseudo ID: {client_pseudo_id}"
        )
        return ValidationResult.error_result(
            "Intake not enabled. Please contact your case worker for assistance."
        )

    if not intake_record.internal_access:
        logger.error(f"Intake not enabled for client pseudo ID: {client_pseudo_id}")
        return ValidationResult.error_result(
            "Internal access is not enabled. Please contact your case worker for assistance."
        )

    token_data = create_client_response(client_pseudo_id, record.full_name)
    return ValidationResult.success_result(token_data, client_pseudo_id)


async def verify_client_from_firebase_token(
    request: Request,
    token_str: str,
    requested_client_pseudo_id: str,
    session: AsyncSession,
) -> ValidationResult:
    """
    Validate client using Firebase ID token from the JII app surfaced on Edovo tablets.
    This is an alternative authentication method to DOB verification.
    """
    try:
        logger.info("Validating token")
        decoded_token = auth.verify_id_token(token_str)

    except Exception as exc:
        logger.error(f"Error verifying Firebase token: {exc}", exc_info=True)
        sentry_sdk.capture_exception(exc)
        return ValidationResult.error_result(
            "Verification for user with Firebase token failed. Please contact your case worker for assistance."
        )

    state_code = decoded_token.get("stateCode")
    external_id = decoded_token.get("externalId")
    user_pseudo_id = decoded_token.get("pseudonymizedId", "")
    permissions_list = decoded_token.get("permissions", [])
    has_elevated_access = "global_write" in permissions_list

    # Validate state code exists
    if not state_code:
        error_msg = "Firebase token missing stateCode claim"
        logger.warning(error_msg)
        sentry_sdk.capture_exception(ValueError(error_msg))
        return ValidationResult.error_result(
            "Missing state code claim from Firebase token"
        )

    # If user has a pseudo ID, then the user is a JII. Verify pseudo ID from token matches request
    if user_pseudo_id and user_pseudo_id != requested_client_pseudo_id:
        error_msg = f"Pseudo ID mismatch: token has {user_pseudo_id}, request has {requested_client_pseudo_id}"
        logger.warning(error_msg)
        sentry_sdk.capture_exception(ValueError(error_msg))
        return ValidationResult.error_result(
            "Pseudo ID from token does not match request"
        )

    # If the user doesn't have a pseudo ID, check that the user is allowed to make the request
    if not user_pseudo_id and not has_elevated_access:
        error_msg = (
            "User without external_id / pseudo ID must have global_write permission"
        )
        logger.warning(error_msg)
        sentry_sdk.capture_exception(ValueError(error_msg))
        return ValidationResult.error_result(
            "Insufficient permissions for this operation"
        )

    # The pseudo IDs used in the request to this endpoint, i.e. the pseudo IDs in Opportunities,
    # are generated differently from the pseudo IDs generated and used internally in CPA.
    record = Queries.get_client_by_workflows_pseudonymized_id_unsafe(
        requested_client_pseudo_id
    )

    if not record:
        sentry_sdk.capture_exception(ValueError("Could not find a matching client"))
        return ValidationResult.error_result(
            "Could not find a matching client for this ID. Please try again."
        )

    internal_client_pseudo_id = record.pseudonymized_client_id

    # Check if an intake record exists
    intake_record = await get_latest_active_conversation_intake(
        session, internal_client_pseudo_id
    )
    if not intake_record:
        logger.error(
            f"Intake record not found for client pseudo ID: {internal_client_pseudo_id}"
        )
        return ValidationResult.error_result(
            "Intake not enabled. Please contact your case worker for assistance."
        )

    if not intake_record.internal_access:
        logger.error(
            f"Intake not enabled for client pseudo ID: {internal_client_pseudo_id}"
        )
        return ValidationResult.error_result(
            "Internal access is not enabled. Please contact your case worker for assistance."
        )

    token_data = create_client_response(internal_client_pseudo_id, record.full_name)
    return ValidationResult.success_result(token_data, internal_client_pseudo_id)


class ClientAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate client JWT tokens on specified routes.
    Redis is not required for the middleware itself.
    """

    def __init__(
        self,
        app: FastAPI,
        include_paths: List[str] = [],
    ):
        super().__init__(app)
        self.app = app
        self.include_paths = include_paths

    async def dispatch(self, request: Request, call_next: Callable):
        if not any(request.url.path.startswith(path) for path in self.include_paths):
            return await call_next(request)

        if request.url.path.startswith("/external/client/verify"):
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path.startswith("/external/client"):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Authorization header is expected"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            token = auth_header.split(" ")[1]

            try:
                payload = decode_jwt_token(token)
                request.state.client = payload

                return await call_next(request)
            except HTTPException as e:
                return JSONResponse(
                    status_code=e.status_code,
                    content={"detail": e.detail},
                    headers={"WWW-Authenticate": "Bearer"},
                )
        return await call_next(request)


def setup_client_auth(
    app: FastAPI,
    include_paths: List[str],
):
    app.add_middleware(
        ClientAuthMiddleware,
        include_paths=include_paths,
    )
    logger.info(f"Client auth middleware enabled for paths: {include_paths}")


# Used to authenticate the socket connection
async def verify_client_token(token: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Verify a client JWT token and extract the client_pseudo_id.
    """
    try:
        payload = decode_jwt_token(token)

        client_pseudo_id = payload.get("sub")

        if not client_pseudo_id:
            return False, "Invalid token: missing client pseudo identifier", None

        token_type = payload.get("token_type")
        if token_type != "client":
            return False, "Invalid token type", None

        return True, None, client_pseudo_id

    except HTTPException as e:
        return False, e.detail, None
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {str(e)}")
        return False, "Authentication failed", None
