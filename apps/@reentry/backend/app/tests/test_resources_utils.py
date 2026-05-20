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
"""Unit tests for app.utils.resources_utils.transform_resources_associations_to_map."""

from app.services.resources import ResourceSubcategory
from app.utils.action_plan_types import (
    ActionPlanResourcesAssociations,
    ActionPlanSectionResourceTypes,
)
from app.utils.resources_utils import transform_resources_associations_to_map


def _make_associations(section_title: str, subcategories: list[ResourceSubcategory]):
    return ActionPlanResourcesAssociations(
        associations=[
            ActionPlanSectionResourceTypes(
                section_title=section_title,
                subcategories=subcategories,
            )
        ]
    )


def test_subcategory_is_included():
    """A subcategory passes through to the result map."""
    result = transform_resources_associations_to_map(
        _make_associations("Housing", [ResourceSubcategory.EMERGENCY])
    )
    assert result is not None
    assert "Housing" in result
    assert result["Housing"][0].resource_subcategory == ResourceSubcategory.EMERGENCY
