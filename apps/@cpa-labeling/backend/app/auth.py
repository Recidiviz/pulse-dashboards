"""Auth0 JWT verification middleware."""

import json
import logging
from typing import Optional
from urllib.request import urlopen

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# Cache the JWKS (JSON Web Key Set) to avoid fetching on every request
_jwks_cache: Optional[dict] = None


def get_jwks() -> dict:
    """Fetch and cache the JWKS from Auth0."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    settings = get_settings()
    jwks_url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
    with urlopen(jwks_url) as response:
        _jwks_cache = json.loads(response.read())
    return _jwks_cache


def verify_token(token: str) -> dict:
    """Verify an Auth0 JWT token and return the payload."""
    try:
        import jwt as pyjwt
        from jwt import PyJWKClient
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PyJWT not installed. Run: pip install PyJWT[crypto]",
        )

    settings = get_settings()
    jwks_client = PyJWKClient(f"https://{settings.auth0_domain}/.well-known/jwks.json")

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except pyjwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")
    except pyjwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid issuer")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """FastAPI dependency that requires a valid Auth0 JWT token.

    Returns the decoded token payload.
    """
    settings = get_settings()

    # Skip auth in local development
    if settings.skip_auth:
        return {"sub": "local-dev", "email": "local-dev@example.com"}

    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header is expected")

    return verify_token(credentials.credentials)
