"""
Auth tests for routes that call paid third-party APIs (Google Places, Google
Text-to-Speech, Deepgram).

- /intake/services/* is exempt from Auth0 but must require the client JWT
  (enforced by ClientAuthMiddleware).
- The root /autocomplete-city and /autocomplete-address routes must require
  Auth0 (enforced by Auth0Middleware, which is disabled in the test app, so it is
  exercised here against a minimal app that uses main.py's exclude_paths).

All external calls are mocked.
"""

from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.auth.auth_core import Auth0Middleware, get_auth0_config
from app.auth.intake.utils import create_access_token
from app.core.config import settings
from app.routes.autocomplete_router import (
    AutocompleteAddressResponse,
    AutocompleteCityResponse,
)
from main import exclude_paths

INTAKE_SERVICES_ROUTES = [
    ("GET", "/intake/services/autocomplete-city", {"params": {"input": "Bos"}}),
    ("GET", "/intake/services/autocomplete-address", {"params": {"input": "123 M"}}),
    ("POST", "/intake/services/text-to-speech", {"json": {"text": "Hello"}}),
    (
        "POST",
        "/intake/services/transcribe",
        {"files": {"file": ("a.webm", b"audio", "audio/webm")}},
    ),
]

ROOT_AUTOCOMPLETE_ROUTES = [
    ("GET", "/autocomplete-city", {"params": {"input": "Bos"}}),
    ("GET", "/autocomplete-address", {"params": {"input": "123 M"}}),
]


def _request_kwargs(kwargs):
    # BytesIO is single-use, so build file bodies fresh for every request.
    kwargs = dict(kwargs)
    if "files" in kwargs:
        name, content, content_type = kwargs["files"]["file"]
        kwargs["files"] = {"file": (name, BytesIO(content), content_type)}
    return kwargs


@pytest.fixture
def mock_paid_apis():
    """Mock every external call made by the /intake/services routes."""
    empty_address = AutocompleteAddressResponse(success=True, suggestions=[])
    empty_city = AutocompleteCityResponse(success=True, suggestions=[])
    module = "app.routes.intake_services_router"
    with (
        patch(
            f"{module}.autocomplete_address_util",
            new_callable=AsyncMock,
            return_value=empty_address,
        ) as address,
        patch(
            f"{module}.autocomplete_city_util",
            new_callable=AsyncMock,
            return_value=empty_city,
        ) as city,
        patch(f"{module}.text_to_speech", new_callable=MagicMock) as tts,
        patch(
            f"{module}.deepgram_transcription_diarization",
            new_callable=AsyncMock,
            return_value={
                "results": {"channels": [{"alternatives": [{"transcript": "hi"}]}]}
            },
        ) as deepgram,
    ):
        yield {"address": address, "city": city, "tts": tts, "deepgram": deepgram}


def _assert_no_paid_calls(mocks):
    for mock in mocks.values():
        mock.assert_not_called()


