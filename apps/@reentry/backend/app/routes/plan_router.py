import copy
import uuid
from datetime import datetime
from io import BytesIO
from typing import Optional

import orjson
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel, computed_field

from app.auth.auth_core import get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.intake import update_client_address
from app.crud.plan import (
    create_plan,
    delete_plan_by_id,
    get_plan_by_client_id,
    get_plan_by_id,
    get_plans,
    update_plan_field,
)
from app.crud.plan_asset import (
    create_plan_asset,
    delete_asset_by_id,
    get_asset_by_filename,
    get_asset_by_id,
    get_assets_by_plan_id,
)
from app.crud.plan_generation import (
    create_plan_generation,
    get_gen_by_id,
    get_gen_by_plan_id,
)
from app.models.models import (
    GenerationType,
    Plan,
    PlanAsset,
    PlanGeneration,
    PlanGenerationStatus,
)
from app.routes.base import (
    DeletionResponse,
    DeletionStatus,
    ORMResponse,
)
from app.routes.shared_models import AddressSubmission, ClientRecordResponse
from app.routes.shared_models import PlanResponse as BasePlanResponse
from app.services.client_data.queries import get_client_data, get_client_data_unsafe
from app.services.resources import (
    GetPlanResourcesRequest,
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceCategory,
    ResourceSubcategory,
    list_resources,
)

from ..utils.PrometheusBackgroundThreadManager import (
    llm_plan_creation_total_counter,
    llm_regenerations_total_counter,
)
from .execution_router import ExecutionResponse

router = APIRouter()


class ClientAddressUpdate(BaseModel):
    home: str


class ClientInfoResponse(BaseModel):
    home: Optional[str] = None
    work: Optional[str] = None
    school: Optional[str] = None
    probation_office: Optional[str] = None
    can_drive: Optional[bool] = None
    can_walk: Optional[bool] = None
    can_bike: Optional[bool] = None
    transit_pass: Optional[bool] = None


class PlanRequestCreate(BaseModel):
    client_id: str
    no_initial_generation: Optional[bool] = False


# Using shared model as base class


class PlanResponse(BasePlanResponse, ORMResponse):
    @computed_field()
    def client_record(self) -> ClientRecordResponse | None:
        """
        Gets the client record data for this plan.
        Renamed from 'oms' to better reflect its content and source.
        """
        record = get_client_data_unsafe(external_client_id=self.client_id)
        if record:
            return ClientRecordResponse.model_validate(record.model_dump())


class PlanResponseCreate(PlanResponse):
    pass


class PlanGenerationRequestCreate(BaseModel):
    prompt: Optional[str] = None
    resource_to_remove_id: Optional[str] = None
    resource_to_add_content: Optional[
        dict[str, str | None | int | list[str] | bool | float]
    ] = None


class PlanGenerationEditRequest(BaseModel):
    markdown: str


class PlanGenerationResponse(ORMResponse):
    plan_id: uuid.UUID
    status: str
    prompt: Optional[str] = None
    finished_at: Optional[datetime] = None
    execution_id: uuid.UUID | None = None
    execution: ExecutionResponse | None = None


class PlanGenerationResponseCreate(PlanGenerationResponse):
    pass


class PlanGenerationResponseGet(PlanGenerationResponse):
    markdown_result: Optional[str] = None
    execution: ExecutionResponse | None = None


class PlanResponseGet(PlanResponse):
    latest_generation: PlanGenerationResponseGet | None


class PlanAssetResponse(ORMResponse):
    plan_id: uuid.UUID
    filename: Optional[str] = None
    mimetype: Optional[str] = None
    data: Optional[bytes] = None


#
# Plan management
@router.get(
    "/plans",
    response_model=Page[PlanResponse],
    summary="List Plans",
    description="Retrieve a paginated list of plans.",
)
async def router_list_plans(
    session: AsyncSession = Depends(get_session),
):
    query = await get_plans(session, query_only=True)
    return await paginate(session, query)


