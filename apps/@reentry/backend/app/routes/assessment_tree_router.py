import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel, field_validator

from app.core.db import AsyncSession, get_session
from app.crud.assessment_tree import (
    add_assessment_tree_revision,
    delete_assessment_tree,
    get_assessment_tree_by_id,
    get_assessment_tree_by_name,
    get_assessment_tree_revision_by_id,
    get_assessment_tree_revisions,
    get_assessment_trees,
    upsert_assessment_tree,
)
from app.models.assessment_tree import (
    AssessmentTree,
    AssessmentTreeRevision,
    InputType,
)
from app.utils.mermaid import MermaidParser

from .base import ORMResponse

router = APIRouter()


class AssessmentTreeResponse(ORMResponse):
    name: str
    enabled: bool
    current_revision_id: uuid.UUID | None = None


class AssessmentTreeRevisionResponse(ORMResponse):
    assessment_tree_id: uuid.UUID
    mermaid_content: str
    additional_structured_data: Optional[dict] = None
    input_data: List[InputType]


class AssessmentTreeWithRevisionsResponse(AssessmentTreeResponse):
    revisions: list[AssessmentTreeRevisionResponse]


class AssessmentTreeRevisionCreate(BaseModel):
    mermaid_content: str
    additional_structured_data: Optional[dict] = None
    input_data: Optional[List[InputType]] = None

    @field_validator("mermaid_content")
    @classmethod
    def mermaid_content_valid_graph(cls, v: str) -> str:
        try:
            graph = MermaidParser.parse(v)
        except Exception as e:
            raise ValueError(f"is not a valid mermaid graph ({e})")

        try:
            if not graph.get_start_node_key():
                raise Exception("No start node found")
        except Exception as e:
            raise ValueError(
                f"must have one start node (with text starting with Start:) ({e})"
            )

        try:
            if not graph.get_end_node_keys():
                raise Exception("No end nodes found")
        except Exception as e:
            raise ValueError(
                f"must have at least 1 end node (with text starting with End:) ({e})"
            )

        return v


class AssessmentTreeCreate(BaseModel):
    name: str


class AssessmentTreeUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None


@router.get(
    "",
    response_model=Page[AssessmentTreeResponse],
    summary="Retrieve a list of assessment trees",
    description="This endpoint retrieves a paginated list of all assessment trees.",
    tags=["Risk scoring Trees"],
)
async def router_get_assessment_trees_list(
    session: AsyncSession = Depends(get_session),
) -> Page[AssessmentTreeResponse]:
    query = await get_assessment_trees(session, query_only=True)
    return await paginate(session, query)


@router.get(
    "/{assessment_tree_id}",
    response_model=AssessmentTreeWithRevisionsResponse,
    summary="Retrieve an assessment tree",
    description="This endpoint retrieves an assessment tree by its ID, including all its revisions.",
    tags=["Risk scoring Trees"],
)
async def router_get_assessment_tree(
    assessment_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> AssessmentTree:
    assessment_tree = await get_assessment_tree_by_id(session, assessment_tree_id)
    if assessment_tree is None:
        raise HTTPException(status_code=404, detail="Assessment tree not found")
    return assessment_tree


@router.post(
    "",
    response_model=AssessmentTreeWithRevisionsResponse,
    status_code=201,
    summary="Create a new assessment tree",
    description="This endpoint allows the creation of a new assessment tree. "
    "The assessment tree must have a unique name.",
    tags=["Risk scoring Trees"],
)
async def router_add_assessment_tree(
    data: AssessmentTreeCreate,
    session: AsyncSession = Depends(get_session),
):
    existing_tree = await get_assessment_tree_by_name(session, data.name)
    if existing_tree is not None:
        raise HTTPException(status_code=409, detail="Assessment tree already exists")

    assessment_tree_data = data.model_dump(exclude_unset=True)
    assessment_tree = AssessmentTree(**assessment_tree_data)
    await upsert_assessment_tree(session, assessment_tree=assessment_tree)

    # to get revisions, we need to issue a new search
    assessment_tree = await get_assessment_tree_by_id(session, assessment_tree.id)
    return assessment_tree


@router.patch(
    "/{assessment_tree_id}",
    response_model=AssessmentTreeWithRevisionsResponse,
    summary="Update an assessment tree",
    description="This endpoint updates an assessment tree by its ID with the given data.",
    tags=["Risk scoring Trees"],
)
async def router_update_assessment_tree(
    assessment_tree_id: uuid.UUID,
    data: AssessmentTreeUpdate,
    session: AsyncSession = Depends(get_session),
):
    assessment_tree = await get_assessment_tree_by_id(session, assessment_tree_id)
    if assessment_tree is None:
        raise HTTPException(status_code=404, detail="Assessment tree not found")
    assessment_tree_data = data.model_dump(exclude_unset=True)

    # check that we cannot enable an assessment tree without any revision
    if assessment_tree_data.get("enabled") and not assessment_tree.current_revision_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot enable an assessment tree without any revision",
        )

    for key, value in assessment_tree_data.items():
        setattr(assessment_tree, key, value)
    await upsert_assessment_tree(session, assessment_tree)
    return assessment_tree


