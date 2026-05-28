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

from uuid import uuid4

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.auth.auth_core import require_internal_user as _require_internal_user
from app.models.intake import IntakeMessage, IntakeMessageRole


@pytest.fixture
async def internal_client():
    """Test client with _require_internal_user overridden to allow access."""
    from main import app as fastapi_app

    original_overrides = fastapi_app.dependency_overrides.copy()

    async def mock_internal_user():
        return {"email": "staff@recidiviz.org"}

    fastapi_app.dependency_overrides[_require_internal_user] = mock_internal_user

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as client:
        yield client

    fastapi_app.dependency_overrides = original_overrides


# =============================================================================
# GET /intake/internal/{intake_id}
# =============================================================================


@pytest.mark.asyncio
async def test_get_intake_internal_success(
    async_session, internal_client, mock_clientdata_service, mock_intake
):
    """Returns intake data for an authorized internal user."""
    response = await internal_client.get(f"/intake/internal/{mock_intake.id}")

    assert response.status_code == 200
    assert response.json()["client_pseudo_id"] == mock_intake.client_pseudo_id


@pytest.mark.asyncio
async def test_get_intake_internal_not_found(async_session, internal_client):
    """Returns 404 when intake does not exist."""
    response = await internal_client.get(f"/intake/internal/{uuid4()}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_intake_internal_forbidden(
    async_session, mock_clientdata_service, mock_intake
):
    """Returns 403 for a non-internal user."""
    from main import app as fastapi_app

    original_overrides = fastapi_app.dependency_overrides.copy()

    async def mock_blocked():
        raise HTTPException(
            status_code=403,
            detail="This endpoint is only available to Recidiviz staff",
        )

    fastapi_app.dependency_overrides[_require_internal_user] = mock_blocked

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as c:
        response = await c.get(f"/intake/internal/{mock_intake.id}")

    fastapi_app.dependency_overrides = original_overrides

    assert response.status_code == 403
    assert "recidiviz staff" in response.json()["detail"].lower()


# =============================================================================
# GET /intake/internal/{intake_id}/{section_title}/messages
# =============================================================================


@pytest.mark.asyncio
async def test_get_section_messages_internal_success(
    async_session, internal_client, mock_clientdata_service, mock_intake
):
    """Returns messages for a section for an authorized internal user."""
    section = "Housing"
    message = IntakeMessage(
        id=uuid4(),
        intake_id=mock_intake.id,
        section=section,
        from_role=IntakeMessageRole.CASEWORKER,
        content="Do you have stable housing?",
    )
    async_session.add(message)
    await async_session.commit()

    response = await internal_client.get(
        f"/intake/internal/{mock_intake.id}/{section}/messages"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == "Do you have stable housing?"


@pytest.mark.asyncio
async def test_get_section_messages_internal_not_found(
    async_session, internal_client, mock_clientdata_service, mock_intake
):
    """Returns 404 when no messages exist for the requested section."""
    response = await internal_client.get(
        f"/intake/internal/{mock_intake.id}/Nonexistent Section/messages"
    )

    assert response.status_code == 404