@router.post(
    "/plans",
    response_model=PlanResponseCreate,
    summary="Create Plan",
    description="Create a new plan with the provided client ID.",
)
async def router_create_plan(
    request: PlanRequestCreate,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
):
    # increment the total call counter
    llm_plan_creation_total_counter.inc()

    record = get_client_data(
        external_client_id=request.client_id, pseudonymized_staff_id=pseudonymized_id
    )
    if not record:
        raise HTTPException(status_code=404, detail="Client not found")

    # if a plan already exists for the client, return it
    plan_obj = await get_plan_by_client_id(session, request.client_id)
    if plan_obj:
        return plan_obj.model_dump(by_alias=True)

    # Create plan with only client_id which will be used for client data retrieval
    plan_obj = Plan(
        client_id=request.client_id,
    )
    plan = await create_plan(session, plan_obj)
    if not request.no_initial_generation:
        await plan.schedule_initial_creation(session)
    return plan


@router.get(
    "/plans/by_client/{client_id}",
    response_model=PlanResponseGet,
    summary="Get Plan by Client ID",
    description=(
        "Retrieve a specific plan by its client ID, including the latest "
        "completed generation result if available."
    ),
)
async def router_get_plan_by_client_id(
    client_id: str,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_client_id(session, client_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    gen = await plan.get_latest_generation(session)
    latest_generation = None
    if gen:
        latest_generation = gen.model_dump(by_alias=True)
        if gen.execution:
            latest_generation["execution"] = gen.execution.model_dump(by_alias=True)
    return PlanResponseGet.model_validate(
        {
            "latest_generation": latest_generation,
            **plan.model_dump(),
        }
    )


@router.get(
    "/plans/{id}",
    response_model=PlanResponseGet,
    summary="Get Plan",
    description=(
        "Retrieve a specific plan by its ID, including the latest "
        "completed generation result if available."
    ),
)
async def router_get_plan(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    gens = await get_gen_by_plan_id(session, id)
    gens = [gen for gen in gens if gen.status == PlanGenerationStatus.COMPLETED]
    gens = sorted(gens, key=lambda x: x.finished_at, reverse=True)
    gen = gens[0] if gens else None
    latest_generation = None
    if gen:
        latest_generation = gen.model_dump(by_alias=True)
        if gen.execution:
            latest_generation["execution"] = gen.execution.model_dump(by_alias=True)
    return PlanResponseGet.model_validate(
        {
            "latest_generation": latest_generation,
            **plan.model_dump(),
        }
    )


@router.delete(
    "/plans/{id}",
    response_model=DeletionResponse,
    summary="Delete Plan",
    description=(
        "Delete a specific plan by its ID, along with all associated "
        "generations and assets."
    ),
)
async def router_delete_plan(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    was_removed = await delete_plan_by_id(session, id)
    status = DeletionStatus.SUCCESS if was_removed else DeletionStatus.FAILED
    return DeletionResponse(status=status)


#
# Generation management
#


@router.post(
    "/plans/{id}/generate",
    response_model=PlanGenerationResponseCreate,
    summary="Generate Plan",
    description=(
        "Initiate the generation of a new plan for the specified plan ID. "
        "The generation process will be handled in the background."
    ),
)
async def router_generate_plan(
    id: uuid.UUID,
    request: PlanGenerationRequestCreate,
    session: AsyncSession = Depends(get_session),
):
    if request.prompt and (
        request.resource_to_add_content or request.resource_to_remove_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Prompt and resource_to_add_content/resource_to_remove_id are mutually exclusive",
        )

    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    # if a regeneration is requested, check if the action plan was edited manually
    if request.prompt and plan.edited_manually:
        raise HTTPException(
            status_code=400,
            detail="Action plan was edited manually, cannot regenerate",
        )

    # increment the total call counter
    llm_regenerations_total_counter.inc()

    plan_gen = PlanGeneration(
        plan_id=id,
        prompt=request.prompt,
        resource_to_add_content=request.resource_to_add_content,
        resource_to_remove_id=request.resource_to_remove_id,
    )
    gen = await create_plan_generation(session, plan_gen)
    await gen.schedule_execution(session)
    return gen


@router.post(
    "/plans/{id}/edit",
    response_model=PlanGenerationResponseGet,
    summary="Generate the plan manually",
    description=(
        "Create a new generation for the specified plan ID when the markdown is edited manually."
    ),
)
async def router_generate_plan_manually(
    id: uuid.UUID,
    request: PlanGenerationEditRequest,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    # TODO:it could change with resources change refactoing,
    # for now copying the latest get_data_json to not break if a change resource is needed
    latest_generation = await plan.get_latest_generation(session)
    gen_data_json = latest_generation.gen_data_json

    plan_gen = PlanGeneration(
        plan_id=id,
        markdown_result=request.markdown,
        finished_at=datetime.utcnow(),
        gen_type=GenerationType.MANUAL,
        gen_data_json=gen_data_json,
    )
    gen = await create_plan_generation(session, plan_gen)

    # update plan generated manually field
    await update_plan_field(
        session=session,
        plan_id=id,
        field_name="edited_manually",
        new_value=True,
    )

    return gen


@router.get(
    "/plans/{id}/gens/{gen_id}",
    response_model=PlanGenerationResponseGet,
    summary="Get Generation",
    description=("Retrieve a specific generation by its ID for the specified plan ID."),
)
async def router_get_generation(
    gen_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    gen = await get_gen_by_id(session, gen_id)
    if gen is None:
        raise HTTPException(status_code=404, detail="Generation not found")
    return gen


#
# Assets management
#


@router.get(
    "/plans/{id}/assets",
    response_model=Page[PlanAssetResponse],
    summary="List Assets",
    description=(
        "Retrieve a paginated list of assets associated with the specified plan ID."
    ),
)
async def router_list_assets(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Page[PlanAssetResponse]:
    query = await get_assets_by_plan_id(session, id, query_only=True)
    return await paginate(session, query)


@router.post(
    "/plans/{id}/assets/upload",
    response_model=PlanAssetResponse,
    summary="Upload Asset",
    description=(
        "Upload a new asset for the specified plan ID. The file is read and "
        "stored as a blob in the database."
    ),
)
async def router_upload_asset(
    id: uuid.UUID,
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
):
    asset = PlanAsset(
        plan_id=id,
        filename=file.filename,
        mimetype=file.content_type,
        file_blob=file.file.read(),
    )
    plan_asset = await create_plan_asset(session, asset)
    return plan_asset


@router.get(
    "/plans/{id}/assets/by_filename/{filename}",
    response_model=PlanAssetResponse,
    summary="Get Asset",
    description=("Retrieve a specific asset by its name for the specified plan ID."),
)
async def router_get_asset_by_filename(
    id: uuid.UUID,
    filename: str,
    session: AsyncSession = Depends(get_session),
    include_data: Optional[bool] = False,
):
    asset = await get_asset_by_filename(session, id, filename)
    if not asset or asset.plan_id != id:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset_response = asset.model_dump()
    if include_data:
        asset_response["data"] = asset.file_blob

    return PlanAssetResponse(**asset_response)


@router.get(
    "/plans/{id}/assets/{asset_id}",
    response_model=PlanAssetResponse,
    summary="Get Asset",
    description=("Retrieve a specific asset by its ID for the specified plan ID."),
)
async def router_get_asset(
    id: uuid.UUID,
    asset_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    asset = await get_asset_by_id(session, asset_id)
    if not asset or asset.plan_id != id:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get(
    "/plans/{id}/assets/{asset_id}/download",
    summary="Download Asset",
    description=(
        "Download a specific asset by its ID for the specified plan ID. "
        "The file is streamed as a response."
    ),
)
async def router_download_asset(
    id: uuid.UUID,
    asset_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    asset = await get_asset_by_id(session, asset_id)
    if not asset or asset.plan_id != id:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not asset.file_blob:
        raise HTTPException(status_code=500, detail="Asset is empty")
    return StreamingResponse(
        content=BytesIO(asset.file_blob),
        media_type=asset.mimetype,
        headers={"Content-Disposition": f"attachment; filename={asset.filename}"},
    )


@router.get(
    "/plans/{id}/resources",
    response_model=list[Resource],
    summary="Get plan resources",
    description="Get resources currently associated with this plan",
)
async def get_plan_resources(
    id: uuid.UUID,
    filter_category: Optional[ResourceCategory] = None,
    filter_subcategory: Optional[ResourceSubcategory] = None,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    gen = await plan.get_latest_generation(session)
    if gen is None or not gen.gen_data_json:
        return []

    try:
        plan_data = orjson.loads(gen.gen_data_json)
        resources = plan_data.get("suggested_resources", [])

        # Filter resources by category and subcategory if specified
        if filter_category:
            resources = [
                r
                for r in resources
                if r["category"].casefold() == filter_category.casefold()
            ]
        if filter_subcategory:
            resources = [
                r
                for r in resources
                if r.get("subcategory", "").casefold() == filter_subcategory.casefold()
            ]

        return resources
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error parsing plan data: {str(e)}"
        )


@router.post(
    "/plans/{id}/search-resources",
    response_model=GetResourcesResponse,
    summary="Search for resources using client info",
    description="Search for resources based on the client's information from their plan generation data",
)
async def search_resources(
    id: uuid.UUID,
    request: GetPlanResourcesRequest,
    session: AsyncSession = Depends(get_session),
):
    # Get the plan
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    try:
        client_info = plan.client_extracted_info
        # Create the resources request with client info
        resource_request = GetResourcesRequest(
            category=request.category,
            subcategory=request.subcategory,
            limit=10,
            exclude_names=request.exclude,
            home=client_info.get("home"),
            work=client_info.get("work"),
            school=client_info.get("school"),
            probation_office=client_info.get("probation_office"),
            can_drive=client_info.get("has_car", False),
            can_walk=client_info.get("can_walk", True),
            can_bike=client_info.get("can_bike", False),
            transit_pass=client_info.get("transit_pass", False),
        )

        # Get resources using list_resources function
        return await list_resources(resource_request)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing plan data: {str(e)}"
        )


@router.get(
    "/plans/{id}/suggested-resources",
    response_model=list[Resource],
    summary="Get suggested resources",
    description="Get resources that were stored during plan generation",
)
async def get_suggested_resources(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    gen = await plan.get_latest_generation(session)
    if gen is None or not gen.gen_data_json:
        return []

    try:
        plan_data = orjson.loads(gen.gen_data_json)
        resources = plan_data.get("suggested_resources", [])
        return resources
    except Exception:
        raise HTTPException(status_code=500, detail="Error parsing plan data")


@router.delete(
    "/plans/{id}/assets/{asset_id}",
    response_model=DeletionResponse,
    summary="Delete Asset",
    description=("Delete a specific asset by its ID for the specified plan ID."),
)
async def router_delete_asset(
    id: uuid.UUID,
    asset_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    asset = await get_asset_by_id(session, asset_id)
    if not asset or asset.plan_id != id:
        raise HTTPException(status_code=404, detail="Asset not found")
    was_removed = await delete_asset_by_id(session, asset_id)
    status = DeletionStatus.SUCCESS if was_removed else DeletionStatus.FAILED
    return DeletionResponse(status=status)


@router.get(
    "/plans/{id}/client-info",
    response_model=ClientInfoResponse,
    summary="Get Client Info",
    description="Get the latest client's extracted information including addresses and transportation options.",
)
async def get_client_info(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    client_info = plan.client_extracted_info or {}
    return ClientInfoResponse(**client_info)


@router.patch(
    "/plans/{id}/client-info/address",
    response_model=PlanGenerationResponseCreate,
    summary="Update Client Home Address",
    description=(
        "Update the client's home address in their plan. This is for admin use "
        "to update the address used for resource recommendations. It will trigger a new generation."
    ),
)
async def update_client_info_address(
    id: uuid.UUID,
    address_data: AddressSubmission,
    session: AsyncSession = Depends(get_session),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    # update address both in the plan extracted information AND in the intake.
    # the intake is the source of thruth, but there is no need to call client data extraction again
    await update_client_address(
        session, client_id=plan.client_id, address_data=address_data
    )

    # XXX Why deepcopy is necessary:
    # When you modify a field within client_extracted_info, SQLAlchemy does not
    # automatically detect the change. This is true even if you use setattr,
    # because the id of client_extracted_info remains unchanged. Consequently,
    # the modification will not be committed, and the refresh operation would
    # revert client_extracted_info to its original state.
    client_info = copy.deepcopy(plan.client_extracted_info) or {}
    client_info["home"] = address_data.as_combined_string()
    updated_plan = await update_plan_field(
        session=session,
        plan_id=id,
        field_name="client_extracted_info",
        new_value=client_info,
    )

    if updated_plan is None:
        raise HTTPException(status_code=500, detail="Failed to update plan")

    llm_regenerations_total_counter.inc()
    plan_gen = PlanGeneration(
        plan_id=id,
        force_generation=True,
    )
    gen = await create_plan_generation(session, plan_gen)
    await gen.schedule_execution(session)
    return gen
