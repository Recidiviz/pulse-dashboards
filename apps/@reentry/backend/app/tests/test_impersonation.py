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
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.auth.impersonation import (
    IMPERSONATION_CACHE_TTL,
    _compute_user_hash,
    check_impersonation_authorized,
    get_impersonated_user_metadata,
    validate_impersonation_request,
)

# _compute_user_hash


def test_compute_user_hash_produces_expected_value():
    email = "caseworker@example.com"
    digest = hashlib.sha256(email.encode()).digest()
    expected = base64.b64encode(digest).decode()
    assert _compute_user_hash(email) == expected


def test_compute_user_hash_is_case_insensitive():
    assert _compute_user_hash("User@Example.COM") == _compute_user_hash(
        "user@example.com"
    )


def test_compute_user_hash_replaces_leading_slash():
    with patch(
        "app.auth.impersonation.base64.b64encode", return_value=b"/LeadingSlash=="
    ):
        result = _compute_user_hash("any@email.com")
    assert result == "_LeadingSlash=="
    assert not result.startswith("/")


# check_impersonation_authorized


@pytest.fixture
def impersonation_settings():
    mock = MagicMock()
    mock.IMPERSONATION_ENABLED = True
    mock.IMPERSONATION_ALLOWED_EMAILS = "admin@recidiviz.org"
    return mock


def test_check_blocks_when_feature_disabled(impersonation_settings):
    impersonation_settings.IMPERSONATION_ENABLED = False
    with patch("app.auth.impersonation.settings", impersonation_settings):
        with pytest.raises(HTTPException) as exc:
            check_impersonation_authorized("admin@recidiviz.org", "staff@state.gov")
    assert exc.value.status_code == 403


def test_check_blocks_when_caller_not_in_allowlist(impersonation_settings):
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        with pytest.raises(HTTPException) as exc:
            check_impersonation_authorized("other@recidiviz.org", "staff@state.gov")
    assert exc.value.status_code == 403


def test_check_blocks_when_allowlist_is_empty(impersonation_settings):
    impersonation_settings.IMPERSONATION_ALLOWED_EMAILS = ""
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        with pytest.raises(HTTPException) as exc:
            check_impersonation_authorized("admin@recidiviz.org", "staff@state.gov")
    assert exc.value.status_code == 403


def test_check_blocks_non_internal_domain_even_if_in_allowlist(impersonation_settings):
    impersonation_settings.IMPERSONATION_ALLOWED_EMAILS = "external@gmail.com"
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=False),
    ):
        with pytest.raises(HTTPException) as exc:
            check_impersonation_authorized("external@gmail.com", "staff@state.gov")
    assert exc.value.status_code == 403


def test_check_blocks_self_impersonation(impersonation_settings):
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        with pytest.raises(HTTPException) as exc:
            check_impersonation_authorized("admin@recidiviz.org", "admin@recidiviz.org")
    assert exc.value.status_code == 400


def test_check_passes_all_checks(impersonation_settings):
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        check_impersonation_authorized("admin@recidiviz.org", "staff@state.gov")


def test_check_is_case_insensitive_for_caller_email(impersonation_settings):
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        check_impersonation_authorized("ADMIN@RECIDIVIZ.ORG", "staff@state.gov")


