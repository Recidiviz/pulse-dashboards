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
"""Unit tests for app.tasks.action_plan."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.models import ResourceAssociationAction
from app.tasks.action_plan import hydrate_resource_associations

# Enum string values for ResourceAssociation dicts stored in resources_associations_map.
# These match ResourceCategory.HOUSING.value and ResourceSubcategory.EMERGENCY.value.
_HOUSING_EMERGENCY = {
    "resource_category": "Housing",
    "resource_subcategory": "Emergency housing and shelters",
}
_HOUSING_TRANSITIONAL = {
    "resource_category": "Housing",
    "resource_subcategory": "Transitional housing",
}


def _make_gen(resources_associations_map=None, address="123 Main St, Chicago, IL"):
    gen = MagicMock()
    gen.id.hex = "deadbeef"
    gen.resources_associations_map = resources_associations_map
    gen.plan.intake.address.as_formatted_string.return_value = address
    return gen


def _make_session() -> AsyncMock:
    session = AsyncMock()
    # add_all is synchronous; using a plain MagicMock avoids "coroutine never awaited" warnings.
    session.add_all = MagicMock()
    return session


def _make_resource(resource_id: int) -> MagicMock:
    r = MagicMock()
    r.resource_id = resource_id
    return r


@pytest.mark.asyncio
async def test_hydrate_skips_when_no_map():
    """Returns early without touching the DB when resources_associations_map is falsy."""
    session = _make_session()
    logger = MagicMock()

    await hydrate_resource_associations(_make_gen(resources_associations_map=None), session, logger)
    await hydrate_resource_associations(_make_gen(resources_associations_map={}), session, logger)

    session.add_all.assert_not_called()
    session.commit.assert_not_called()


@pytest.mark.asyncio
async def test_hydrate_warns_and_skips_when_address_missing():
    """Logs a warning and skips DB writes when client address is unavailable."""
    gen = _make_gen(resources_associations_map={"Housing": [_HOUSING_EMERGENCY]})
    gen.plan.intake.address = None
    session = _make_session()
    logger = MagicMock()

    await hydrate_resource_associations(gen, session, logger)

    logger.warning.assert_called_once()
    session.add_all.assert_not_called()


@pytest.mark.asyncio
async def test_hydrate_inserts_add_rows_on_success():
    """Creates one ADD row per resource returned, with correct metadata."""
    gen = _make_gen(resources_associations_map={"Housing": [_HOUSING_EMERGENCY]})
    session = _make_session()
    logger = MagicMock()

    with patch(
        "app.tasks.action_plan.fetch_resources_with_retry",
        new_callable=AsyncMock,
        return_value=[_make_resource(1), _make_resource(2)],
    ):
        await hydrate_resource_associations(gen, session, logger)

    session.add_all.assert_called_once()
    rows = session.add_all.call_args[0][0]
    assert len(rows) == 2
    for row in rows:
        assert row.plan_generation_id == gen.id
        assert row.section_title == "Housing"
        assert row.action == ResourceAssociationAction.ADD
        assert row.action_by == "SYSTEM"
    assert {r.resource_id for r in rows} == {1, 2}
    session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_hydrate_deduplicates_same_resource_in_same_section():
    """When two subcategory requests return the same resource for the same section,
    only one ADD row is inserted."""
    gen = _make_gen(
        resources_associations_map={
            "Housing": [_HOUSING_EMERGENCY, _HOUSING_TRANSITIONAL]
        }
    )
    session = _make_session()
    logger = MagicMock()

    # Both subcategory fetches return the same resource
    with patch(
        "app.tasks.action_plan.fetch_resources_with_retry",
        new_callable=AsyncMock,
        return_value=[_make_resource(1)],
    ):
        await hydrate_resource_associations(gen, session, logger)

    rows = session.add_all.call_args[0][0]
    assert len(rows) == 1
    assert rows[0].resource_id == 1


@pytest.mark.asyncio
async def test_hydrate_same_resource_allowed_in_different_sections():
    """The same resource ID can appear as an ADD row in two different sections."""
    gen = _make_gen(
        resources_associations_map={
            "Housing": [_HOUSING_EMERGENCY],
            "Basic Needs": [
                {"resource_category": "Basic Needs", "resource_subcategory": "Food assistance"}
            ],
        }
    )
    session = _make_session()
    logger = MagicMock()

    # Both sections return the same resource
    with patch(
        "app.tasks.action_plan.fetch_resources_with_retry",
        new_callable=AsyncMock,
        return_value=[_make_resource(1)],
    ):
        await hydrate_resource_associations(gen, session, logger)

    rows = session.add_all.call_args[0][0]
    assert len(rows) == 2
    assert {r.section_title for r in rows} == {"Housing", "Basic Needs"}
    assert all(r.resource_id == 1 for r in rows)


@pytest.mark.asyncio
async def test_hydrate_logs_warning_on_fetch_exception_continues():
    """A fetch exception for one job logs a warning but does not prevent other rows
    from being inserted."""
    gen = _make_gen(
        resources_associations_map={
            "Housing": [_HOUSING_EMERGENCY],
            "Employment": [
                {"resource_category": "Employment", "resource_subcategory": "Second-chance employer"}
            ],
        }
    )
    session = _make_session()
    logger = MagicMock()

    # Employment fetch raises; Housing fetch succeeds
    housing_resource = _make_resource(1)

    async def _side_effect(request):
        if request.subcategory == "Emergency housing and shelters":
            return [housing_resource]
        raise RuntimeError("simulated API failure")

    with patch(
        "app.tasks.action_plan.fetch_resources_with_retry",
        side_effect=_side_effect,
    ):
        await hydrate_resource_associations(gen, session, logger)

    logger.warning.assert_called()
    rows = session.add_all.call_args[0][0]
    assert len(rows) == 1
    assert rows[0].resource_id == 1


@pytest.mark.asyncio
async def test_hydrate_skips_commit_when_no_resources_returned():
    """Does not call session.add_all or commit when all fetches return empty lists."""
    gen = _make_gen(resources_associations_map={"Housing": [_HOUSING_EMERGENCY]})
    session = _make_session()
    logger = MagicMock()

    with patch(
        "app.tasks.action_plan.fetch_resources_with_retry",
        new_callable=AsyncMock,
        return_value=[],
    ):
        await hydrate_resource_associations(gen, session, logger)

    session.add_all.assert_not_called()
    session.commit.assert_not_called()
