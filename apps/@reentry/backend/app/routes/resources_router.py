from fastapi import APIRouter

from app.services.resources import (
    GetResourcesRequest,
    GetResourcesResponse,
    list_resources,
)

router = APIRouter()


# TODO handle pagination
@router.post(
    "/resources",
    response_model=GetResourcesResponse,
    summary="Search for resources",
    description="Search for resources based on the resource types needed and others criterias",
)
async def get_resources(request: GetResourcesRequest):
    return await list_resources(request)