def test_check_supports_multiple_emails_in_allowlist(impersonation_settings):
    impersonation_settings.IMPERSONATION_ALLOWED_EMAILS = (
        "admin1@recidiviz.org, admin2@recidiviz.org"
    )
    with (
        patch("app.auth.impersonation.settings", impersonation_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        check_impersonation_authorized("admin2@recidiviz.org", "staff@state.gov")


# get_impersonated_user_metadata


@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    mock.get.return_value = None
    mock.setex.return_value = True
    return mock


@pytest.mark.asyncio
async def test_returns_cached_data_on_cache_hit(mock_redis):
    cached = {"pseudonymizedId": "cached-id", "stateCode": "US_ID"}
    mock_redis.get.return_value = json.dumps(cached)

    with patch("app.auth.impersonation.redis_client", mock_redis):
        result = await get_impersonated_user_metadata("user@state.gov")

    assert result == cached
    mock_redis.get.assert_called_once_with("impersonation:user@state.gov")


@pytest.mark.asyncio
async def test_fetches_from_data_api_in_staging(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "staging"
    mock_settings.DATA_API_URL = "https://data-api.example.com"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE = (
        "https://audience.example.com"
    )

    api_response = {"app_metadata": {"pseudonymizedId": "ps-123", "stateCode": "US_ID"}}
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = api_response
    mock_response.raise_for_status = MagicMock()

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
        patch("google.auth.default", return_value=(MagicMock(), None)),
        patch("google.oauth2.id_token.fetch_id_token", return_value="mock-id-token"),
        patch("google.auth.transport.requests.Request"),
        patch("httpx.AsyncClient") as mock_httpx,
    ):
        mock_httpx.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=mock_response
        )
        result = await get_impersonated_user_metadata("user@state.gov")

    assert result == api_response["app_metadata"]
    assert result["pseudonymizedId"] == "ps-123"


@pytest.mark.asyncio
async def test_fetches_from_data_api_in_prod(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "prod"
    mock_settings.DATA_API_URL = "https://data-api.example.com"
    mock_settings.GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE = (
        "https://audience.example.com"
    )

    api_response = {
        "app_metadata": {"pseudonymizedId": "ps-prod", "stateCode": "US_CA"}
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = api_response
    mock_response.raise_for_status = MagicMock()

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
        patch("google.auth.default", return_value=(MagicMock(), None)),
        patch("google.oauth2.id_token.fetch_id_token", return_value="mock-id-token"),
        patch("google.auth.transport.requests.Request"),
        patch("httpx.AsyncClient") as mock_httpx,
    ):
        mock_httpx.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=mock_response
        )
        result = await get_impersonated_user_metadata("user@state.gov")

    assert result == api_response["app_metadata"]
    assert result["pseudonymizedId"] == "ps-prod"


@pytest.mark.asyncio
async def test_raises_500_when_data_api_url_not_configured(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "staging"
    mock_settings.DATA_API_URL = None

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
    ):
        with pytest.raises(HTTPException) as exc:
            await get_impersonated_user_metadata("user@state.gov")

    assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_fetches_from_bigquery_in_dev(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "dev"

    mock_caseworker = MagicMock()
    mock_caseworker.pseudonymized_staff_id = "bq-ps-id"
    mock_caseworker.state_code = "US_ID"
    mock_caseworker.email = "caseworker@state.gov"

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_email",
            return_value=mock_caseworker,
        ),
    ):
        result = await get_impersonated_user_metadata("caseworker@state.gov")

    assert result["pseudonymizedId"] == "bq-ps-id"
    assert result["stateCode"] == "US_ID"


@pytest.mark.asyncio
async def test_raises_404_when_user_not_found_in_bigquery(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "dev"

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_email",
            return_value=None,
        ),
    ):
        with pytest.raises(HTTPException) as exc:
            await get_impersonated_user_metadata("ghost@state.gov")

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_caches_fetched_metadata(mock_redis):
    mock_settings = MagicMock()
    mock_settings.ENV_NAME = "dev"

    mock_caseworker = MagicMock()
    mock_caseworker.pseudonymized_staff_id = "ps-id"
    mock_caseworker.state_code = "US_ID"
    mock_caseworker.email = "user@state.gov"

    with (
        patch("app.auth.impersonation.redis_client", mock_redis),
        patch("app.auth.impersonation.settings", mock_settings),
        patch(
            "app.services.client_data.queries.Queries.get_caseworker_by_email",
            return_value=mock_caseworker,
        ),
    ):
        await get_impersonated_user_metadata("user@state.gov")

    mock_redis.setex.assert_called_once()
    cache_key, ttl, _ = mock_redis.setex.call_args[0]
    assert cache_key == "impersonation:user@state.gov"
    assert ttl == IMPERSONATION_CACHE_TTL


# validate_impersonation_request


@pytest.mark.asyncio
async def test_validate_returns_none_without_header():
    request = MagicMock()
    request.headers.get.return_value = None

    result = await validate_impersonation_request(request)

    assert result is None


@pytest.mark.asyncio
async def test_validate_returns_target_email_when_authorized():
    request = MagicMock()
    request.headers.get.return_value = "staff@state.gov"

    mock_settings = MagicMock()
    mock_settings.IMPERSONATION_ENABLED = True
    mock_settings.IMPERSONATION_ALLOWED_EMAILS = "admin@recidiviz.org"

    with (
        patch(
            "app.auth.impersonation.get_pseudonymized_id",
            AsyncMock(return_value="ps-id"),
        ),
        patch(
            "app.auth.impersonation.get_auth_user_context",
            AsyncMock(return_value={"email": "admin@recidiviz.org"}),
        ),
        patch("app.auth.impersonation.settings", mock_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        result = await validate_impersonation_request(request)

    assert result == "staff@state.gov"


@pytest.mark.asyncio
async def test_validate_raises_when_impersonation_disabled():
    request = MagicMock()
    request.headers.get.return_value = "staff@state.gov"

    mock_settings = MagicMock()
    mock_settings.IMPERSONATION_ENABLED = False
    mock_settings.IMPERSONATION_ALLOWED_EMAILS = "admin@recidiviz.org"

    with (
        patch(
            "app.auth.impersonation.get_pseudonymized_id",
            AsyncMock(return_value="ps-id"),
        ),
        patch(
            "app.auth.impersonation.get_auth_user_context",
            AsyncMock(return_value={"email": "admin@recidiviz.org"}),
        ),
        patch("app.auth.impersonation.settings", mock_settings),
        patch("app.auth.impersonation.is_internal_user", return_value=True),
    ):
        with pytest.raises(HTTPException) as exc:
            await validate_impersonation_request(request)

    assert exc.value.status_code == 403
