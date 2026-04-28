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

import asyncio

import structlog
from langsmith import traceable

from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    GetResourcesRequest,
    ResourceFailureReason,
)
from app.services.resources.api import list_external_resources
from app.utils.action_plan_types import (
    ActionPlanResourcesAssociations,
    ResourceAssociation,
)

logger = structlog.get_logger(__name__)


@traceable(name="fetch_resources_with_retry")
async def fetch_resources_with_retry(
    request: GetResourcesRequest, max_retries: int = 2
) -> list:
    """Fetch resources from the external API with exponential-backoff retry.

    Retries only on API errors or unexpected exceptions. Returns an empty list
    immediately on NO_RESULTS_FOUND (broadening the search is out of scope here)
    and after exhausting all retry attempts.

    Args:
        request: Parameters for the resource lookup (category, subcategory, address, etc.)
        max_retries: Maximum number of additional attempts after the first (default: 2,
                     giving up to 3 total attempts with 1s and 2s backoff gaps).

    Returns:
        List of matching Resource objects, or [] if none found or all attempts fail.
    """
    for attempt in range(max_retries + 1):
        if attempt > 0:
            wait_time = 2 ** (attempt - 1)
            logger.debug("Retrying resource fetch", attempt=attempt, wait_s=wait_time)
            await asyncio.sleep(wait_time)

        try:
            result = await list_external_resources(request)
        except Exception as e:
            logger.warning(
                "Unexpected error fetching resources", attempt=attempt, error=str(e)
            )
            continue

        if result.failure_reason == ResourceFailureReason.SUCCESS:
            logger.debug(
                "Resources fetched", attempt=attempt, count=len(result.resources)
            )
            return result.resources
        elif result.failure_reason == ResourceFailureReason.NO_RESULTS_FOUND:
            logger.debug("No resources found", attempt=attempt)
            return []
        else:
            logger.warning(
                "API error fetching resources",
                attempt=attempt,
                error=result.error_message,
            )

    logger.error("Max retries reached, returning empty resources")
    return []


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
