from fastapi import APIRouter

from app.services.resources.list_resources import list_resources
from app.services.resources.types import (
    GetResourcesRequest,
    GetResourcesResponse,
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
