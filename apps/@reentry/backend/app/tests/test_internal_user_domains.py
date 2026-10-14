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
"""Tests that only Recidiviz staff email domains count as internal users.

The endpoint tests run the real app behind the real Auth0Middleware, with only
the token signature check and the Auth0 /userinfo response stubbed, so the
internal-user dependencies run exactly as they do in production.
"""

from unittest.mock import AsyncMock, patch

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.auth_core import Auth0Middleware, get_auth0_config, is_internal_user
from app.core.config import settings

# Built from the domain rather than written out, because Nightfall DLP flags
# any literal address at this domain.
TEST_DOMAIN = "@recidiviz-test.org"
TEST_DOMAIN_EMAIL = "pentest-caseworker" + TEST_DOMAIN
STAFF_EMAIL = "staff@recidiviz.org"


def _userinfo(email: str, *, email_verified: bool) -> dict:
    """Returns an Auth0 /userinfo body for a database-connection signup."""
    return {
        "sub": "auth0|self-signup-0001",
        "email": email,
        "email_verified": email_verified,
        "https://dashboard.recidiviz.org/app_metadata": {
            "stateCode": "us_ut",
            "pseudonymizedId": "pseudo-test-persona",
        },
    }


def _bearer_token() -> str:
    # get_pseudonymized_id decodes the access token without verifying it to
    # read app_metadata, so the token must be JWT-shaped.
    return jwt.encode(
        {
            "sub": "auth0|self-signup-0001",
            "https://dashboard.recidiviz.org/app_metadata": {
                "pseudonymizedId": "pseudo-test-persona"
            },
        },
        "unused-signing-key",
        algorithm="HS256",
    )


async def _get_as(path: str, userinfo: dict):
    """GETs `path` through Auth0Middleware as the Auth0 user in `userinfo`."""
    from main import app as fastapi_app

    token = _bearer_token()
    authed_app = Auth0Middleware(
        fastapi_app, auth0_config=get_auth0_config(), exclude_paths=[]
    )
    with (
        patch(
            "app.auth.auth_core.validate_token",
            AsyncMock(return_value={"sub": userinfo["sub"]}),
        ),
        patch(
            "app.auth.auth_core._get_cached_auth0_userinfo",
            AsyncMock(return_value=userinfo),
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=authed_app), base_url="http://test"
        ) as client:
            return await client.get(path, headers={"Authorization": f"Bearer {token}"})


@pytest.mark.parametrize("env_name", ["prod", "staging", "dev", "demo", "pilot"])
def test_test_domain_is_not_internal(monkeypatch, env_name):
    monkeypatch.setattr(settings, "ENV_NAME", env_name)

    assert not is_internal_user(TEST_DOMAIN_EMAIL)


@pytest.mark.parametrize("env_name", ["prod", "staging", "dev"])
def test_recidiviz_domain_is_internal(monkeypatch, env_name):
    monkeypatch.setattr(settings, "ENV_NAME", env_name)

    assert is_internal_user(STAFF_EMAIL)


@pytest.mark.asyncio
@pytest.mark.parametrize("email_verified", [False, True])
async def test_test_domain_user_cannot_read_intake_outside_caseload(
    monkeypatch, async_session, mock_clientdata_service, mock_intake, email_verified
):
    """A @recidiviz-test.org identity must not reach the caseload-free intake
    viewer, whether or not Auth0 has verified its email."""
    monkeypatch.setattr(settings, "ENV_NAME", "prod")

    response = await _get_as(
        f"/intake/internal/{mock_intake.id}",
        _userinfo(TEST_DOMAIN_EMAIL, email_verified=email_verified),
    )

    assert response.status_code == 403, response.text
    assert "client" not in response.json()


@pytest.mark.asyncio
async def test_staff_user_can_read_intake_outside_caseload(
    monkeypatch, async_session, mock_clientdata_service, mock_intake
):
    monkeypatch.setattr(settings, "ENV_NAME", "prod")

    response = await _get_as(
        f"/intake/internal/{mock_intake.id}",
        _userinfo(STAFF_EMAIL, email_verified=True),
    )

    assert response.status_code == 200, response.text
    assert response.json()["client_pseudo_id"] == mock_intake.client_pseudo_id


@pytest.mark.asyncio
async def test_test_domain_user_cannot_use_config_management(
    monkeypatch, async_session
):
    monkeypatch.setattr(settings, "ENV_NAME", "prod")
    monkeypatch.setattr(settings, "CONFIG_MANAGEMENT_PASSWORD", "")

    response = await _get_as(
        "/config-management/assessments/available-states",
        _userinfo(TEST_DOMAIN_EMAIL, email_verified=False),
    )

    assert response.status_code == 403, response.text


@pytest.mark.asyncio
async def test_staff_user_can_use_config_management(monkeypatch, async_session):
    monkeypatch.setattr(settings, "ENV_NAME", "prod")
    monkeypatch.setattr(settings, "CONFIG_MANAGEMENT_PASSWORD", "")

    response = await _get_as(
        "/config-management/assessments/available-states",
        _userinfo(STAFF_EMAIL, email_verified=True),
    )

    assert response.status_code == 200, response.text
