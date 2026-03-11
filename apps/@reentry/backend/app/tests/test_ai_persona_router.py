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
"""Tests for AI Persona router endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.ai_persona import create_ai_persona, get_ai_persona_by_id
from app.models.ai_persona import AIIntakeTrigger
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import Intake, IntakeStatus

# ---------------------------------------------------------------------------
# Helpers / shared fixtures
# ---------------------------------------------------------------------------

PERSONA_PAYLOAD = {
    "name": "Test Persona",
    "age": 30,
    "background": "Background text",
    "challenges": "Challenges text",
    "communication_style": "Direct",
}


def _make_schedule_task_mock(intake_id):
    """
    Return an AsyncMock for schedule_task that persists a real Execution to the DB.

    This satisfies the FK constraint on AIIntakeTrigger.execution_id while
    preventing the actual taskiq broker from running the AI task.
    """

    async def _fake_schedule_task(
        session, table_name, table_entity_id, task_func, task_kwargs
    ):
        execution = Execution(
            status=ExecutionStatus.PENDING,
            table_name=table_name,
            table_entity_id=table_entity_id,
            progress=0,
        )
        session.add(execution)
        await session.commit()
        await session.refresh(execution)
        return execution

    return _fake_schedule_task


@pytest.fixture
async def persona(async_session: AsyncSession):
    """Create and return a single active AI persona in the test DB."""
    return await create_ai_persona(
        session=async_session,
        name="Jane",
        age=25,
        background="Former student",
        challenges="Housing instability",
        communication_style="Friendly",
    )


@pytest.fixture
async def created_intake(
    async_session: AsyncSession, mock_clientdata_service, seed_configs
):
    """Create a CREATED-status intake for trigger tests."""
    assessment_config_id = seed_configs["assessments"][("US_IX", "FACR", 0)]
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)
    return intake


@pytest.fixture
async def trigger_with_execution(async_session: AsyncSession, persona, created_intake):
    """Create an AIIntakeTrigger wired to a real Execution in the test DB."""
    execution = Execution(
        status=ExecutionStatus.IN_PROGRESS,
        table_name="intake",
        table_entity_id=created_intake.id,
        progress=50,
        message="Running",
        output=None,
    )
    async_session.add(execution)
    await async_session.commit()
    await async_session.refresh(execution)

    trigger = AIIntakeTrigger(
        intake_id=created_intake.id,
        persona_id=persona.id,
        execution_id=execution.id,
    )
    async_session.add(trigger)
    await async_session.commit()
    await async_session.refresh(trigger)
    return trigger, execution


# ---------------------------------------------------------------------------
# GET /ai-personas  –  list personas
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_personas_empty(async_session, client: AsyncClient):
    """Returns an empty items list when no personas exist."""
    response = await client.get("/ai-personas?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["items"] == []


@pytest.mark.asyncio
async def test_list_personas_returns_active_personas(
    async_session, client: AsyncClient, persona
):
    """Active personas appear in the paginated list."""
    response = await client.get("/ai-personas?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    ids = [item["id"] for item in data["items"]]
    assert str(persona.id) in ids


@pytest.mark.asyncio
async def test_list_personas_excludes_inactive(
    async_session, client: AsyncClient, persona
):
    """Soft-deleted personas are not included in the list."""
    persona.is_active = False
    async_session.add(persona)
    await async_session.commit()

    response = await client.get("/ai-personas?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    ids = [item["id"] for item in data["items"]]
    assert str(persona.id) not in ids


# ---------------------------------------------------------------------------
# GET /ai-personas/{persona_id}  –  get single persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_persona_success(async_session, client: AsyncClient, persona):
    """Returns full persona details for an existing ID."""
    response = await client.get(f"/ai-personas/{persona.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(persona.id)
    assert data["name"] == persona.name
    assert data["age"] == persona.age
    assert data["background"] == persona.background
    assert data["challenges"] == persona.challenges
    assert data["communication_style"] == persona.communication_style
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_get_persona_not_found(async_session, client: AsyncClient):
    """Returns 404 for a non-existent persona ID."""
    response = await client.get(f"/ai-personas/{uuid4()}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# POST /ai-personas  –  create persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_persona_success(async_session, client: AsyncClient):
    """Creates a new persona and returns 201 with the created object."""
    response = await client.post("/ai-personas", json=PERSONA_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == PERSONA_PAYLOAD["name"]
    assert data["age"] == PERSONA_PAYLOAD["age"]
    assert data["is_active"] is True
    assert "id" in data

    # Verify persisted in DB
    created = await get_ai_persona_by_id(async_session, data["id"])
    assert created is not None
    assert created.name == PERSONA_PAYLOAD["name"]


@pytest.mark.asyncio
async def test_create_persona_missing_field(async_session, client: AsyncClient):
    """Returns 422 when a required field is missing."""
    payload = {k: v for k, v in PERSONA_PAYLOAD.items() if k != "name"}
    response = await client.post("/ai-personas", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PUT /ai-personas/{persona_id}  –  update persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_persona_success(async_session, client: AsyncClient, persona):
    """Updates specific fields and returns the updated persona."""
    response = await client.put(
        f"/ai-personas/{persona.id}",
        json={"name": "Updated Name", "age": 40},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["age"] == 40
    # Unchanged fields are preserved
    assert data["background"] == persona.background


@pytest.mark.asyncio
async def test_update_persona_not_found(async_session, client: AsyncClient):
    """Returns 404 when updating a non-existent persona."""
    response = await client.put(f"/ai-personas/{uuid4()}", json={"name": "X"})
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /ai-personas/{persona_id}  –  soft delete persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_persona_success(async_session, client: AsyncClient, persona):
    """Soft-deletes a persona (sets is_active=False)."""
    response = await client.delete(f"/ai-personas/{persona.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Verify is_active flipped in DB
    await async_session.refresh(persona)
    assert persona.is_active is False


@pytest.mark.asyncio
async def test_delete_persona_not_found(async_session, client: AsyncClient):
    """Returns 404 when deleting a non-existent persona."""
    response = await client.delete(f"/ai-personas/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_deleted_persona_excluded_from_list(
    async_session, client: AsyncClient, persona
):
    """A deleted persona no longer appears in the list endpoint."""
    await client.delete(f"/ai-personas/{persona.id}")

    response = await client.get("/ai-personas?page=1&size=10")
    assert response.status_code == 200
    ids = [item["id"] for item in response.json()["items"]]
    assert str(persona.id) not in ids


# ---------------------------------------------------------------------------
# GET /ai-personas/{persona_id}/triggers  –  list triggers for persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_persona_triggers_empty(async_session, client: AsyncClient, persona):
    """Returns an empty list when a persona has no triggers."""
    response = await client.get(f"/ai-personas/{persona.id}/triggers")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_persona_triggers_returns_triggers(
    async_session, client: AsyncClient, persona, trigger_with_execution
):
    """Returns trigger summaries with execution status included."""
    trigger, execution = trigger_with_execution
    response = await client.get(f"/ai-personas/{persona.id}/triggers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    item = data[0]
    assert item["trigger_id"] == str(trigger.id)
    assert item["intake_id"] == str(trigger.intake_id)
    assert item["execution_id"] == str(execution.id)
    assert item["status"] == ExecutionStatus.IN_PROGRESS.value
    assert item["progress"] == 50


@pytest.mark.asyncio
async def test_list_persona_triggers_no_execution(
    async_session, client: AsyncClient, persona, created_intake
):
    """Trigger with no execution_id reports status 'not_started'."""
    trigger = AIIntakeTrigger(
        intake_id=created_intake.id,
        persona_id=persona.id,
        execution_id=None,
    )
    async_session.add(trigger)
    await async_session.commit()

    response = await client.get(f"/ai-personas/{persona.id}/triggers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "not_started"
    assert data[0]["execution_id"] is None


@pytest.mark.asyncio
async def test_list_persona_triggers_persona_not_found(
    async_session, client: AsyncClient
):
    """Returns 404 when persona doesn't exist."""
    response = await client.get(f"/ai-personas/{uuid4()}/triggers")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /ai-personas/ai-intakes/trigger  –  trigger AI intake
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_trigger_ai_intake_success(
    async_session, client: AsyncClient, persona, created_intake
):
    """Creates a trigger + execution and returns 201 with IDs."""
    with patch(
        "app.routes.ai_persona_router.schedule_task",
        side_effect=_make_schedule_task_mock(created_intake.id),
    ):
        response = await client.post(
            "/ai-personas/ai-intakes/trigger",
            json={
                "persona_id": str(persona.id),
                "intake_id": str(created_intake.id),
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["trigger_id"] is not None
    assert data["intake_id"] == str(created_intake.id)
    assert data["execution_id"] is not None


@pytest.mark.asyncio
async def test_trigger_ai_intake_persona_not_found(
    async_session, client: AsyncClient, created_intake
):
    """Returns 404 when the specified persona does not exist."""
    response = await client.post(
        "/ai-personas/ai-intakes/trigger",
        json={"persona_id": str(uuid4()), "intake_id": str(created_intake.id)},
    )
    assert response.status_code == 404
    assert "persona" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_trigger_ai_intake_inactive_persona(
    async_session, client: AsyncClient, persona, created_intake
):
    """Returns 400 when the persona is inactive."""
    persona.is_active = False
    async_session.add(persona)
    await async_session.commit()

    response = await client.post(
        "/ai-personas/ai-intakes/trigger",
        json={"persona_id": str(persona.id), "intake_id": str(created_intake.id)},
    )
    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_trigger_ai_intake_intake_not_found(
    async_session, client: AsyncClient, persona
):
    """Returns 404 when the specified intake does not exist."""
    response = await client.post(
        "/ai-personas/ai-intakes/trigger",
        json={"persona_id": str(persona.id), "intake_id": str(uuid4())},
    )
    assert response.status_code == 404
    assert "intake" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_trigger_ai_intake_updates_intake_status(
    async_session, client: AsyncClient, persona, created_intake
):
    """A CREATED intake is moved to IN_PROGRESS when triggered."""
    with patch(
        "app.routes.ai_persona_router.schedule_task",
        side_effect=_make_schedule_task_mock(created_intake.id),
    ):
        await client.post(
            "/ai-personas/ai-intakes/trigger",
            json={"persona_id": str(persona.id), "intake_id": str(created_intake.id)},
        )

    await async_session.refresh(created_intake)
    assert created_intake.status == IntakeStatus.IN_PROGRESS


# ---------------------------------------------------------------------------
# GET /ai-personas/ai-intakes/{execution_id}/status  –  status by execution
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_status_by_execution_success(
    async_session, client: AsyncClient, trigger_with_execution
):
    """Returns execution status data for a valid execution ID."""
    trigger, execution = trigger_with_execution
    response = await client.get(f"/ai-personas/ai-intakes/{execution.id}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["execution_id"] == str(execution.id)
    assert data["status"] == ExecutionStatus.IN_PROGRESS.value
    assert data["progress"] == 50


@pytest.mark.asyncio
async def test_get_status_by_execution_not_found(async_session, client: AsyncClient):
    """Returns 404 for an unknown execution ID."""
    response = await client.get(f"/ai-personas/ai-intakes/{uuid4()}/status")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /ai-personas/ai-intakes/{trigger_id}/trigger-status  –  status by trigger
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_trigger_status_success(
    async_session, client: AsyncClient, trigger_with_execution
):
    """Returns execution status when queried by trigger ID."""
    trigger, execution = trigger_with_execution
    response = await client.get(f"/ai-personas/ai-intakes/{trigger.id}/trigger-status")
    assert response.status_code == 200
    data = response.json()
    assert data["execution_id"] == str(execution.id)
    assert data["status"] == ExecutionStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_get_trigger_status_trigger_not_found(async_session, client: AsyncClient):
    """Returns 404 when the trigger ID doesn't exist."""
    response = await client.get(f"/ai-personas/ai-intakes/{uuid4()}/trigger-status")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_trigger_status_no_execution_assigned(
    async_session, client: AsyncClient, persona, created_intake
):
    """Returns 404 when the trigger has no execution_id yet."""
    trigger = AIIntakeTrigger(
        intake_id=created_intake.id,
        persona_id=persona.id,
        execution_id=None,
    )
    async_session.add(trigger)
    await async_session.commit()
    await async_session.refresh(trigger)

    response = await client.get(f"/ai-personas/ai-intakes/{trigger.id}/trigger-status")
    assert response.status_code == 404
    assert "execution" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# POST /ai-personas/ai-intakes/{trigger_id}/retry  –  retry execution
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_retry_ai_intake_success(
    async_session, client: AsyncClient, trigger_with_execution
):
    """Creates a new execution, updates the trigger's execution_id, returns 201."""
    trigger, old_execution = trigger_with_execution

    with patch(
        "app.routes.ai_persona_router.schedule_task",
        side_effect=_make_schedule_task_mock(trigger.intake_id),
    ):
        response = await client.post(f"/ai-personas/ai-intakes/{trigger.id}/retry")

    assert response.status_code == 201
    data = response.json()
    assert data["trigger_id"] == str(trigger.id)
    assert data["execution_id"] is not None

    # Trigger now points to a different (new) execution
    await async_session.refresh(trigger)
    assert trigger.execution_id != old_execution.id


@pytest.mark.asyncio
async def test_retry_ai_intake_trigger_not_found(async_session, client: AsyncClient):
    """Returns 404 when the trigger to retry does not exist."""
    response = await client.post(f"/ai-personas/ai-intakes/{uuid4()}/retry")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_retry_resets_intake_status_to_in_progress(
    async_session, client: AsyncClient, trigger_with_execution, created_intake
):
    """Retry sets the intake status back to IN_PROGRESS."""
    trigger, _ = trigger_with_execution
    # Manually mark intake as failed/error before retry
    created_intake.status = IntakeStatus.ERROR
    async_session.add(created_intake)
    await async_session.commit()

    with patch(
        "app.routes.ai_persona_router.schedule_task",
        side_effect=_make_schedule_task_mock(created_intake.id),
    ):
        response = await client.post(f"/ai-personas/ai-intakes/{trigger.id}/retry")

    assert response.status_code == 201
    await async_session.refresh(created_intake)
    assert created_intake.status == IntakeStatus.IN_PROGRESS


# ---------------------------------------------------------------------------
# POST /ai-personas/{persona_id}/test  –  test persona
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_test_persona_success(async_session, client: AsyncClient, persona):
    """Returns a generated response when the AI client succeeds."""
    mock_ai_client = MagicMock()
    mock_ai_client.generate_response = AsyncMock(
        return_value="Hello, I am the persona."
    )

    with patch(
        "app.utils.intake.ai_intake_executor.AIIntakeClient",
        return_value=mock_ai_client,
    ):
        response = await client.post(
            f"/ai-personas/{persona.id}/test",
            json={"message": "Tell me about yourself."},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Hello, I am the persona."


@pytest.mark.asyncio
async def test_test_persona_not_found(async_session, client: AsyncClient):
    """Returns 404 when the persona does not exist."""
    response = await client.post(
        f"/ai-personas/{uuid4()}/test",
        json={"message": "Hello"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_test_persona_inactive(async_session, client: AsyncClient, persona):
    """Returns 400 when the persona is inactive."""
    persona.is_active = False
    async_session.add(persona)
    await async_session.commit()

    response = await client.post(
        f"/ai-personas/{persona.id}/test",
        json={"message": "Hello"},
    )
    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_test_persona_ai_error(async_session, client: AsyncClient, persona):
    """Returns 500 when the underlying AI client raises an exception."""
    mock_ai_client = MagicMock()
    mock_ai_client.generate_response = AsyncMock(
        side_effect=RuntimeError("LLM unavailable")
    )

    with patch(
        "app.utils.intake.ai_intake_executor.AIIntakeClient",
        return_value=mock_ai_client,
    ):
        response = await client.post(
            f"/ai-personas/{persona.id}/test",
            json={"message": "Hello"},
        )

    assert response.status_code == 500
    assert "failed to generate" in response.json()["detail"].lower()