class TestIntakeServicesRequireClientToken:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_no_token_returns_401(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        response = await client.request(method, path, **_request_kwargs(kwargs))

        assert response.status_code == 401
        _assert_no_paid_calls(mock_paid_apis)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_non_bearer_header_returns_401(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        response = await client.request(
            method,
            path,
            headers={"Authorization": "Basic abc123"},
            **_request_kwargs(kwargs),
        )

        assert response.status_code == 401
        _assert_no_paid_calls(mock_paid_apis)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_invalid_token_returns_401(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        response = await client.request(
            method,
            path,
            headers={"Authorization": "Bearer not-a-valid-jwt"},
            **_request_kwargs(kwargs),
        )

        assert response.status_code == 401
        _assert_no_paid_calls(mock_paid_apis)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_token_signed_with_wrong_key_returns_401(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        forged = jwt.encode(
            {"sub": "client-1", "token_type": "client"},
            key="some-other-secret-key-that-is-long-enough",
            algorithm=settings.JWT_ALGORITHM,
        )

        response = await client.request(
            method,
            path,
            headers={"Authorization": f"Bearer {forged}"},
            **_request_kwargs(kwargs),
        )

        assert response.status_code == 401
        _assert_no_paid_calls(mock_paid_apis)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_non_client_token_type_returns_401(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        wrong_type = jwt.encode(
            {"sub": "client-1", "token_type": "not-client"},
            key=settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

        response = await client.request(
            method,
            path,
            headers={"Authorization": f"Bearer {wrong_type}"},
            **_request_kwargs(kwargs),
        )

        assert response.status_code == 401
        _assert_no_paid_calls(mock_paid_apis)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_valid_client_token_returns_200(
        self, client: AsyncClient, mock_paid_apis, method, path, kwargs
    ):
        token = create_access_token("test-client-pseudo-id")

        response = await client.request(
            method,
            path,
            headers={"Authorization": f"Bearer {token}"},
            **_request_kwargs(kwargs),
        )

        assert response.status_code == 200, response.text

    @pytest.mark.asyncio
    async def test_options_preflight_is_not_blocked(self, client: AsyncClient):
        response = await client.options(
            "/intake/services/text-to-speech",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )

        assert response.status_code != 401


class TestExternalClientVerifyStaysPublic:
    @pytest.mark.asyncio
    async def test_verify_route_does_not_require_token(self, client: AsyncClient):
        # No token and an empty body: the request must get past the auth
        # middleware and fail request validation (422) rather than 401.
        response = await client.post("/external/client/verify", json={})

        assert response.status_code != 401

    @pytest.mark.asyncio
    async def test_external_client_routes_still_require_token(
        self, client: AsyncClient
    ):
        response = await client.get("/external/client/anything")

        assert response.status_code == 401


@pytest.fixture
async def auth0_app_client():
    """
    Minimal app using the real Auth0Middleware and the real exclude_paths from
    main.py, with stub handlers on the paths under test (Auth0Middleware is
    disabled for the main app in tests).
    """
    stub_app = FastAPI()
    stub_app.add_middleware(
        Auth0Middleware,
        auth0_config=get_auth0_config(),
        exclude_paths=exclude_paths,
    )

    paths = [path for _, path, _ in ROOT_AUTOCOMPLETE_ROUTES + INTAKE_SERVICES_ROUTES]
    for path in paths:

        async def handler():
            return {"ok": True}

        stub_app.add_api_route(path, handler, methods=["GET", "POST"])

    async with AsyncClient(
        transport=ASGITransport(app=stub_app), base_url="http://test"
    ) as stub_client:
        yield stub_client


class TestRootAutocompleteRequiresAuth0:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", ROOT_AUTOCOMPLETE_ROUTES)
    async def test_no_token_returns_401(
        self, auth0_app_client: AsyncClient, method, path, kwargs
    ):
        response = await auth0_app_client.request(method, path, **kwargs)

        assert response.status_code == 401

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", ROOT_AUTOCOMPLETE_ROUTES)
    async def test_invalid_token_returns_401(
        self, auth0_app_client: AsyncClient, method, path, kwargs
    ):
        response = await auth0_app_client.request(
            method,
            path,
            headers={"Authorization": "Bearer not-a-valid-jwt"},
            **kwargs,
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", ROOT_AUTOCOMPLETE_ROUTES)
    async def test_valid_auth0_token_is_accepted(
        self, auth0_app_client: AsyncClient, method, path, kwargs
    ):
        with patch(
            "app.auth.auth_core.validate_token",
            new_callable=AsyncMock,
            return_value={"sub": "auth0|123"},
        ):
            response = await auth0_app_client.request(
                method,
                path,
                headers={"Authorization": "Bearer valid-auth0-token"},
                **kwargs,
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path,kwargs", INTAKE_SERVICES_ROUTES)
    async def test_intake_services_do_not_require_auth0(
        self, auth0_app_client: AsyncClient, method, path, kwargs
    ):
        # /intake/services is protected by the client JWT instead of Auth0.
        response = await auth0_app_client.request(method, path, **kwargs)

        assert response.status_code == 200
