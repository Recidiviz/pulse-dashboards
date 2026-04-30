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

from typing import List, Optional

import httpx
import structlog
from fastapi import status
from pydantic import BaseModel

from app.core.config import settings
from app.services.resources import (
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceFailureReason,
)

logger = structlog.get_logger(__name__)


class DigitalResourceResponse(BaseModel):
    category: str
    subcategory: str
    url: str
    name: str
    origin: str
    provider_description: str
    blurb: str
    resource_description: Optional[str] = None


async def _call_partner_api(
    request: GetResourcesRequest,
) -> List[DigitalResourceResponse]:
    async with httpx.AsyncClient() as client:
        request_json = {
            "category": request.category,
            "subcategory": request.subcategory,
            "address": request.address,
            "distance_miles": request.distance_miles,
            "limit": request.limit,
        }
        if request.travel_mode:
            request_json["travel_mode"] = request.travel_mode
        if request.exclude_ids:
            request_json["ids_to_exclude"] = request.exclude_ids
        if request.exclude_addresses:
            request_json["addresses_to_exclude"] = request.exclude_addresses
        if request.exclude_names:
            request_json["keywords_to_exclude"] = request.exclude_names

        response = await client.post(
            f"{settings.EXTERNAL_RESOURCES_API_URL}/api/v0/partners",
            json=request_json,
            headers={"x-api-key": settings.RESOURCES_API_KEY},
            timeout=30.0,
        )

        if response.status_code == status.HTTP_204_NO_CONTENT:
            return []
        if response.status_code != 200:
            raise Exception(
                f"Partner API request failed with status {response.status_code}: {response.text}"
            )

        return [
            DigitalResourceResponse.model_validate(data) for data in response.json()
        ]


def _convert_to_internal_resource(result: DigitalResourceResponse) -> Resource:
    return Resource(
        id=f"partner_{hash(result.url)}",
        category=result.category,
        subcategory=result.subcategory,
        name=result.name,
        origin=result.origin,
        url=result.url,
        blurb=result.blurb,
        provider_description=result.provider_description,
        description=result.resource_description,
        website=result.url,
    )


async def discover_partners(request: GetResourcesRequest) -> GetResourcesResponse:
    api_url = settings.EXTERNAL_RESOURCES_API_URL
    if not api_url:
        raise ValueError("EXTERNAL_RESOURCES_API_URL is not configured in settings")

    logger.debug(
        "Starting partner resources search",
        category=request.category,
        subcategory=request.subcategory,
    )

    try:
        results = await _call_partner_api(request)
        resources = [_convert_to_internal_resource(r) for r in results]

        logger.info(
            "Partner resources search completed",
            category=request.category,
            subcategory=request.subcategory,
            total_found=len(resources),
        )

        return GetResourcesResponse(
            resources=resources,
            failure_reason=ResourceFailureReason.SUCCESS
            if resources
            else ResourceFailureReason.NO_RESULTS_FOUND,
        )

    except Exception as error:
        logger.exception(
            "Failed to fetch partner resources",
            category=request.category,
            subcategory=request.subcategory,
            error=str(error),
        )
        return GetResourcesResponse(
            resources=[],
            failure_reason=ResourceFailureReason.API_ERROR,
            error_message=str(error),
        )
