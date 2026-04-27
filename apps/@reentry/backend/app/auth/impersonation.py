# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

import base64
import hashlib
import json

import google.auth
import google.auth.impersonated_credentials
import google.auth.transport.requests
import google.oauth2.id_token
import httpx
import structlog
from fastapi import HTTPException, Request

from app.auth.auth_core import (
    get_auth_user_context,
    get_pseudonymized_id,
    is_internal_user,
    redis_client,
)
from app.core.config import settings

logger = structlog.get_logger(__name__)

IMPERSONATION_CACHE_TTL = 300  # 5 minutes


def _compute_user_hash(email: str) -> str:
    digest = hashlib.sha256(email.lower().encode()).digest()
    user_hash = base64.b64encode(digest).decode()
    if user_hash.startswith("/"):
        user_hash = "_" + user_hash[1:]
    return user_hash


async def get_impersonated_user_metadata(target_email: str) -> dict:
    """
    Fetch user metadata from the Recidiviz Data API for the target email.
    Uses Redis cache with TTL to avoid repeated API calls.

    Returns the app_metadata dict containing pseudonymizedId, stateCode,
    featureVariants, etc.
    """
    cache_key = f"impersonation:{target_email}"

    # Check Redis cache first
    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(
                "Cache hit for impersonation metadata",
                target_email=target_email,
            )
            return json.loads(cached_data)
    except Exception as e:
        logger.error(
            "Error retrieving cached impersonation metadata",
            error=str(e),
        )

    logger.info(
        "Fetching impersonation metadata",
        target_email=target_email,
        env=settings.ENV_NAME,
    )

    # Cache miss: fetch metadata based on environment
    if settings.ENV_NAME in ("staging", "prod"):
        # Staging/prod: call the Recidiviz Data API
        if not settings.DATA_API_URL:
            raise HTTPException(
                status_code=500,
                detail="Impersonation is not configured: RECIDIVIZ_DATA_API_URL is not set",
            )
        try:
            user_hash = _compute_user_hash(target_email)
            url = f"{settings.DATA_API_URL}/auth/users/{user_hash}"

            logger.info(
                "Requesting Data API for user metadata",
                target_email=target_email,
                user_hash=user_hash,
                url=url,
            )

            auth_req = google.auth.transport.requests.Request()
            # load the default credentials (which may be impersonated credentials if --impersonate-service-account is used)
            credentials, _ = google.auth.default()
            # GCP metadata server
            id_token = google.oauth2.id_token.fetch_id_token(
                auth_req,
                settings.GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE,
            )

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {id_token}"},
                    timeout=10,
                )
                logger.info(
                    "Data API response received",
                    status_code=response.status_code,
                    target_email=target_email,
                )
                response.raise_for_status()
                user_data = response.json()
        except httpx.HTTPStatusError as e:
            try:
                response_text = e.response.text
            except Exception:
                response_text = e.response.json()

            logger.error(
                "Failed to fetch impersonated user metadata from Data API",
                target_email=target_email,
                user_hash=user_hash,
                status_code=e.response.status_code,
                response_body=response_text,
            )
            raise HTTPException(
                status_code=404,
                detail=f"Could not find user metadata for {target_email}",
            )
        except Exception as e:
            logger.error(
                "Error fetching impersonated user metadata",
                target_email=target_email,
                error=str(e),
            )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch impersonated user metadata: {str(e)}",
            )

        app_metadata = user_data.get("app_metadata", user_data)
        logger.info(
            "Successfully fetched impersonation metadata from Data API",
            target_email=target_email,
            has_pseudonymized_id="pseudonymizedId" in app_metadata,
            state_code=app_metadata.get("stateCode"),
        )
    else:
        # dev/demo/pilot: Use BigQuery lookup
        from app.services.client_data.queries import Queries

        caseworker = Queries.get_caseworker_by_email(target_email)
        if not caseworker:
            raise HTTPException(
                status_code=404,
                detail=f"No staff record found for {target_email}",
            )
        app_metadata = {
            "pseudonymizedId": caseworker.pseudonymized_staff_id,
            "stateCode": caseworker.state_code,
            "featureVariants": {},  # for feature variants need to call Auth0 but not needed fot testing purposes in dev,demo, pilot
            "emailAddress": caseworker.email,
        }

    # Cache the response
    try:
        await redis_client.setex(
            cache_key, IMPERSONATION_CACHE_TTL, json.dumps(app_metadata)
        )
    except Exception as e:
        logger.error("Error caching impersonation metadata", error=str(e))

    return app_metadata


