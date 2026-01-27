from typing import List

import httpx
import structlog
from fastapi import status

from app.core.config import settings
from app.services.resources import (
    ApiSearchResult,
    GetResourcesResponse,
    LegacyResourceRequest,
    Resource,
    ResourceFailureReason,
)

logger = structlog.get_logger(__name__)


async def _call_legacy_resource_api(
    params: LegacyResourceRequest,
) -> List[ApiSearchResult]:
    """
    Make an HTTP request to the external resources API legacy endpoint.

    Args:
        params: The legacy search parameters

    Returns:
        List of search results
    """
    async with httpx.AsyncClient() as client:
        request_json = params.model_dump(exclude_none=True)
        response = await client.post(
            f"{settings.EXTERNAL_RESOURCES_API_URL}/legacy",
            json=request_json,
            headers={"x-api-key": settings.RESOURCES_API_KEY},
            timeout=30.0,  # 30 second timeout
        )
        if response.status_code == status.HTTP_204_NO_CONTENT:
            return []
        if response.status_code != 200:
            raise Exception(
                f"API request failed with status {response.status_code}: {response.text}"
            )
        return [ApiSearchResult.model_validate(data) for data in response.json()]


def _convert_to_internal_resource(result: ApiSearchResult) -> Resource:
    """
    Convert an external API search result to an internal Resource model.

    Args:
        result: The API search result

    Returns:
        Internal Resource model
    """
    # Convert external API result to internal Resource model
    resource = Resource(
        id=result.google_place_id,
        category=result.category,
        subcategory=result.subcategory,
        name=result.name,
        phone=result.phone,
        address=result.address,
        website=result.website,
        email=result.email,
        transport_minutes=result.travel_duration_minutes,
        transport_mode=result.travel_mode,
        rating=result.rating,
        ratingCount=result.rating_count,
        score=None,
    )
    return resource


async def list_legacy_resources(request: LegacyResourceRequest) -> GetResourcesResponse:
    """
    List resources from the legacy external API endpoint based on the request parameters.

    Filtering (ids_to_exclude, addresses_to_exclude, keywords_to_exclude) is handled
    by the external API server-side.

    Args:
        request: The legacy resources request

    Returns:
        GetResourcesResponse with the list of resources
    """
    # Check if external API is configured
    api_url = settings.EXTERNAL_RESOURCES_API_URL
    if not api_url:
        logger.error("External resources API URL not configured")
        raise ValueError("EXTERNAL_RESOURCES_API_URL is not configured in settings")

    logger.debug(
        "Starting legacy external resources search",
        category=request.category,
        subcategory=request.subcategory,
        travel_mode=request.mode,
        distance=request.distance_miles,
    )

    # Prepare result list
    resources = []
    category = request.category
    subcategory = request.subcategory

    try:
        results = await _call_legacy_resource_api(request)
        logger.debug(
            "Legacy External API returned results",
            category=category,
            subcategory=subcategory,
            results_count=len(results),
        )

        # Convert results to internal model
        # Note: Filtering is handled by external API, so we don't filter here
        for result in results:
            resource = _convert_to_internal_resource(result)
            resources.append(resource)

        logger.info(
            "Legacy external resources search completed",
            category=category,
            subcategory=subcategory,
            total_found=len(results),
            final_count=len(resources),
        )

        if len(resources) == 0:
            return GetResourcesResponse(
                resources=[],
                failure_reason=ResourceFailureReason.NO_RESULTS_FOUND,
                error_message=None,
            )
        else:
            return GetResourcesResponse(
                resources=resources,
                failure_reason=ResourceFailureReason.SUCCESS,
                error_message=None,
            )

    except Exception as error:
        logger.exception(
            "Failed to fetch legacy external resources",
            category=category,
            subcategory=subcategory,
            address=request.address,
            error=str(error),
            exc_info=error,
        )
        return GetResourcesResponse(
            resources=[],
            failure_reason=ResourceFailureReason.API_ERROR,
            error_message=str(error),
        )
