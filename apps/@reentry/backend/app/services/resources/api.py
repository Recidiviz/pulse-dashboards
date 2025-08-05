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


def _determine_travel_mode(request: GetResourcesRequest) -> Optional[DistanceMode]:
    """
    Determine the appropriate travel mode based on client capabilities.

    Args:
        request: The resources request containing client transportation info

    Returns:
        Appropriate DistanceMode or None
    """
    if request.can_drive is not False:
        return DistanceMode.DRIVING
    elif request.transit_pass is not False:
        return DistanceMode.TRANSIT
    elif request.can_bike is not False:
        return DistanceMode.BICYCLING
    elif request.can_walk is not False:
        return DistanceMode.WALKING
    return None


def _determine_distance(travel_mode: Optional[DistanceMode]) -> int:
    mode_distance_matching = {
        DistanceMode.WALKING: 5,
        DistanceMode.BICYCLING: 10,
        DistanceMode.TRANSIT: 50,
        DistanceMode.DRIVING: 100,
        None: 100,
    }
    return mode_distance_matching[travel_mode]


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

    # Find a valid address from the available options, in priority order
    address = None

    # Try home address first
    if request.home:
        address = request.home
    # Then try work address
    elif request.work:
        address = request.work
    # Then try school address
    elif request.school:
        address = request.school
    # Finally try probation office
    elif request.probation_office:
        address = request.probation_office

    # Raise error if no address is available
    if not address:
        logger.error(
            "No address provided for external resources search",
            category=request.category,
            subcategory=request.subcategory,
        )
        raise ValueError(
            "At least one address (home, work, school, or probation_office) is required for external resources API"
        )

    # Determine travel mode based on client capabilities
    travel_mode = _determine_travel_mode(request)
    distance = _determine_distance(travel_mode)

    logger.debug(
        "Starting external resources search",
        category=request.category,
        subcategory=request.subcategory,
        travel_mode=travel_mode,
        distance=distance,
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
            textSearch="",  # Todo handle this
            address=address,  # Use the full address string
            distance=distance,  # Default 100 miles
            mode=travel_mode,
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
        logger.error(
            "Failed to fetch external resources",
            category=category,
            subcategory=subcategory,
            address=address,
            error=str(error),
            exc_info=error,
        )
        return GetResourcesResponse(
            resources=[],
            failure_reason=ResourceFailureReason.API_ERROR,
            error_message=str(error),
        )

    return GetResourcesResponse(resources=resources)
