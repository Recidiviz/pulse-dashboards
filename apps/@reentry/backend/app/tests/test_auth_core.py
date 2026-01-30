import json
import time
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from fastapi import FastAPI, HTTPException
from starlette.testclient import TestClient

from app.auth.auth_core import (
    Auth0Config,
    Auth0Middleware,
    JWKSCache,
    UserProfile,
    get_current_user,
    get_pseudonymized_id,
    validate_token,
)


@pytest.fixture
def auth0_config():
    return Auth0Config(
        algorithms=["RS256"],
        audience="test-audience",
        client_id="test-client-id",
        domain="test-domain.auth0.com",
    )


@pytest.fixture
def mock_redis():
    """Mock Redis client for auth caching tests"""
    with patch("app.auth.auth_core.redis_client") as mock_client:
        # Configure mock to return None (cache miss) by default
        mock_client.get.return_value = None
        mock_client.setex.return_value = True
        yield mock_client


@pytest.fixture
def mock_jwks():
    mock_key = MagicMock()
    return {"test-kid": mock_key}


@pytest.fixture
def mock_jwks_cache(auth0_config, mock_jwks):
    with patch("app.auth.JWKSCache._fetch_jwks"):
        cache = JWKSCache(auth0_config)
        cache._jwks = mock_jwks
        return cache


def create_jwt_payload(expired: bool = False):
    # current time and expiration time 1 hour (+/-) from now
    now = int(time.time())
    exp = now + 3600 if not expired else now - 3600

    return {
        "sub": "auth0|1234567890",
        "given_name": "John",
        "family_name": "Doe",
        "nickname": "johndoe",
        "name": "John Doe",
        "picture": "https://example.com/profile.jpg",
        "updated_at": now,
        "email": "john.doe@example.com",
        "email_verified": True,
        "iss": "https://test-domain.auth0.com/",
        "aud": "test-audience",
        "iat": now,
        "exp": exp,
        "nbf": now,
    }


@pytest.fixture
def mock_jwt_payload():
    return create_jwt_payload()


def create_token(expired: bool = False):
    dummy_key = "dummy-secret-key-for-testing"
    return jwt.encode(
        create_jwt_payload(expired),
        dummy_key,
        algorithm="HS256",
        headers={"kid": "test-kid", "typ": "JWT"},
    )


@pytest.fixture
def mock_token():
    return create_token()


@pytest.fixture
def mock_expired_token():
    return create_token(expired=True)


def test_auth0_config_properties(auth0_config):
    assert auth0_config.issuer == "https://test-domain.auth0.com/"
    assert (
        auth0_config.jwks_url == "https://test-domain.auth0.com/.well-known/jwks.json"
    )


@pytest.mark.asyncio
@patch("app.auth.auth_core.httpx.AsyncClient.get")
async def test_jwks_cache_fetch(mock_get, auth0_config):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = json.dumps(
        {
            "keys": [
                {
                    "kid": "test-kid",
                    "kty": "RSA",
                    "alg": "RS256",
                    "n": "sample-modulus",
                    "e": "AQAB",
                }
            ]
        }
    )
    mock_response.raise_for_status = MagicMock()

    mock_get.return_value = mock_response

    with patch("app.auth.auth_core.PyJWKSet") as mock_jwk_set:
        mock_key = MagicMock()
        mock_key.key_id = "test-kid"
        mock_key.key = "mock-rsa-key"

        mock_instance = MagicMock()
        mock_instance.keys = [mock_key]
        mock_jwk_set.from_json.return_value = mock_instance

        # create a new JWKSCache instance
        jwks_cache = JWKSCache(auth0_config)

        # Verify that the key is fetched from the JWKS URL
        key = await jwks_cache.get_key("test-kid")
        assert key == "mock-rsa-key"
        mock_get.assert_called_once_with(auth0_config.jwks_url, timeout=5)


