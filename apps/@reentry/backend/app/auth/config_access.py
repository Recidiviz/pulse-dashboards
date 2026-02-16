"""
Config Management access token utilities.

Provides short-lived JWT tokens for password-gated access to config management
in environments where CONFIG_MANAGEMENT_PASSWORD is set (demo/staging/prod).
"""

from datetime import datetime, timedelta
from typing import Optional

import jwt
import structlog
from fastapi import HTTPException

from app.core.config import settings

logger = structlog.get_logger(__name__)

CONFIG_ACCESS_TOKEN_TYPE = "config_access"


def is_password_gate_enabled() -> bool:
    """Check if the password gate is enabled (password is configured)."""
    return bool(settings.CONFIG_MANAGEMENT_PASSWORD)


def verify_config_password(password: str) -> bool:
    """Verify the provided password against the configured one."""
    if not is_password_gate_enabled():
        return True
    return password == settings.CONFIG_MANAGEMENT_PASSWORD


def create_config_access_token(email: str) -> str:
    """
    Create a short-lived JWT for config management access.

    Args:
        email: The email of the authenticated user.

    Returns:
        Encoded JWT string.
    """
    expiry_minutes = settings.CONFIG_ACCESS_TOKEN_EXPIRY_MINUTES
    payload = {
        "sub": email,
        "token_type": CONFIG_ACCESS_TOKEN_TYPE,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=expiry_minutes),
    }
    return jwt.encode(
        payload,
        key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_config_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a config access token.

    Args:
        token: The JWT string to decode.

    Returns:
        The decoded payload dict, or None if invalid.

    Raises:
        HTTPException: If the token is expired or invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "token_type"]},
        )
        if payload.get("token_type") != CONFIG_ACCESS_TOKEN_TYPE:
            raise HTTPException(status_code=401, detail="Invalid config access token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Config access token has expired. Please re-enter the password.",
        )
    except jwt.PyJWTError as e:
        logger.warning("Invalid config access token", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid config access token")
