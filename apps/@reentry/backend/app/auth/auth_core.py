import json
import time
from asyncio import Lock
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Callable, List, Optional

import httpx
import jwt
import redis.asyncio as redis
import structlog
from fastapi import FastAPI, HTTPException, Request, status
from jwt.api_jwk import PyJWKSet
from jwt.exceptions import MissingRequiredClaimError
from pydantic import BaseModel, EmailStr, Field, HttpUrl
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings

# Initialize Async Redis client for auth caching
redis_client = redis.from_url(settings.REDIS_URL)

# Internal domains for access control
# In production/staging, only Recidiviz domains are allowed
# In dev/demo/local, Monadical is also allowed for development purposes
_RECIDIVIZ_DOMAINS = ["@recidiviz.org", "@recidiviz-test.org"]
_DEV_DOMAINS = ["@monadical.com"]


def get_internal_domains() -> list[str]:
    """Get the list of internal domains based on environment."""
    if settings.ENV_NAME in ("staging", "prod"):
        return _RECIDIVIZ_DOMAINS
    return _RECIDIVIZ_DOMAINS + _DEV_DOMAINS


def is_internal_user(email: str | None) -> bool:
    """
    Check if the user email is from an internal domain.

    Internal users have access to admin features like Config Management.
    The allowed domains are environment-dependent:
    - staging/prod: Only @recidiviz.org and @recidiviz-test.org
    - dev/demo/local: Also includes @monadical.com for development
    """
    if not email:
        return False
    domains = get_internal_domains()
    return any(email.endswith(domain) for domain in domains)


# Cache expiration time for auth data (5 minutes, same as client data)
AUTH_CACHE_TTL = 300  # seconds

logger = structlog.get_logger(__name__)


async def _get_cached_auth0_userinfo(token: str) -> dict | None:
    """
    Get cached Auth0 userinfo response (async).

    Args:
        token: The Auth0 access token

    Returns:
        Cached userinfo dict or None if not found
    """
    # Create cache key based on token hash to avoid storing the actual token
    cache_key = f"auth0_userinfo:{hash(token)}"

    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info("Cache hit for Auth0 userinfo")
            json_str = (
                cached_data.decode("utf-8")
                if isinstance(cached_data, bytes)
                else str(cached_data)
            )
            return json.loads(json_str)
    except Exception as e:
        logger.error(f"Error retrieving cached Auth0 userinfo: {str(e)}")

    return None


async def _cache_auth0_userinfo(token: str, userinfo: dict) -> None:
    """
    Cache Auth0 userinfo response (async).

    Args:
        token: The Auth0 access token
        userinfo: The userinfo response to cache
    """
    cache_key = f"auth0_userinfo:{hash(token)}"

    try:
        await redis_client.setex(cache_key, AUTH_CACHE_TTL, json.dumps(userinfo))
        logger.info("Cached Auth0 userinfo")
    except Exception as e:
        logger.error(f"Error caching Auth0 userinfo: {str(e)}")


async def _get_cached_auth0_user_metadata(sub: str, token: str) -> dict | None:
    """
    Get cached Auth0 user metadata response (async).

    Args:
        sub: The Auth0 user subject ID
        token: The Auth0 access token

    Returns:
        Cached user metadata dict or None if not found
    """
    # Use sub as primary key since it's stable, token hash as secondary to handle token refresh
    cache_key = f"auth0_metadata:{sub}:{hash(token)}"

    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit for Auth0 user metadata for sub: {sub}")
            json_str = (
                cached_data.decode("utf-8")
                if isinstance(cached_data, bytes)
                else str(cached_data)
            )
            return json.loads(json_str)
    except Exception as e:
        logger.error(f"Error retrieving cached Auth0 user metadata: {str(e)}")

    return None


async def _cache_auth0_user_metadata(sub: str, token: str, metadata: dict) -> None:
    """
    Cache Auth0 user metadata response (async).

    Args:
        sub: The Auth0 user subject ID
        token: The Auth0 access token
        metadata: The user metadata response to cache
    """
    cache_key = f"auth0_metadata:{sub}:{hash(token)}"

    try:
        await redis_client.setex(cache_key, AUTH_CACHE_TTL, json.dumps(metadata))
        logger.info(f"Cached Auth0 user metadata for sub: {sub}")
    except Exception as e:
        logger.error(f"Error caching Auth0 user metadata: {str(e)}")


