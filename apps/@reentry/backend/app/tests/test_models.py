from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.db import AsyncSession
from app.models.models import Plan, PlanAsset, PlanGeneration, PlanGenerationResourceAssociation, ResourceAssociationAction


@pytest.mark.asyncio
async def test_create_plan(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    result = await async_session.get(Plan, new_plan.id)
    assert result is not None
    assert result.client_pseudo_id == "client_1"


@pytest.mark.asyncio
async def test_create_plan_asset(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_asset = PlanAsset(
        plan_id=new_plan.id,
        client_pseudo_id="client_1",
        filename="example.png",
        file_blob=b"fake_data",
        mimetype="image/png",
    )
    async_session.add(new_asset)
    await async_session.commit()

    result = await async_session.get(PlanAsset, new_asset.id)
    assert result is not None
    assert result.filename == "example.png"
    assert result.mimetype == "image/png"
    assert result.file_blob == b"fake_data"
    assert result.plan_id == new_plan.id


@pytest.mark.asyncio
async def test_create_plan_generation(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_generation = PlanGeneration(
        plan_id=new_plan.id,
        prompt="Test prompt",
        markdown_result="**Test result**",
    )
    async_session.add(new_generation)
    await async_session.commit()

    result = await async_session.get(PlanGeneration, new_generation.id)
    assert result is not None
    assert result.status == "not_started"
    assert result.prompt == "Test prompt"
    assert result.markdown_result == "**Test result**"
    assert result.plan_id == new_plan.id


def _make_event(
    resource_id: str,
    action: ResourceAssociationAction,
    action_at: datetime,
    section_title: str = "Housing",
) -> PlanGenerationResourceAssociation:
    return PlanGenerationResourceAssociation(
        plan_generation_id=uuid4(),
        resource_id=resource_id,
        section_title=section_title,
        action=action,
        action_by="SYSTEM",
        action_at=action_at,
    )


def _gen_with_events(events: list):
    """Returns a mock PlanGeneration with the given resource_associations."""
    gen = MagicMock()
    gen.resource_associations = events
    return gen


def _call_property(gen) -> list:
    """Calls active_resource_associations directly, bypassing ORM instrumentation."""
    return PlanGeneration.active_resource_associations.fget(gen)


def test_active_resource_associations_returns_added_resources():
    gen = _gen_with_events([
        _make_event("r1", ResourceAssociationAction.ADD, datetime(2024, 1, 1, tzinfo=timezone.utc)),
        _make_event("r2", ResourceAssociationAction.ADD, datetime(2024, 1, 2, tzinfo=timezone.utc)),
    ])

    assert {a.resource_id for a in _call_property(gen)} == {"r1", "r2"}


def test_active_resource_associations_excludes_removed_resources():
    gen = _gen_with_events([
        _make_event("r1", ResourceAssociationAction.ADD, datetime(2024, 1, 1, tzinfo=timezone.utc)),
        _make_event("r1", ResourceAssociationAction.REMOVE, datetime(2024, 1, 2, tzinfo=timezone.utc)),
    ])

    assert _call_property(gen) == []


def test_active_resource_associations_re_added_resource_is_active():
    gen = _gen_with_events([
        _make_event("r1", ResourceAssociationAction.ADD, datetime(2024, 1, 1, tzinfo=timezone.utc)),
        _make_event("r1", ResourceAssociationAction.REMOVE, datetime(2024, 1, 2, tzinfo=timezone.utc)),
        _make_event("r1", ResourceAssociationAction.ADD, datetime(2024, 1, 3, tzinfo=timezone.utc)),
    ])

    active = _call_property(gen)

    assert len(active) == 1
    assert active[0].resource_id == "r1"


def test_active_resource_associations_reflects_latest_section_title():
    """When a resource is re-added to a different section, the new section is returned."""
    t1, t2, t3 = (
        datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2, 3)
    )
    gen = _gen_with_events([
        _make_event("r1", ResourceAssociationAction.ADD, t1, section_title="Housing"),
        _make_event("r1", ResourceAssociationAction.REMOVE, t2, section_title="Housing"),
        _make_event("r1", ResourceAssociationAction.ADD, t3, section_title="Employment"),
    ])

    active = _call_property(gen)

    assert active[0].section_title == "Employment"


def test_active_resource_associations_same_resource_in_multiple_sections():
    """A resource added to two different sections should appear as active in both."""
    t1, t2 = (datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2))
    gen = _gen_with_events([
        _make_event("r1", ResourceAssociationAction.ADD, t1, section_title="Housing"),
        _make_event("r1", ResourceAssociationAction.ADD, t2, section_title="Employment"),
    ])

    active = _call_property(gen)

    assert len(active) == 2
    assert {a.section_title for a in active} == {"Housing", "Employment"}


def test_active_resource_associations_empty_ledger():
    gen = _gen_with_events([])

    assert _call_property(gen) == []
