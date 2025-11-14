from app.services.resources import (
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
)

from .stub import resources as available_resources


def _list_resources_internal(request: GetResourcesRequest) -> GetResourcesResponse:
    # Collect the parameters from the request body
    resources = []

    if request.category in available_resources:
        if (
            request.subcategory
            and request.subcategory in available_resources[request.category]
        ):
            resources = available_resources[request.category][request.subcategory]
        else:
            resources = list(available_resources[request.category].values())[0]

    # Process the resources
    filtered_resources = []
    for r in resources:
        # Check if the resource should be excluded by name
        if request.exclude_names and any(
            exclude.lower() in r["name"].lower() for exclude in request.exclude_names
        ):
            continue

        # Check if the resource should be excluded by ID
        if request.exclude_ids and r["id"] in request.exclude_ids:
            continue

        # Add the resource to the filtered list
        filtered_resources.append(
            Resource(category=request.category, subcategory=request.subcategory, **r)
        )

    return GetResourcesResponse(resources=filtered_resources)


def get_resource_by_id(resource_id: str):
    for category, categories in available_resources.items():
        for subcategory, resources in categories.items():
            for resource in resources:
                if resource["id"] == resource_id:
                    return resource

    return None