@pytest.mark.asyncio
@patch("app.auth.auth_core.get_jwks_cache")
@patch("app.auth.auth_core.jwt.decode")
@patch("app.auth.auth_core.jwt.get_unverified_header")
async def test_validate_token_success(
    mock_get_header,
    mock_decode,
    mock_get_jwks_cache,
    auth0_config,
    mock_token,
    mock_jwt_payload,
):
    # set up mocks
    mock_get_header.return_value = {"typ": "JWT", "kid": "test-kid"}
    mock_decode.return_value = mock_jwt_payload

    jwks_cache_mock = MagicMock()
    jwks_cache_mock.get_key = AsyncMock(return_value="mock-key")
    mock_get_jwks_cache.return_value = jwks_cache_mock

    # run validate_token
    result = await validate_token(mock_token, auth0_config)

    # call assertions
    mock_get_header.assert_called_once_with(mock_token)
    mock_decode.assert_called_once_with(
        mock_token,
        "mock-key",
        algorithms=auth0_config.algorithms,
        issuer=auth0_config.issuer,
        audience=auth0_config.audience,
    )
    assert result == mock_jwt_payload


@patch("app.auth.auth_core.get_jwks_cache")
@patch("app.auth.auth_core.jwt.get_unverified_header")
async def test_validate_token_invalid_type(
    mock_get_header, mock_get_jwks_cache, auth0_config, mock_token
):
    mock_get_header.return_value = {"typ": "Invalid", "kid": "test-kid"}

    with pytest.raises(HTTPException) as exec_info:
        await validate_token(mock_token, auth0_config)

    assert exec_info.value.status_code == 401
    assert exec_info.value.detail == "Authentication error"


@patch("app.auth.auth_core.get_jwks_cache")
@patch("app.auth.auth_core.jwt.get_unverified_header")
async def test_validate_token_key_not_found(
    mock_get_header, mock_get_jwks_cache, auth0_config, mock_token
):
    mock_get_header.return_value = {"typ": "JWT", "kid": "test-kid"}

    jwks_cache_mock = MagicMock()
    jwks_cache_mock.get_key.return_value = None
    mock_get_jwks_cache.return_value = jwks_cache_mock

    with pytest.raises(HTTPException) as excinfo:
        await validate_token(mock_token, auth0_config)

    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Authentication error"


@pytest.mark.asyncio
@patch("app.auth.auth_core.get_jwks_cache")
@patch("app.auth.auth_core.logger")
async def test_validate_token_expired(
    mock_logger, mock_get_jwks_cache, mock_expired_token
):
    # Create auth0_config that matches the test token algorithm (HS256), simplifies the test.
    auth0_config = Auth0Config(
        algorithms=["HS256"],
        audience="test-audience",
        client_id="test-client-id",
        domain="test-domain.auth0.com",
    )

    # Set up JWKS cache mock to return a key for decoding
    jwks_cache_mock = MagicMock()
    jwks_cache_mock.get_key = AsyncMock(return_value="dummy-secret-key-for-testing")
    mock_get_jwks_cache.return_value = jwks_cache_mock

    with pytest.raises(HTTPException) as excinfo:
        await validate_token(mock_expired_token, auth0_config)

    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Token has expired"


@pytest.mark.asyncio
@patch("app.auth.auth_core.get_jwks_cache")
@patch("app.auth.auth_core.jwt.decode")
@patch("app.auth.auth_core.jwt.get_unverified_header")
async def test_validate_token_invalid_claims(
    mock_get_header, mock_decode, mock_get_jwks_cache, auth0_config, mock_token
):
    mock_get_header.return_value = {"typ": "JWT", "kid": "test-kid"}
    mock_decode.side_effect = jwt.InvalidAudienceError("Invalid audience")

    jwks_cache_mock = MagicMock()
    jwks_cache_mock.get_key = AsyncMock(return_value="mock-key")
    mock_get_jwks_cache.return_value = jwks_cache_mock

    with pytest.raises(HTTPException) as excinfo:
        await validate_token(mock_token, auth0_config)

    assert excinfo.value.status_code == 401
    assert (
        excinfo.value.detail == "Invalid claims, please check the audience and issuer"
    )


# Tests for Auth0Middleware
@pytest.fixture
def app():
    app = FastAPI()

    @app.get("/protected")
    async def protected_route():
        return {"message": "This is protected"}

    @app.options("/protected")
    async def options_route():
        return {}

    @app.get("/docs")
    async def docs_route():
        return {"message": "Documentation"}

    return app


