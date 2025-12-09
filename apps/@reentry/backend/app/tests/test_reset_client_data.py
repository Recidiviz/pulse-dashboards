"""Tests for the reset client data endpoint."""

import pytest
from httpx import AsyncClient
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.intake import Intake, IntakeMessage


@pytest.mark.asyncio
async def test_reset_client_data(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    client_pseudo_id = "client-001ps"

    intake = Intake(client_pseudo_id=client_pseudo_id, status="completed")
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    message = IntakeMessage(
        intake_id=intake.id, from_role="client", content="Test", section="Test"
    )
    async_session.add(message)
    await async_session.commit()

    response = await client.delete(f"/clients/{client_pseudo_id}/reset")

    assert_response(response, 200)
    data = response.json()

    assert data["total_deleted"] == 2

    result = await async_session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    assert len(result.all()) == 0
