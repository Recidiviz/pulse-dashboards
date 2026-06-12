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

import pytest
import pytest_asyncio

from app.core.db import AsyncSession
from app.crud.seen_item import get_seen_items_for_admin_and_intakes, upsert_seen_item
from app.models.base import IntakeType
from app.models.intake import Intake, IntakeStatus
from app.models.models import Plan
from app.models.seen_item import SeenItemType

SEEN_BY = "test_pseudonymized_id"


@pytest_asyncio.fixture
async def conversation_intake(
    async_session: AsyncSession, seed_configs, mock_client_data
):
    assessment_config_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]
    intake = Intake(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)
    return intake


@pytest_asyncio.fixture
async def plan_for_intake(async_session: AsyncSession, conversation_intake):
    plan = Plan(
        client_pseudo_id=conversation_intake.client_pseudo_id,
        intake_id=conversation_intake.id,
    )
    async_session.add(plan)
    await async_session.commit()
    await async_session.refresh(plan)
    return plan


# ---------------------------------------------------------------------------
# CRUD: upsert_seen_item
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upsert_seen_item_creates_record(
    async_session: AsyncSession, conversation_intake, plan_for_intake
):
    await upsert_seen_item(
        async_session,
        seen_by=SEEN_BY,
        intake_id=conversation_intake.id,
        item_type=SeenItemType.INTAKE_SUMMARY,
        item_id=plan_for_intake.id,
    )

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert len(items) == 1
    assert items[0].item_type == SeenItemType.INTAKE_SUMMARY
    assert items[0].item_id == plan_for_intake.id


@pytest.mark.asyncio
async def test_upsert_seen_item_is_idempotent(
    async_session: AsyncSession, conversation_intake, plan_for_intake
):
    for _ in range(3):
        await upsert_seen_item(
            async_session,
            seen_by=SEEN_BY,
            intake_id=conversation_intake.id,
            item_type=SeenItemType.ACTION_PLAN,
            item_id=plan_for_intake.id,
        )

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert len(items) == 1


# ---------------------------------------------------------------------------
# CRUD: get_seen_items_for_admin_and_intakes
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_seen_items_returns_empty_for_no_records(
    async_session: AsyncSession, conversation_intake
):
    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert items == []


@pytest.mark.asyncio
async def test_get_seen_items_filters_by_seen_by(
    async_session: AsyncSession, conversation_intake, plan_for_intake
):
    await upsert_seen_item(
        async_session,
        seen_by="other_admin",
        intake_id=conversation_intake.id,
        item_type=SeenItemType.INTAKE_SUMMARY,
        item_id=plan_for_intake.id,
    )

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert items == []


@pytest.mark.asyncio
async def test_get_seen_items_returns_empty_list_for_empty_intake_ids(
    async_session: AsyncSession,
):
    items = await get_seen_items_for_admin_and_intakes(async_session, SEEN_BY, [])
    assert items == []


# ---------------------------------------------------------------------------
# Cascade: deleting intake removes seen_items
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_seen_items_cascade_delete_with_intake(
    async_session: AsyncSession, conversation_intake, plan_for_intake
):
    await upsert_seen_item(
        async_session,
        seen_by=SEEN_BY,
        intake_id=conversation_intake.id,
        item_type=SeenItemType.INTAKE_SUMMARY,
        item_id=plan_for_intake.id,
    )

    intake_id = conversation_intake.id
    await async_session.delete(conversation_intake)
    await async_session.commit()
    async_session.expire_all()

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [intake_id]
    )
    assert items == []


# ---------------------------------------------------------------------------
# API: GET /intake/admin/{intake_id}/processing-status includes seen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_processing_status_seen_all_false_by_default(
    client,
    async_session: AsyncSession,
    conversation_intake,
    seed_configs,
    mock_clientdata_service,
):
    resp = await client.get(f"/intake/admin/{conversation_intake.id}/processing-status")
    assert resp.status_code == 200
    seen = resp.json()["seen"]
    assert seen["intake_conversation"] is False
    assert seen["intake_summary"] is False
    assert seen["action_plan"] is False


@pytest.mark.asyncio
async def test_processing_status_seen_conversation_after_mark(
    client,
    async_session: AsyncSession,
    conversation_intake,
    seed_configs,
    mock_clientdata_service,
):
    await upsert_seen_item(
        async_session,
        seen_by=SEEN_BY,
        intake_id=conversation_intake.id,
        item_type=SeenItemType.INTAKE_CONVERSATION,
        item_id=conversation_intake.id,
    )

    resp = await client.get(f"/intake/admin/{conversation_intake.id}/processing-status")
    assert resp.status_code == 200
    seen = resp.json()["seen"]
    assert seen["intake_conversation"] is True
    assert seen["intake_summary"] is False


@pytest.mark.asyncio
async def test_processing_status_seen_summary_and_plan_after_mark(
    client,
    async_session: AsyncSession,
    conversation_intake,
    plan_for_intake,
    seed_configs,
    mock_clientdata_service,
):
    await upsert_seen_item(
        async_session,
        seen_by=SEEN_BY,
        intake_id=conversation_intake.id,
        item_type=SeenItemType.INTAKE_SUMMARY,
        item_id=plan_for_intake.id,
    )

    resp = await client.get(f"/intake/admin/{conversation_intake.id}/processing-status")
    assert resp.status_code == 200
    seen = resp.json()["seen"]
    assert seen["intake_summary"] is True
    assert seen["action_plan"] is False


# ---------------------------------------------------------------------------
# API: POST /seen-items
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_mark_seen_endpoint_returns_204(
    client,
    async_session: AsyncSession,
    conversation_intake,
    plan_for_intake,
    mock_clientdata_service,
):
    resp = await client.post(
        "/seen-items",
        json={
            "intake_id": str(conversation_intake.id),
            "item_type": "intake_summary",
            "item_id": str(plan_for_intake.id),
        },
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_mark_seen_endpoint_is_idempotent(
    client,
    async_session: AsyncSession,
    conversation_intake,
    plan_for_intake,
    mock_clientdata_service,
):
    payload = {
        "intake_id": str(conversation_intake.id),
        "item_type": "intake_summary",
        "item_id": str(plan_for_intake.id),
    }
    await client.post("/seen-items", json=payload)
    resp = await client.post("/seen-items", json=payload)
    assert resp.status_code == 204

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert len(items) == 1


@pytest.mark.asyncio
async def test_mark_seen_endpoint_persists_record(
    client,
    async_session: AsyncSession,
    conversation_intake,
    plan_for_intake,
    mock_clientdata_service,
):
    await client.post(
        "/seen-items",
        json={
            "intake_id": str(conversation_intake.id),
            "item_type": "action_plan",
            "item_id": str(plan_for_intake.id),
        },
    )

    items = await get_seen_items_for_admin_and_intakes(
        async_session, SEEN_BY, [conversation_intake.id]
    )
    assert len(items) == 1
    assert items[0].item_type == SeenItemType.ACTION_PLAN