class UserProfile(BaseModel):
    """Pydantic Class to wrap and validate the user profile."""

    sub: str = Field(..., description="unique identifier in Auth0")
    given_name: str = Field(..., description="first name")
    family_name: str = Field(..., description="last name")
    nickname: str = Field(..., description="Nickname")
    name: str = Field(..., description="full name")
    picture: HttpUrl = Field(..., description="profile picture URL")
    updated_at: datetime = Field(..., description="last update date")
    email: EmailStr = Field(..., description="email address")
    email_verified: bool = Field(..., description="email verification status")

    locale: Optional[str] = Field(None, description="user locale")
    roles: Optional[list[str]] = Field(None, description="user roles")
    permissions: Optional[list[str]] = Field(None, description="user permissions")
    app_metadata: Optional[dict[str, Any]] = None


class Auth0Config(BaseModel):
    """Pydantic Class to wrap and validate our Auth0 configuration."""

    algorithms: List[str]
    audience: str
    client_id: str
    domain: str

    @property
    def issuer(self) -> str:
        """Get the issuer based on the domain."""
        return f"https://{self.domain}/"

    @property
    def jwks_url(self) -> str:
        """Get the URL for the JWKS based on the domain."""
        return f"https://{self.domain}/.well-known/jwks.json"


class JWKSCache:
    """Async Cache for JWKS (JSON Web Key Sets)."""

    def __init__(self, auth0_config: Auth0Config):
        self.auth0_config = auth0_config
        self._jwks = {}
        self._last_fetch = 0
        self._lock = Lock()
        self._ttl = 3600  # 1 hour TTL for JWKS

    async def _fetch_jwks(self) -> None:
        """Async fetch the JWKS from the Auth0 domain."""
        async with self._lock:
            # double-check locking
            now = time.time()
            if (
                now - self._last_fetch < 10
            ):  # no need to fetch again if fetched recently
                return

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.auth0_config.jwks_url, timeout=5)
                    response.raise_for_status()
                    jwks_data = PyJWKSet.from_json(response.text)
                    self._jwks = {jwk.key_id: jwk.key for jwk in jwks_data.keys}
                    self._last_fetch = now
                    logger.info("JWKS Cache refreshed successfully.")
            except Exception as e:
                logger.error(f"Error fetching JWKS: {e}")
                # if we have no keys at all, we must raise
                if not self._jwks:
                    raise

    async def get_key(self, key_id: str):
        """Get the RSA public key for the given key ID."""
        now = time.time()

        # check if we need to fetch new keys
        if key_id not in self._jwks or (now - self._last_fetch > self._ttl):
            await self._fetch_jwks()

        return self._jwks.get(key_id)


# Singleton JWKSCache instance
_jwks_instance = None


def get_jwks_cache(auth0_config: Auth0Config) -> JWKSCache:
    global _jwks_instance
    if _jwks_instance is None:
        _jwks_instance = JWKSCache(auth0_config)
    return _jwks_instance


@lru_cache
def get_auth0_config() -> Auth0Config:
    """load the Auth0 configuration from environment variables or configuration file."""

    return Auth0Config(
        algorithms=["RS256"],
        audience=settings.AUTH0_AUDIENCE,
        client_id=settings.AUTH0_CLIENT_ID,
        domain=settings.AUTH0_DOMAIN,
    )