@router.delete(
    "/{assessment_tree_id}",
    response_model=None,
    summary="Delete an assessment tree",
    description="Deletes an assessment tree by its ID.",
    tags=["Risk scoring Trees"],
    status_code=204,
)
async def router_delete_assessment_tree(
    assessment_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    assessment_tree = await get_assessment_tree_by_id(session, assessment_tree_id)
    if assessment_tree is None:
        raise HTTPException(status_code=404, detail="Assessment tree not found")

    await delete_assessment_tree(session, assessment_tree)


@router.get(
    "/{assessment_tree_id}/revisions",
    response_model=Page[AssessmentTreeRevision],
    summary="Get assessment tree revisions",
    description="Retrieve a paginated list of revisions for a specific assessment tree by its ID.",
    tags=["Risk scoring Trees"],
)
async def router_get_assessment_tree_revisions(
    assessment_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    query = await get_assessment_tree_revisions(
        session, assessment_tree_id, query_only=True
    )
    return await paginate(session, query)


@router.get(
    "/{assessment_tree_id}/revisions/{revision_id}",
    response_model=AssessmentTreeRevisionResponse,
    summary="Retrieve a specific assessment tree revision",
    description="This endpoint retrieves a specific revision of an assessment tree by its ID and revision ID.",
    tags=["Risk scoring Trees"],
)
async def router_get_assessment_tree_revision(
    assessment_tree_id: uuid.UUID,
    revision_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    revision = await get_assessment_tree_revision_by_id(session, revision_id)
    if revision is None:
        raise HTTPException(
            status_code=404, detail="Assessment tree revision not found"
        )
    if revision.assessment_tree_id != assessment_tree_id:
        raise HTTPException(
            status_code=404, detail="Assessment tree revision not found"
        )
    return revision


@router.post(
    "/{assessment_tree_id}/revisions",
    response_model=AssessmentTreeRevisionResponse,
    status_code=201,
    summary="Add a new revision to an assessment tree",
    description="This endpoint allows adding a new revision to an existing assessment tree by its ID. "
    "The revision includes mermaid content and optional data.",
    tags=["Risk scoring Trees"],
)
async def router_add_assessment_tree_revision(
    data: AssessmentTreeRevisionCreate,
    assessment_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    assessment_tree = await get_assessment_tree_by_id(session, assessment_tree_id)
    if assessment_tree is None:
        raise HTTPException(status_code=404, detail="Assessment tree not found")

    revision_data = data.model_dump(exclude_unset=True)
    revision = AssessmentTreeRevision(**revision_data)

    await add_assessment_tree_revision(
        session,
        assessment_tree=assessment_tree,
        revision=revision,
    )

    return revision
