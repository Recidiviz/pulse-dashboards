from typing import Iterable

import httpx

from app.services.resources.api import (
    BadResourceAPIRequest,
    DiscoveredResource,
    ResourceAPIFailure,
    discover_resources,
)
from app.services.resources.types import (
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceAPIResultType,
)
from app.utils.disallowed_resources import (
    ALWAYS_EXCLUDED_RESOURCE_KEYWORDS,
    DISALLOWED_RESOURCE_ADDRESSES,
    DISALLOWED_RESOURCE_NAMES,
)


# TODO(#10014): Use the same pydantic model from the API response
def _convert_to_internal_resource(result: DiscoveredResource) -> Resource:
    """
    Converts individual resource results from the Resource API into the pydantic
    model used by the rest of this application.
    """
    return Resource(
        id=str(result.google_place_id),
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
    )


# TODO(#10014): Since the API provides formatted addresses, we can likely migrate
# this into the API as well. (Need to confirm with other Recidiviz product teams
# that they never want correction facilities as well).
# Related issue: https://github.com/Recidiviz/recidiviz-resource/issues/132
def filtered_resources(
    discovered_resources: Iterable[DiscoveredResource],
) -> Iterable[DiscoveredResource]:
    """
    There are some locations that we never want to surface as resources.
    Regardless of the API filtering them out, we do an additional check
    here to ensure they never end up in product.
    """
    for resource in discovered_resources:
        if resource.name.lower() in DISALLOWED_RESOURCE_NAMES:
            continue
        if resource.address.lower() in DISALLOWED_RESOURCE_ADDRESSES:
            continue
        yield resource


async def list_resources(request: GetResourcesRequest) -> GetResourcesResponse:
    """Retrieve resources from our Resource API.

    Args:
        request: The resources request

    Returns:
        GetResourcesResponse with resources
    """
    request.keywords_to_exclude.extend(ALWAYS_EXCLUDED_RESOURCE_KEYWORDS)
    try:
        async with httpx.AsyncClient() as client:
            # Catches httpx errors and throws ResourceAPIFailure or BadResourceAPIRequest if relevant.
            discovered_resources = await discover_resources(client, request)
    except ResourceAPIFailure as exc:
        return GetResourcesResponse(
            resources=[],
            result=ResourceAPIResultType.API_ERROR,
            error_message=str(exc),
        )
    except BadResourceAPIRequest as exc:
        return GetResourcesResponse(
            resources=[],
            result=ResourceAPIResultType.BAD_REQUEST,
            error_message=str(exc),
        )
    resources = [
        _convert_to_internal_resource(resource)
        for resource in filtered_resources(discovered_resources)
    ]
    if not resources:
        return GetResourcesResponse(
            resources=[],
            result=ResourceAPIResultType.NO_RESULTS_FOUND,
            error_message=None,
        )
    return GetResourcesResponse(
        resources=resources,
        result=ResourceAPIResultType.SUCCESS,
        error_message=None,
    )
