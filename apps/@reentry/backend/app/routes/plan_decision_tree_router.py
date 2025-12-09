import uuid

from fastapi import APIRouter, Depends
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel

from app.core.db import AsyncSession, get_session
from app.crud.plan_decision_tree import (
    create_plan_decision_tree,
    delete_plan_decision_tree_by_id,
    get_plan_decision_tree_by_plan_id,
)
from app.models.plan_decision_tree import PlanDecisionTree
from app.utils.decision_tree_runner import Annotation, DecisionTreeRunnerStep

from .base import DeletionResponse, DeletionStatus, ORMResponse
from .decision_tree_router import DecisionTreeResponse
from .execution_router import ExecutionResponse

router = APIRouter()


class PlanDecisionTreeRequestCreate(BaseModel):
    decision_tree_id: uuid.UUID


class PlanDecisionTreeResponse(ORMResponse):
    status: str
    execution_id: uuid.UUID | None
    decision_tree_id: uuid.UUID
    plan_id: uuid.UUID
    decision_tree: DecisionTreeResponse | None = None
    execution: ExecutionResponse | None


class PlanDecisionTreeExtendedResponse(PlanDecisionTreeResponse):
    annotations: list[Annotation] | None
    run_statements: list[str] | None
    run_steps: list[DecisionTreeRunnerStep] | None


@router.get(
    "/plans/{id}/decisiontrees",
    response_model=Page[PlanDecisionTreeResponse],
    summary="List Decision Trees",
    description="Retrieve a paginated list of decision trees associated with the specified plan ID.",
)
async def router_list_decision_trees(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Page[PlanDecisionTree]:
    query = await get_plan_decision_tree_by_plan_id(
        session,
        id,
        query_only=True,
        with_decision_tree=True,
    )

    return await paginate(
        session,
        query,
        transformer=lambda items: [
            PlanDecisionTreeResponse.model_validate(item.model_dump(by_alias=True))
            for item in items
        ],
    )


@router.post(
    "/plans/{id}/decisiontrees",
    response_model=PlanDecisionTreeExtendedResponse,
    summary="Add Decision Tree",
    description="Add a new decision tree to the specified plan ID.",
)
async def router_add_decision_tree(
    id: uuid.UUID,
    decision_tree_data: PlanDecisionTreeRequestCreate,
    session: AsyncSession = Depends(get_session),
):
    # Create a decision tree associated with the plan ID
    plan_decision_tree = PlanDecisionTree(
        plan_id=id,
        **decision_tree_data.model_dump(exclude_unset=True),
    )
    await create_plan_decision_tree(session, plan_decision_tree)
    return plan_decision_tree


@router.delete(
    "/plans/{id}/decisiontrees",
    response_model=DeletionResponse,
    summary="Delete All Decision Trees",
    description="Delete all decision trees associated with the specified plan ID.",
)
async def router_delete_all_decision_trees(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    decision_trees = await get_plan_decision_tree_by_plan_id(session, id)
    if not decision_trees:
        return DeletionResponse(status=DeletionStatus.SUCCESS)

    for decision_tree in decision_trees:
        await delete_plan_decision_tree_by_id(session, decision_tree.id)

    return DeletionResponse(status=DeletionStatus.SUCCESS)