@pytest.fixture
def client(app, auth0_config):
    with patch("app.auth.auth_core.validate_token") as mock_validate:
        mock_validate.return_value = {"sub": "test-user"}

        # add Auth0Middleware to the app
        app.add_middleware(
            Auth0Middleware,
            auth0_config=auth0_config,
            exclude_paths=["/docs", "/redoc", "/openapi.json"],
        )

        return TestClient(app)


def test_middleware_protected_route_with_token(client):
    with patch("app.auth.auth_core.validate_token") as mock_validate:
        mock_validate.return_value = {"sub": "test-user"}
        response = client.get(
            "/protected", headers={"Authorization": "Bearer asdasdsadsadasdsa"}
        )
        assert response.status_code == 200
        assert response.json() == {"message": "This is protected"}


def test_middleware_protected_route_without_token(client):
    response = client.get("/protected")
    assert response.status_code == 401
    assert response.json() == {"detail": "Authorization header is expected"}


def test_middleware_excluded_path(client):
    response = client.get("/docs")
    assert response.status_code == 200


def test_middleware_options_request(client):
    response = client.options("/protected")
    assert response.status_code == 200


@pytest.mark.asyncio
@patch("app.auth.auth_core.httpx.AsyncClient")
async def test_get_current_user_success(
    mock_async_client, auth0_config, mock_jwt_payload, mock_redis
):
    # set request mock
    request = MagicMock()
    request.state.user = mock_jwt_payload
    request.headers.get.return_value = "Bearer test-token"

    # set up httpx client mock
    mock_client = AsyncMock()

    # First response for userinfo endpoint
    userinfo_response = MagicMock()
    userinfo_response.status_code = 200
    userinfo_response.json.return_value = {
        "sub": mock_jwt_payload["sub"],
        "given_name": mock_jwt_payload["given_name"],
        "family_name": mock_jwt_payload["family_name"],
        "nickname": mock_jwt_payload["nickname"],
        "name": mock_jwt_payload["name"],
        "picture": mock_jwt_payload["picture"],
        "updated_at": datetime.fromtimestamp(
            mock_jwt_payload["updated_at"]
        ).isoformat(),
        "email": mock_jwt_payload["email"],
        "email_verified": mock_jwt_payload["email_verified"],
    }

    # Second response for user metadata endpoint
    extra_info_response = MagicMock()
    extra_info_response.status_code = 200
    extra_info_response.json.return_value = {
        "app_metadata": {"pseudonymizedId": "test-pseudonymized-id"}
    }

    # Configure mock to return different responses based on URL
    def get_side_effect(url, **kwargs):
        if "/userinfo" in url:
            return userinfo_response
        elif "/api/v2/users/" in url:
            return extra_info_response
        return MagicMock(status_code=404)

    mock_client.get.side_effect = get_side_effect
    mock_async_client.return_value.__aenter__.return_value = mock_client

    # Patch settings
    with patch("app.auth.auth_core.settings") as mock_settings:
        mock_settings.AUTH0_DOMAIN = "test-domain.auth0.com"

        user = await get_current_user(request)

        # verify both API calls were made with correct parameters
        assert mock_client.get.call_count == 2
        mock_client.get.assert_any_call(
            "https://test-domain.auth0.com/userinfo",
            headers={"Authorization": "Bearer test-token"},
        )
        mock_client.get.assert_any_call(
            f"https://test-domain.auth0.com/api/v2/users/{mock_jwt_payload['sub']}",
            headers={"Authorization": "Bearer test-token"},
        )

        # verify that the user object is created correctly
        assert isinstance(user, UserProfile)
        assert user.sub == mock_jwt_payload["sub"]
        assert user.email == mock_jwt_payload["email"]
        assert user.app_metadata == {"pseudonymizedId": "test-pseudonymized-id"}