async def validate_token(token: str, auth0_config: Auth0Config):
    """Validate the token and return the claims."""

    jwks_cache = get_jwks_cache(auth0_config)
    try:
        unverified_header = jwt.get_unverified_header(token)

        # valid is a jtw token
        if unverified_header.get("typ") != "JWT":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        rsa_key = await jwks_cache.get_key(unverified_header.get("kid", ""))
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=auth0_config.algorithms,
            issuer=auth0_config.issuer,
            audience=auth0_config.audience,
        )

        return payload

    except jwt.ExpiredSignatureError as e:
        logger.warning(f"Expired token: {e}.")

        # Get token info for logging.
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            if "exp" in unverified_payload:
                current_time = time.time()
                expired_duration_seconds = current_time - unverified_payload["exp"]
                current_datetime_utc = datetime.fromtimestamp(
                    current_time, tz=timezone.utc
                )
                token_expiration_datetime_utc = datetime.fromtimestamp(
                    unverified_payload["exp"], tz=timezone.utc
                )
                logger.warning(
                    f"Token expired. current_time_utc={current_datetime_utc}, "
                    f"expiration_time_utc={token_expiration_datetime_utc}, "
                    f"expired_duration_seconds={expired_duration_seconds}"
                )
        except Exception:
            logger.exception(
                "Could not extract expiration info from expired token for logging"
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (
        jwt.InvalidIssuerError,
        jwt.InvalidAudienceError,
        MissingRequiredClaimError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid claims, please check the audience and issuer",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.exception(f"Unexpected error validating token: {e}. ")
        token_preview = f"{token[:8]}..." if len(token) > 8 else token
        logger.exception(
            f"Token info. token_len: {len(token)}, token_preview: {token_preview}",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )


class Auth0Middleware(BaseHTTPMiddleware):
    """
    Middleware to validate Auth0 tokens on all requests.
    """

    def __init__(
        self, app: FastAPI, auth0_config: Auth0Config, exclude_paths: List[str]
    ):
        super().__init__(app)
        self.auth0_config = auth0_config
        self.exclude_paths = exclude_paths
        self.jwks_cache = get_jwks_cache(auth0_config)

    async def dispatch(self, request: Request, call_next: Callable):
        """
        Valid the token and add user information to the request state.
        """

        # Allow preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Exclude paths from authentication
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Get the token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authorization header is expected"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = auth_header.split(" ")[1]

        try:
            payload = await validate_token(token, self.auth0_config)
            # Add the user information to the request state
            request.state.user = payload
            return await call_next(request)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail},
                headers={"WWW-Authenticate": "Bearer"},
            )


def setup_auth(
    app: FastAPI,
    auth0_config: Auth0Config | None,
    exclude_paths: List[str],
    use_middleware: bool = False,
):
    """Setup the Auth0 middleware authentication for the FastAPI application."""

    if auth0_config is None:
        auth0_config = get_auth0_config()

    if use_middleware:
        app.add_middleware(
            Auth0Middleware,
            auth0_config=auth0_config,
            exclude_paths=exclude_paths,
        )


async def get_current_user(request: Request) -> JSONResponse | UserProfile:
    """
    Get the current user profile with caching for Auth0 API calls.

    This function now uses Redis caching to avoid repeated calls to Auth0 APIs
    for the same user data within the cache TTL period.
    """
    auth_header = request.headers.get("Authorization")
    if not hasattr(request.state, "user") or auth_header is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = auth_header.split(" ")[1]

    # Try to get userinfo from cache first
    user_info = await _get_cached_auth0_userinfo(token)
    if not user_info:
        # Cache miss, fetch from Auth0
        logger.info("Cache miss for Auth0 userinfo, fetching from API")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{settings.AUTH0_DOMAIN}/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info",
                )

            user_info = response.json()
            # Cache the userinfo response
            await _cache_auth0_userinfo(token, user_info)

    sub = user_info.get("sub")

    # Try to get user metadata from cache
    extra_info = await _get_cached_auth0_user_metadata(sub, token)

    if not extra_info:
        # Cache miss, fetch from Auth0 Management API
        logger.info(
            f"Cache miss for Auth0 user metadata for sub: {sub}, fetching from API"
        )
        async with httpx.AsyncClient() as client:
            extra_info_resp = await client.get(
                f"https://{settings.AUTH0_DOMAIN}/api/v2/users/{sub}",
                headers={"Authorization": f"Bearer {token}"},
            )

            if extra_info_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user metadata",
                )

            extra_info = extra_info_resp.json()
            # Cache the user metadata response
            await _cache_auth0_user_metadata(sub, token, extra_info)

    return UserProfile(**{**request.state.user, **user_info, **extra_info})


