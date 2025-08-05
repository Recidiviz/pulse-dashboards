import logging
from datetime import date
from typing import Callable, List, Optional, Tuple

import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

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
from app.crud.intake import get_intake_by_client_id, get_intake_by_token
from app.services.client_data.queries import (
    get_client_by_names_and_dob,
    get_client_by_pseudonymized_id_unsafe,
    get_client_data_unsafe,
)

logger = logging.getLogger(__name__)
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


async def validate_dob(
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
    record = get_client_data_unsafe(external_client_id=intake.client_id)
    if not record:
        return ValidationResult.error_result("Verification failed. Please try again.")

    is_valid, _ = validate_credentials_and_dob(
        record, date_of_birth, validate_name=False
    )
    if not is_valid:
        return await record_validation_failure(request, redis_client, token_from_url)

    token_data = create_client_response(intake.client_id, record.full_name)
    return ValidationResult.success_result(token_data)


async def validate_pseudo_dob(
    request: Request,
    pseudonymized_id: str,
    last_name: str,
    date_of_birth: date,
    session: AsyncSession,
    redis_client: redis.Redis,
) -> ValidationResult:
    """
    Validate client by pseudonymized ID, last name, and date of birth.
    """
    rate_limit_key = f"pseudo:{pseudonymized_id}"

    # Early rate limit check
    should_continue, error_message, is_attempt_error = await handle_rate_limiting(
        redis_client, pseudonymized_id
    )
    if not should_continue:
        return ValidationResult.error_result(error_message)

    # Look up client by pseudonymized_id
    record = get_client_by_pseudonymized_id_unsafe(pseudonymized_id)
    if not record:
        return ValidationResult.error_result("Verification failed. Please try again.")

    is_valid, _ = validate_credentials_and_dob(
        record, date_of_birth, last_name, validate_name=True
    )

    if not is_valid:
        return await record_validation_failure(request, redis_client, rate_limit_key)

    client_id = record.external_client_id

    # Check if an intake record exists
    intake_record = await get_intake_by_client_id(session, client_id)
    if not intake_record or not intake_record.internal_access:
        logger.error(f"Intake record not found for client ID: {client_id}")
        return ValidationResult.error_result(
            "Login failed. Please contact your case worker for assistance."
        )

    token_data = create_client_response(client_id, record.full_name)
    return ValidationResult.success_result(token_data)


async def validate_non_pseudo_id(
    request: Request,
    first_name: str,
    last_name: str,
    date_of_birth: date,
    session: AsyncSession,
) -> ValidationResult:
    """
    Validate client existing in the bigquery database using first name, last name, and date of birth.
    """
    record = get_client_by_names_and_dob(
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
    )

    if not record:
        return ValidationResult.error_result("Verification failed. Please try again.")

    client_id = record.external_client_id

    # Check if an intake record exists
    intake_record = await get_intake_by_client_id(session, client_id)
    if not intake_record:
        logger.error(f"Intake record not found for client ID: {client_id}")
        return ValidationResult.error_result(
            "Login failed. Please contact your case worker for assistance."
        )

    if not intake_record.internal_access:
        logger.error(f"Intake not enabled for client ID: {client_id}")
        return ValidationResult.error_result(
            "Intake not enabled. Please contact your case worker for assistance."
        )

    token_data = create_client_response(client_id, record.full_name)
    return ValidationResult.success_result(token_data)


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
        self.include_paths = include_paths
        self.app = app

    async def dispatch(self, request: Request, call_next: Callable):
        if not any(request.url.path.startswith(path) for path in self.include_paths):
            return await call_next(request)

        if request.url.path.endswith("/verify-dob"):
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

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


def setup_client_auth(
    app: FastAPI,
    include_paths: List[str],
):
    app.add_middleware(
        ClientAuthMiddleware,
        include_paths=include_paths,
    )
    logger.info(f"Client auth middleware enabled for paths: {include_paths}")


async def verify_client_token(token: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Verify a client JWT token and extract the client_id.
    """
    try:
        payload = decode_jwt_token(token)

        client_id = payload.get("sub")

        if not client_id:
            return False, "Invalid token: missing client identifier", None

        token_type = payload.get("token_type")
        if token_type != "client":
            return False, "Invalid token type", None

        return True, None, client_id

    except HTTPException as e:
        return False, e.detail, None
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {str(e)}")
        return False, "Authentication failed", None
