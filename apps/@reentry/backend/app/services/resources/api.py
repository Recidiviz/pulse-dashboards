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

from ..resources import LegacyResourceRequest, ResourceCategory, ResourceSubcategory
from . import (
    TravelMode,
)

logger = structlog.get_logger(__name__)


class Location(BaseModel):
    latitude: float
    longitude: float


class ApiSearchResult(BaseModel):
    # Core Information
    google_place_id: str
    name: str
    category: ResourceCategory
    subcategory: Optional[ResourceSubcategory] = None
    origin: str
    description: Optional[str] = None

    # Location
    location: Location
    address: str

    # Contact Information
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    # External Ratings
    rating: Optional[float] = None
    rating_count: Optional[int] = None

    # Travel Information
    travel_mode: Optional[TravelMode] = None
    travel_duration_minutes: Optional[int] = None
    travel_distance_miles: Optional[int] = None


async def call_resource_api(params: LegacyResourceRequest) -> List[ApiSearchResult]:
    """
    Make an HTTP request to the external resources API.

    Args:
        params: The search parameters

    Returns:
        List of search results
    """
    async with httpx.AsyncClient() as client:
        request_json = params.model_dump(exclude_none=False)
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


async def list_external_resources(request: GetResourcesRequest) -> GetResourcesResponse:
    """
    List resources from the external API based on the request parameters.

    Args:
        request: The resources request
        limit: Optional limit of results per resource type

    Returns:
        GetResourcesResponse with the list of resources
    """
    # Check if external API is configured
    api_url = settings.EXTERNAL_RESOURCES_API_URL
    if not api_url:
        logger.error("External resources API URL not configured")
        raise ValueError("EXTERNAL_RESOURCES_API_URL is not configured in settings")

    logger.debug(
        "Starting external resources search",
        category=request.category,
        subcategory=request.subcategory,
        travel_mode=request.travel_mode,
        distance=request.distance_miles,
    )

    # Prepare result list
    resources = []
    category = request.category
    subcategory = request.subcategory

    try:
        params = LegacyResourceRequest(
            category=category,
            subcategory=subcategory,
            address=request.address,
            distance_miles=request.distance_miles,
            mode=request.travel_mode,
        )
        results = await call_resource_api(params)
        logger.debug(
            "External API returned results",
            category=category,
            subcategory=subcategory,
            results_count=len(results),
        )

        # Process results
        excluded_by_name = 0
        excluded_by_id = 0

        # Process results
        for result in results:
            # Skip if excluded by name
            if request.exclude_names and any(
                exclude.lower() in result.name.lower()
                for exclude in request.exclude_names
            ):
                excluded_by_name += 1
                continue

            # Convert to internal model
            resource = _convert_to_internal_resource(result)

            # Skip if excluded by ID
            if request.exclude_ids and resource.id in request.exclude_ids:
                excluded_by_id += 1
                continue

            # Add to results
            resources.append(resource)

        logger.info(
            "External resources search completed",
            category=category,
            subcategory=subcategory,
            total_found=len(results),
            excluded_by_name=excluded_by_name,
            excluded_by_id=excluded_by_id,
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
            "Failed to fetch external resources",
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

    return GetResourcesResponse(resources=resources)