@pytest.mark.asyncio
async def test_get_current_user_not_authenticated():
    request = MagicMock()
    delattr(request.state, "user")

    with pytest.raises(HTTPException) as exec_info:
        await get_current_user(request)

    assert exec_info.value.status_code == 401
    assert exec_info.value.detail == "Not authenticated"


@pytest.mark.asyncio
@patch("app.auth.auth_core.httpx.AsyncClient")
async def test_get_pseudonymized_id_success(
    mock_async_client, auth0_config, mock_jwt_payload, mock_redis
):
    # set request mock
    request = MagicMock()
    request.state.user = mock_jwt_payload
    request.headers.get.return_value = "Bearer test-token"

    # set up httpx client mock
    mock_client = AsyncMock()

    # First response for userinfo endpoint
    userinfo_response = MagicMock()
    userinfo_response.status_code = 200
    userinfo_response.json.return_value = {
        "sub": mock_jwt_payload["sub"],
    }

    # Second response for user metadata endpoint
    extra_info_response = MagicMock()
    extra_info_response.status_code = 200
    extra_info_response.json.return_value = {
        "app_metadata": {"pseudonymizedId": "test-pseudonymized-id"}
    }

    # Configure mock to return different responses based on URL
    def get_side_effect(url, **kwargs):
        if "/userinfo" in url:
            return userinfo_response
        elif "/api/v2/users/" in url:
            return extra_info_response
        return MagicMock(status_code=404)

    mock_client.get.side_effect = get_side_effect
    mock_async_client.return_value.__aenter__.return_value = mock_client

    # Patch settings
    with patch("app.auth.auth_core.settings") as mock_settings:
        mock_settings.AUTH0_DOMAIN = "test-domain.auth0.com"

        pseudonymized_id = await get_pseudonymized_id(request)

        # verify both API calls were made with correct parameters
        assert mock_client.get.call_count == 2
        mock_client.get.assert_any_call(
            "https://test-domain.auth0.com/userinfo",
            headers={"Authorization": "Bearer test-token"},
        )
        mock_client.get.assert_any_call(
            f"https://test-domain.auth0.com/api/v2/users/{mock_jwt_payload['sub']}",
            headers={"Authorization": "Bearer test-token"},
        )

        # verify that the pseudonymized id is correct
        assert pseudonymized_id == "test-pseudonymized-id"


@pytest.mark.asyncio
@patch("app.auth.auth_core.httpx.AsyncClient")
async def test_get_pseudonymized_id_missing(
    mock_async_client, auth0_config, mock_jwt_payload, mock_redis
):
    # set request mock
    request = MagicMock()
    request.state.user = mock_jwt_payload
    request.headers.get.return_value = "Bearer test-token"

    # set up httpx client mock
    mock_client = AsyncMock()

    # First response for userinfo endpoint
    userinfo_response = MagicMock()
    userinfo_response.status_code = 200
    userinfo_response.json.return_value = {
        "sub": mock_jwt_payload["sub"],
    }

    # Second response for user metadata endpoint missing pseudonymizedId
    extra_info_response = MagicMock()
    extra_info_response.status_code = 200
    extra_info_response.json.return_value = {"app_metadata": {}}

    mock_client.get.side_effect = (
        lambda url, **kwargs: userinfo_response
        if "/userinfo" in url
        else extra_info_response
    )
    mock_async_client.return_value.__aenter__.return_value = mock_client

    # Patch settings
    with patch("app.auth.auth_core.settings") as mock_settings:
        mock_settings.AUTH0_DOMAIN = "test-domain.auth0.com"

        with pytest.raises(HTTPException) as exec_info:
            await get_pseudonymized_id(request)

        assert exec_info.value.status_code == 401
        assert exec_info.value.detail == "Pseudonymized ID not found in user profile"


@patch("app.auth.auth_core.logger")
async def test_null_token_logs_not_enough_segments_error(mock_logger, auth0_config):
    with pytest.raises(HTTPException) as excinfo:
        await validate_token("null", auth0_config)

    assert mock_logger.exception.call_count >= 1
    calls = [str(call) for call in mock_logger.exception.call_args_list]
    assert any(
        "Unexpected error validating token: Not enough segments" in call
        for call in calls
    )
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Authentication error"
