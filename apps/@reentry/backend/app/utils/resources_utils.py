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
"""Utilities for working with resources in action plans."""

import structlog

from app.services.resources import CATEGORY_SUBCATEGORY_MAP
from app.utils.action_plan_types import (
    ActionPlanResourcesAssociations,
    ResourceAssociation,
)

logger = structlog.get_logger(__name__)


def transform_resources_associations_to_map(
    resources_associations: ActionPlanResourcesAssociations | None,
) -> dict[str, list[ResourceAssociation]] | None:
    """
    Transform ActionPlanResourcesAssociations to a dictionary mapping sections to resources.

    Args:
        resources_associations: The resources associations from the LLM agent graph state

    Returns:
        A dictionary mapping section titles to lists of ResourceAssociation objects.
        Example: {
            "Housing": [
                ResourceAssociation(resource_category=HOUSING, resource_subcategory=EMERGENCY),
                ResourceAssociation(resource_category=HOUSING, resource_subcategory=TRANSITIONAL)
            ],
            "Mental Health": [
                ResourceAssociation(resource_category=MENTAL_HEALTH, resource_subcategory=THERAPY)
            ]
        }
    """
    if not resources_associations:
        return None

    result: dict[str, list[ResourceAssociation]] = {}

    for association in resources_associations.associations:
        section_title = association.section_title
        resources_list = []

        for subcategory in association.subcategories:
            # Find the parent category for this subcategory
            parent_category = None
            for category, subcategories in CATEGORY_SUBCATEGORY_MAP.items():
                if subcategory in subcategories:
                    parent_category = category
                    break

            if not parent_category:
                logger.warning(
                    "No parent category found for subcategory",
                    subcategory=subcategory,
                    section=section_title,
                )
                continue

            resources_list.append(
                ResourceAssociation(
                    resource_category=parent_category,
                    resource_subcategory=subcategory,
                )
            )

        if resources_list:
            result[section_title] = resources_list

    return result if result else None
