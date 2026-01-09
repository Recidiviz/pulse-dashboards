import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel, ConfigDict, field_validator

from app.core.db import AsyncSession, get_session
from app.crud.decision_tree import (
    add_decision_tree_revision,
    delete_decision_tree,
    get_decision_tree_by_id,
    get_decision_tree_by_name,
    get_decision_tree_revision_by_id,
    get_decision_tree_revisions,
    get_decision_trees,
    upsert_decision_tree,
)
from app.models.decision_tree import (
    DecisionTree,
    DecisionTreeRevision,
)
from app.utils.mermaid import MermaidParser

from .base import ORMResponse

router = APIRouter()


class DecisionTreeResponse(ORMResponse):
    name: str
    enabled: bool
    criterias: Optional[str] = None
    current_revision_id: uuid.UUID | None = None


class DecisionTreeRevisionResponse(ORMResponse):
    decision_tree_id: uuid.UUID
    mermaid_content: str
    notes: str


class DecisionTreeWithRevisionsResponse(DecisionTreeResponse):
    model_config = ConfigDict(from_attributes=True)
    revisions: list[DecisionTreeRevisionResponse]


class DecisionTreeRevisionCreate(BaseModel):
    mermaid_content: str
    notes: str

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


class DecisionTreeCreate(BaseModel):
    name: str
    criterias: Optional[str] = None


class DecisionTreeUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    criterias: Optional[str] = None


@router.get(
    "",
    response_model=Page[DecisionTreeResponse],
    summary="Retrieve a list of decision trees",
    description="This endpoint retrieves a paginated list of all decision trees.",
    tags=["Decision Trees"],
)
async def router_get_decision_trees_list(
    session: AsyncSession = Depends(get_session),
) -> Page[DecisionTreeResponse]:
    query = await get_decision_trees(session, query_only=True)
    return await paginate(session, query)


@router.get(
    "/{decision_tree_id}",
    response_model=DecisionTreeWithRevisionsResponse,
    summary="Retrieve a decision tree",
    description="This endpoint retrieves a decision tree by its ID, including all its revisions.",
    tags=["Decision Trees"],
)
async def router_get_decision_tree(
    decision_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> DecisionTree:
    decision_tree = await get_decision_tree_by_id(session, decision_tree_id)
    if decision_tree is None:
        raise HTTPException(status_code=404, detail="Decision tree not found")
    return decision_tree


@router.post(
    "",
    response_model=DecisionTreeWithRevisionsResponse,
    status_code=201,
    summary="Create a new decision tree",
    description="This endpoint allows the creation of a new decision tree. "
    "The decision tree must have a unique name.",
    tags=["Decision Trees"],
)
async def router_add_decision_tree(
    data: DecisionTreeCreate,
    session: AsyncSession = Depends(get_session),
):
    # for the first decision tree, we always want to also create a revision
    # to prevent having empty decision-tree
    existing_tree = await get_decision_tree_by_name(session, data.name)
    if existing_tree is not None:
        raise HTTPException(status_code=409, detail="Decision tree already exists")

    decision_tree_data = data.model_dump(exclude_unset=True)
    decision_tree = DecisionTree(**decision_tree_data)
    await upsert_decision_tree(session, decision_tree=decision_tree)

    # to get revisions, we need to issue a new search
    decision_tree = await get_decision_tree_by_id(session, decision_tree.id)
    return decision_tree


@router.patch(
    "/{decision_tree_id}",
    response_model=DecisionTreeWithRevisionsResponse,
    summary="Update a decision tree",
    description="This endpoint updates a decision tree by its ID with the given data.",
    tags=["Decision Trees"],
)
async def router_update_decision_tree(
    decision_tree_id: uuid.UUID,
    data: DecisionTreeUpdate,
    session: AsyncSession = Depends(get_session),
):
    decision_tree = await get_decision_tree_by_id(session, decision_tree_id)
    if decision_tree is None:
        raise HTTPException(status_code=404, detail="Decision tree not found")
    decision_tree_data = data.model_dump(exclude_unset=True)

    # check that we cannot enable a decision tree without any revision
    if decision_tree_data.get("enabled") and not decision_tree.current_revision_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot enable a decision tree without any revision",
        )

    for key, value in decision_tree_data.items():
        setattr(decision_tree, key, value)
    await upsert_decision_tree(session, decision_tree)
    return decision_tree


@router.delete(
    "/{decision_tree_id}",
    response_model=None,
    summary="Delete a decision tree",
    description="Deletes a decision tree by its ID.",
    tags=["Decision Trees"],
    status_code=204,
)
async def router_delete_decision_tree(
    decision_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    decision_tree = await get_decision_tree_by_id(session, decision_tree_id)
    if decision_tree is None:
        raise HTTPException(status_code=404, detail="Decision tree not found")

    await delete_decision_tree(session, decision_tree)


@router.get(
    "/{decision_tree_id}/revisions",
    response_model=Page[DecisionTreeRevision],
    summary="Get decision tree revisions",
    description="Retrieve a paginated list of revisions for a specific decision tree by its ID.",
    tags=["Decision Trees"],
)
async def router_get_decision_tree_revisions(
    decision_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    query = await get_decision_tree_revisions(
        session, decision_tree_id, query_only=True
    )
    return await paginate(session, query)


@router.get(
    "/{decision_tree_id}/revisions/{revision_id}",
    response_model=DecisionTreeRevisionResponse,
    summary="Retrieve a specific decision tree revision",
    description="This endpoint retrieves a specific revision of a decision tree by its ID and revision ID.",
    tags=["Decision Trees"],
)
async def router_get_decision_tree_revision(
    decision_tree_id: uuid.UUID,
    revision_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    revision = await get_decision_tree_revision_by_id(session, revision_id)
    if revision is None:
        raise HTTPException(status_code=404, detail="Decision tree revision not found")
    if revision.decision_tree_id != decision_tree_id:
        raise HTTPException(status_code=404, detail="Decision tree revision not found")
    return revision


@router.post(
    "/{decision_tree_id}/revisions",
    response_model=DecisionTreeRevisionResponse,
    status_code=201,
    summary="Add a new revision to a decision tree",
    description="This endpoint allows adding a new revision to an existing decision tree by its ID. "
    "The revision includes mermaid content and optional notes.",
    tags=["Decision Trees"],
)
async def router_add_decision_tree_revision(
    data: DecisionTreeRevisionCreate,
    decision_tree_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    decision_tree = await get_decision_tree_by_id(session, decision_tree_id)
    if decision_tree is None:
        raise HTTPException(status_code=404, detail="Decision tree not found")

    revision = DecisionTreeRevision(
        mermaid_content=data.mermaid_content,
        notes=data.notes,
    )
    await add_decision_tree_revision(
        session,
        decision_tree=decision_tree,
        revision=revision,
    )

    return revision