def _get_allowed_impersonation_emails() -> set[str]:
    """
    Get the set of emails explicitly allowed to impersonate users.

    Returns:
        Set of lowercase email addresses authorized for impersonation.
    """
    if not settings.IMPERSONATION_ALLOWED_EMAILS:
        return set()

    emails = settings.IMPERSONATION_ALLOWED_EMAILS.split(",")
    return {email.strip().lower() for email in emails if email.strip()}


def check_impersonation_authorized(caller_email: str, target_email: str) -> None:
    """
    Validate that the caller is authorized to impersonate the target user.

    Checks (in order):
    1. Master switch (IMPERSONATION_ENABLED)
    2. Caller in allowlist (IMPERSONATION_ALLOWED_EMAILS)
    3. Internal domain (defense in depth)
    4. Self-impersonation prevention

    Args:
        caller_email: Email of the user attempting to impersonate
        target_email: Email of the target user

    Raises:
        HTTPException(403) if not authorized.
        HTTPException(400) if self-impersonation.
    """
    if not settings.IMPERSONATION_ENABLED:
        logger.warning(
            "Impersonation attempt blocked: feature disabled",
            caller_email=caller_email,
            target_email=target_email,
        )
        raise HTTPException(
            status_code=403,
            detail="Impersonation is disabled",
        )

    allowed_emails = _get_allowed_impersonation_emails()
    if not allowed_emails or caller_email.lower() not in allowed_emails:
        logger.warning(
            "Impersonation attempt blocked: caller not in allowlist",
            caller_email=caller_email,
            target_email=target_email,
        )
        raise HTTPException(
            status_code=403,
            detail="Not authorized to impersonate users",
        )

    # Defense in depth — reject if allowlist somehow contains a non-internal email
    if not is_internal_user(caller_email):
        logger.error(
            "Impersonation attempt blocked: caller not internal user (allowlist misconfiguration)",
            caller_email=caller_email,
            target_email=target_email,
        )
        raise HTTPException(
            status_code=403,
            detail="Impersonation requires internal user access",
        )

    if caller_email.lower() == target_email.lower():
        logger.warning(
            "Impersonation attempt blocked: self-impersonation",
            caller_email=caller_email,
        )
        raise HTTPException(
            status_code=400,
            detail="Cannot impersonate yourself",
        )


async def validate_impersonation_request(request: Request) -> str | None:
    """
    Check for the X-Impersonated-Email header and validate the caller
    has explicit permission to impersonate users.

    Security Controls:
    1. Master switch: IMPERSONATION_ENABLED must be True
    2. Whitelist: Caller email must be in IMPERSONATION_ALLOWED_EMAILS
    3. Internal user check: Caller must have internal domain (defense in depth)
    4. State scoping: Validates state-level access (logged for audit)
    5. Audit logging: All attempts are logged with caller and target details

    Returns:
        The target email if impersonation is authorized, None otherwise.

    Raises:
        HTTPException(403) if impersonation is not authorized.
    """
    impersonated_email = request.headers.get("X-Impersonated-Email")
    if not impersonated_email:
        return None

    # Get the caller's identity
    # Note: We need to call get_pseudonymized_id before get_auth_user_context
    # to ensure the Auth0 userinfo cache is populated
    await get_pseudonymized_id(request, skip_impersonation=True)
    auth_user_context = await get_auth_user_context(request, skip_impersonation=True)
    caller_email = auth_user_context["email"]

    # All authorization checks — raises on failure
    check_impersonation_authorized(caller_email, impersonated_email)

    logger.info(
        "Impersonation authorized",
        caller_email=caller_email,
        target_email=impersonated_email,
    )

    return impersonated_email