async def get_pseudonymized_id(
    request: Request, skip_impersonation: bool = False
) -> str:
    """
    Get the pseudonymized ID from the user's auth profile with caching.

    This function now uses Redis caching to avoid repeated calls to Auth0 APIs
    for the same user data within the cache TTL period.

    Returns:
        str: The pseudonymized ID of the authenticated user

    Raises:
        HTTPException: If user is not authenticated or pseudonymized ID is not found
    """
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    if not skip_impersonation:
        # Check for impersonation
        impersonated_email = request.headers.get("X-Impersonated-Email")
        if impersonated_email:
            from app.auth.impersonation import (
                get_impersonated_user_metadata,
                validate_impersonation_request,
            )

            target_email = await validate_impersonation_request(request)
            if target_email:
                app_metadata = await get_impersonated_user_metadata(target_email)
                pseudonymized_id = app_metadata.get("pseudonymizedId")
                if not pseudonymized_id:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Pseudonymized ID not found for impersonated user {target_email}",
                    )
                # Get caller email for logging
                auth_header = request.headers.get("Authorization")
                caller_token = auth_header.split(" ")[1]
                caller_info = await _get_cached_auth0_userinfo(caller_token)
                caller_email = (
                    caller_info.get("email", "unknown") if caller_info else "unknown"
                )
                logger.info(
                    "Impersonation active",
                    caller_email=caller_email,
                    target_email=target_email,
                )
                return pseudonymized_id

    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]

    # Try to get userinfo from cache first
    user_info = await _get_cached_auth0_userinfo(token)

    if not user_info:
        # Cache miss, fetch from Auth0
        logger.info(
            "Cache miss for Auth0 userinfo in get_pseudonymized_id, fetching from API"
        )
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{settings.AUTH0_DOMAIN}/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info",
                )

            user_info = response.json()
            # Cache the userinfo response
            await _cache_auth0_userinfo(token, user_info)

    sub = user_info.get("sub")

    # Try to get user metadata from cache
    extra_info = await _get_cached_auth0_user_metadata(sub, token)
    if not extra_info:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            logger.info(f"decoded token payload: {payload}")
            app_metadata = payload.get("https://dashboard.recidiviz.org/app_metadata")
        except (KeyError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to decode token access in {settings.ENV_NAME} environment.",
            )
    else:
        app_metadata = extra_info.get("app_metadata", {})

    pseudonymized_id = app_metadata.get("pseudonymizedId")
    logger.info(f"Pseudonymized ID: {pseudonymized_id}")
    if not pseudonymized_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pseudonymized ID not found in user profile",
        )

    return pseudonymized_id


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return auth_header.split(" ")[1]


def _parse_feature_variants(feature_variants: dict) -> dict:
    return {
        "is_zero_caseload_user": "zeroCaseloadUser" in feature_variants,
        "is_read_only_user": "readOnly" in feature_variants,
        "cpa_client_locations": [
            key.replace("CPA_LOCATION_", "")
            for key in feature_variants
            if key.startswith("CPA_LOCATION_")
        ],
    }


async def _build_user_context(
    email: str, feature_variants: dict, is_impersonating=False
):
    base = _parse_feature_variants(feature_variants)
    if is_impersonating:
        base["is_read_only_user"] = True
    return {
        "email": email,
        "is_impersonating": is_impersonating,
        **base,
    }


async def get_auth_user_context(request: Request, skip_impersonation: bool = False):
    if not hasattr(request.state, "user"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = _extract_token(request)

    user_info = await _get_cached_auth0_userinfo(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Userinfo not found")

    caller_email = user_info.get("email")

    # Impersonation - use validate_impersonation_request for security checks
    if not skip_impersonation:
        impersonated_email = request.headers.get("X-Impersonated-Email")

        if impersonated_email:
            # Import here to avoid circular dependency
            from app.auth.impersonation import (
                validate_impersonation_request,
                get_impersonated_user_metadata,
            )

            # Raises HTTPException on any authorization failure
            target_email = await validate_impersonation_request(request)

            target_metadata = await get_impersonated_user_metadata(target_email)
            feature_variants = target_metadata.get("featureVariants", {})

            return await _build_user_context(
                target_email,
                feature_variants,
                is_impersonating=True,
            )

    app_metadata = user_info.get("https://dashboard.recidiviz.org/app_metadata", {})
    feature_variants = app_metadata.get("featureVariants", {})

    user_context = await _build_user_context(caller_email, feature_variants)
    return user_context
