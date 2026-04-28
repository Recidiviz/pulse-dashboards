from typing import List

import httpx
import structlog
from app.core.config import settings
from app.services.resources import (
    ApiSearchResult,
    BatchGetResources,
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceFailureReason,
)
from fastapi import status

logger = structlog.get_logger(__name__)


async def _call_resource_api(request: GetResourcesRequest) -> List[ApiSearchResult]:
    """
    Make an HTTP request to the external resources API v0 endpoint.
    Uses /search endpoint when use_search is True, otherwise uses /discover.

    Args:
        request: The search parameters

    Returns:
        List of search results
    """
    async with httpx.AsyncClient() as client:
        # Build request payload matching ResourceRequest schema
        request_json = {
            "category": request.category,
            "subcategory": request.subcategory,
            "address": request.address,
            "distance_miles": request.distance_miles,
            "travel_mode": request.travel_mode,
            "ids_to_exclude": request.exclude_ids if request.exclude_ids else None,
            "addresses_to_exclude": (
                request.exclude_addresses if request.exclude_addresses else None
            ),
            "keywords_to_exclude": (
                request.exclude_names if request.exclude_names else None
            ),
            "limit": request.limit,
        }

        # Use /search endpoint for resource swapping, /discover for general discovery
        endpoint = "search" if request.use_search else "discover"
        response = await client.post(
            f"{settings.EXTERNAL_RESOURCES_API_URL}/api/v0/{endpoint}",
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
        resource_id=result.resource_id
    )
    return resource


async def batch_get_resources(request: BatchGetResources) -> list[Resource]:
    """
    Fetch enriched details for a specific set of resources by ID from the external API.

    POSTs to /api/v0/resources with the client address and resource IDs so the
    external service can compute travel time/mode for each resource.

    Args:
        request: Address, resource IDs, and optional travel mode

    Returns:
        List of Resource objects with travel and contact details populated
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.EXTERNAL_RESOURCES_API_URL}/api/v0/resources",
            json={
                "address": request.address,
                "ids": request.ids,
                "travel_mode": request.travel_mode,
            },
            headers={"x-api-key": settings.RESOURCES_API_KEY},
            timeout=30.0,
        )
        if response.status_code == status.HTTP_204_NO_CONTENT:
            return []
        if response.status_code != 200:
            raise Exception(
                f"API request failed with status {response.status_code}: {response.text}"
            )
        results = [ApiSearchResult.model_validate(data) for data in response.json()]
        return [_convert_to_internal_resource(r) for r in results]


async def list_external_resources(request: GetResourcesRequest) -> GetResourcesResponse:
    """
    List resources from the external API v0 endpoint based on the request parameters.
    Uses /search endpoint when use_search is True, otherwise uses /discover.

    Args:
        request: The resources request

    Returns:
        GetResourcesResponse with the list of resources
    """
    # Check if external API is configured
    api_url = settings.EXTERNAL_RESOURCES_API_URL
    if not api_url:
        logger.error("External resources API URL not configured")
        raise ValueError("EXTERNAL_RESOURCES_API_URL is not configured in settings")

    endpoint_type = "search" if request.use_search else "discover"
    logger.debug(
        "Starting new external resources search",
        category=request.category,
        subcategory=request.subcategory,
        travel_mode=request.travel_mode,
        distance=request.distance_miles,
        endpoint=endpoint_type,
    )

    # Prepare result list
    resources = []
    category = request.category
    subcategory = request.subcategory

    try:
        results = await _call_resource_api(request)
        logger.debug(
            "New External API returned results",
            category=category,
            subcategory=subcategory,
            results_count=len(results),
        )

        # Process results - convert to internal model
        for result in results:
            resource = _convert_to_internal_resource(result)
            resources.append(resource)

        logger.info(
            "New external resources search completed",
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
            "Failed to fetch new external resources",
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
