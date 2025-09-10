from uuid import uuid4

import pytest
import structlog

from app.core.db import AsyncSession
from app.manage.update_recording_status import _update_recording_status
from app.models.intake import Intake
from app.models.recording import RecordingSession, RecordingStatus

logger = structlog.getLogger(__name__)


@pytest.mark.asyncio
async def test_update_recording_invalid_session_id(async_session: AsyncSession):
    incorrect_id = str(uuid4())
    logger.info(f"Testing incorrect recording session ID: {incorrect_id}")

    with pytest.raises(ValueError, match="Recording session .* not found"):
        await _update_recording_status(
            async_session,
            incorrect_id,
            RecordingStatus.COMPLETED.value,
        )

    logger.info("Successfully caught ValueError for invalid session ID")


@pytest.mark.asyncio
async def test_update_recording_invalid_state(async_session: AsyncSession):
    client_id = "test_client"
    logger.info(f"Testing invalid status update for client: {client_id}")

    test_intake = Intake(client_pseudo_id=client_id)
    async_session.add(test_intake)
    await async_session.commit()
    await async_session.refresh(test_intake)
    logger.info(f"Created test intake with ID: {test_intake.id}")

    recording_session = RecordingSession(
        client_pseudo_id=client_id,
        intake_id=test_intake.id,
        status=RecordingStatus.CREATED,
    )

    async_session.add(recording_session)
    await async_session.commit()
    logger.info(
        f"Created recording session with ID: {recording_session.id}, initial status: {recording_session.status}"
    )

    invalid_status = "invalid_state"
    logger.info(f"Attempting to update to invalid status: {invalid_status}")

    with pytest.raises(ValueError, match="Invalid recording status"):
        await _update_recording_status(
            async_session,
            str(recording_session.id),
            invalid_status,
        )

    logger.info("Successfully caught ValueError for invalid status")


@pytest.mark.asyncio
async def test_update_recording_state_successful(async_session: AsyncSession):
    client_id = "test_client"
    logger.info(f"Testing successful status update for client: {client_id}")

    test_intake = Intake(client_pseudo_id=client_id)
    async_session.add(test_intake)
    await async_session.commit()
    await async_session.refresh(test_intake)
    logger.info(f"Created test intake with ID: {test_intake.id}")

    first_state = RecordingStatus.CREATED
    second_state = RecordingStatus.COMPLETED

    recording_session = RecordingSession(
        client_pseudo_id=client_id,
        intake_id=test_intake.id,
        status=first_state,
    )

    async_session.add(recording_session)
    await async_session.commit()
    logger.info(
        f"Created recording session with ID: {recording_session.id}, initial status: {first_state}"
    )

    await _update_recording_status(
        async_session,
        str(recording_session.id),
        second_state.value,
    )
    updated_session = await async_session.get(RecordingSession, recording_session.id)
    assert updated_session.status == second_state
