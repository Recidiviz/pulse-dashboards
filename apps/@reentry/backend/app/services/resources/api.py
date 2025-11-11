from urllib.parse import urljoin

import httpx
import structlog
from fastapi import status
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.services.resources.resource_taxonomy import (
    ProviderOrigin,
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import GetResourcesRequest, TravelMode

logger = structlog.get_logger(__name__)

DISCOVER_ENDPOINT = "/v0/discover"


class ResourceAPIFailure(Exception):
    """
    Raised when the external resource API returns a server error (5xx), or when
    the response cannot be parsed into the expected format.

    This indicates a problem with the external API service or an incompatible
    response format.
    """


class BadResourceAPIRequest(Exception):
    """
    Raised when the external resource API returns a 422 Unprocessable Entity status.

    This indicates that the request parameters were invalid or malformed according
    to the API's validation rules.
    """


class LatLon(BaseModel):
    """Geographic coordinates in decimal degrees format."""

    latitude: float
    longitude: float


class DiscoveredResource(BaseModel):
    """
    A resource discovered near a given location.

    Contains location information, provider details, ratings, and optional
    travel information if a travel mode was specified in the request.
    """

    # Location Information
    google_place_id: str
    address: str
    location: LatLon

    # Core Information
    category: ResourceCategory = Field(
        description="The parent category for the requested resource."
    )
    subcategory: ResourceSubcategory = Field(
        description="The subcategory for the requested resource."
    )
    name: str = Field(
        description="The name of the provider for a resource.",
    )
    email: str | None = Field(
        default=None,
        description="The resource provider's email address",
    )
    phone: str | None = Field(
        default=None,
        description="The provider's phone number in the format 123-456-7890",
    )
    website: str | None = Field(
        default=None,
        description="The provider's website URL",
    )
    description: str | None = Field(
        default=None,
        description="A description of the provider, generally, separate from a resource.",
    )
    origin: ProviderOrigin

    # External Ratings from Google
    rating: float | None
    rating_count: int | None

    # Travel Information
    travel_mode: TravelMode | None
    travel_duration_minutes: int | None
    travel_distance_miles: float | None


def get_bad_response_detail(response: httpx.Response) -> str:
    """
    Extracts error detail from a failed API response.

    Args:
        response: The httpx response object from a failed request

    Returns:
        A human-readable error message, or a generic message if parsing fails
    """
    try:
        err_json = response.json()
        return str(err_json["detail"])
    except Exception as exc:
        logger.error(
            "Could not parse response from API",
            status_code=response.status_code,
            exc=exc,
        )
    return "Unknown reason, see logs."


async def discover_resources(
    client: httpx.AsyncClient,
    params: GetResourcesRequest,
) -> list[DiscoveredResource]:
    """
    Discovers resources near a location using the external resources API.

    Makes an authenticated POST request to the external resources API to find
    resources matching the given category, subcategory, and location criteria.

    Args:
        client: Configured httpx AsyncClient for making HTTP requests.
        params: Search parameters including category, subcategory, address, distance,
            and optional travel mode

    Returns:
        List of discovered resources, empty list if no resources found (204 response)

    Raises:
        EnvironmentError: If RESOURCE_API_URL or RESOURCE_API_KEY are not configured
        BadResourceAPIRequest: If the API returns 422 (invalid request parameters)
        ResourceAPIFailure: If the API returns a server error (5xx) or response cannot be parsed
    """

    # These fields are required in the pydantic settings, so they should always exist
    # before this function is called. Always nice to double check, though!
    if not settings.RESOURCE_API_URL:
        raise EnvironmentError("RESOURCE_API_URL is not configured in settings")

    if not settings.RESOURCE_API_KEY:
        raise EnvironmentError("RESOURCE_API_KEY is not configured in settings")

    url = urljoin(settings.RESOURCE_API_URL, DISCOVER_ENDPOINT)
    response = await client.post(
        url=url,
        json=params.model_dump(),
        headers={"x-api-key": settings.RESOURCE_API_KEY},
        timeout=10,
    )
    if response.status_code == status.HTTP_204_NO_CONTENT:
        logger.debug("No resources found from the Resource API", params=params)
        return []

    try:
        response.raise_for_status()
        raw_resource_list = response.json()
    except Exception as exc:
        err_detail = get_bad_response_detail(response)
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            raise BadResourceAPIRequest(
                f"We sent an incorrect request to the Resource API: {err_detail}"
            ) from exc
        if response.status_code == status.HTTP_404_NOT_FOUND:
            raise BadResourceAPIRequest(
                f"Resource API endpoint not found: {url}"
            ) from exc
        raise ResourceAPIFailure(f"The Resource API failed: {err_detail}") from exc

    resources = []
    logger.debug("Received %s resources from API", len(raw_resource_list))
    for raw_data in raw_resource_list:
        try:
            resources.append(DiscoveredResource(**raw_data))
        except ValidationError:
            logger.error("Unable to parse Resource API data", raw_data=raw_data)
    if raw_resource_list and not any(resources):
        raise ResourceAPIFailure(
            "Unable to parse Resource API data, does raw output match the "
            f"expected output schema of {DISCOVER_ENDPOINT}?"
        )
    return resources


# Can gut check with
# uv run --env-file .env python -m app.services.resources.api
if __name__ == "__main__":
    import asyncio

    async def main():
        req = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FINANCIAL_ASSISTANCE,
            # Can be a locale, skips travel information
            address="Ogden, UT",
        )
        async with httpx.AsyncClient() as client:
            resources = await discover_resources(client, req)
        return resources

    asyncio.run(main())
