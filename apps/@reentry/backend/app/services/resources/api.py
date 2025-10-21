from typing import Generic, List, Optional, TypeVar
from uuid import UUID

import httpx
import structlog
from pydantic import BaseModel

from app.core.config import settings
from app.services.resources import (
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceFailureReason,
)

from ..resources import ParameterSearchBodyParams, ResourceCategory, ResourceSubcategory
from . import (
    DistanceMode,
)

logger = structlog.get_logger(__name__)


class ApiSearchResult(BaseModel):
    # Resource Identification
    id: UUID
    uri: str

    # Core Information
    name: str
    category: ResourceCategory
    subcategory: Optional[ResourceSubcategory] = None

    # Location
    lat: float
    lon: float
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None

    # Contact Information
    website: Optional[str] = None
    maps_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    # Content
    description: Optional[str] = None
    tags: Optional[List[str]] = None

    # Metadata
    origin: str
    banned: Optional[bool] = None
    banned_reason: Optional[str] = None
    score: Optional[float] = None

    # LLM Evaluation
    llm_rank: Optional[int] = None
    llm_valid: Optional[bool] = None

    # External Ratings
    rating: Optional[float] = None
    ratingCount: Optional[int] = None
    operationalStatus: Optional[str] = None
    price_level: Optional[str] = None

    # Travel Information
    transport_mode: Optional[DistanceMode] = None
    transport_minutes: Optional[int] = None


T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    data: T


async def search_resource_api(
    params: ParameterSearchBodyParams,
) -> List[ApiSearchResult]:
    """
    Make an HTTP request to the external resources API.

    Args:
        params: The search parameters

    Returns:
        List of search results
    """
    api_url = settings.EXTERNAL_RESOURCES_API_URL
    if not api_url:
        raise ValueError("EXTERNAL_RESOURCES_API_URL is not configured in settings")

    resources_api_key = settings.RESOURCES_API_KEY
    if not resources_api_key:
        raise ValueError("RESOURCES_API_KEY is not configured in settings")

    async with httpx.AsyncClient() as client:
        request_json = params.dict(exclude_none=True)
        response = await client.post(
            f"{api_url}/parameter-search",
            json=request_json,
            headers={"x-api-key": settings.RESOURCES_API_KEY},
            timeout=30.0,  # 30 second timeout
        )

        if response.status_code != 200:
            raise Exception(
                f"API request failed with status {response.status_code}: {response.text}"
            )

        result = APIResponse[List[ApiSearchResult]].parse_obj(response.json())
        logger.debug("Resource API Response", request=request_json, result=result)
        return result.data


def _convert_to_internal_resource(result: ApiSearchResult) -> Resource:
    """
    Convert an external API search result to an internal Resource model.

    Args:
        result: The API search result

    Returns:
        Internal Resource model
    """
    # Build address if components are available
    address = None
    if result.street:
        address_parts = []
        if result.street:
            address_parts.append(result.street)
        if result.city:
            address_parts.append(result.city)
        if result.state:
            state_zip = result.state
            if result.zip:
                state_zip += f" {result.zip}"
            address_parts.append(state_zip)

        if address_parts:
            address = ", ".join(address_parts)

    # Convert external API result to internal Resource model
    resource = Resource(
        id=str(result.id),
        category=result.category,
        subcategory=result.subcategory,
        name=result.name,
        phone=result.phone,
        address=address,
        website=result.website,
        email=result.email,
        transport_minutes=result.transport_minutes,
        transport_mode=result.transport_mode,
        rating=result.rating,
        ratingCount=result.ratingCount,
        score=result.score,
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
        # Create search parameters
        params = ParameterSearchBodyParams(
            category=category,
            subcategory=subcategory,
            # TODO(#10014): Deprecate this field in the new API
            textSearch="",
            address=request.address,
            distance=request.distance_miles,
            mode=request.travel_mode,
            time=None,
        )

        # Call the API
        results = await search_resource_api(params)
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
