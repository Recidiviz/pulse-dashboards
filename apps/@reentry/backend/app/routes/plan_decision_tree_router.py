import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel

from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.plan import get_plan_by_id
from app.crud.plan_decision_tree import (
    create_plan_decision_tree,
    delete_plan_decision_tree_by_id,
    get_plan_decision_tree_by_plan_id,
)
from app.models.plan_decision_tree import PlanDecisionTree
from app.utils.decision_tree_runner import Annotation, DecisionTreeRunnerStep
from app.utils.permission_utils import check_access

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
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
) -> Page[PlanDecisionTree]:
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    check_access(
        plan.client_pseudo_id,
        pseudonymized_id,
        cpa_client_locations=auth_user_context["cpa_client_locations"],
        is_zero_caseload_user=auth_user_context["is_zero_caseload_user"],
    )
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
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    check_access(
        plan.client_pseudo_id,
        pseudonymized_id,
        cpa_client_locations=auth_user_context["cpa_client_locations"],
        is_zero_caseload_user=auth_user_context["is_zero_caseload_user"],
    )
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
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    plan = await get_plan_by_id(session, id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    check_access(
        plan.client_pseudo_id,
        pseudonymized_id,
        cpa_client_locations=auth_user_context["cpa_client_locations"],
        is_zero_caseload_user=auth_user_context["is_zero_caseload_user"],
    )
    decision_trees = await get_plan_decision_tree_by_plan_id(session, id)
    if not decision_trees:
        return DeletionResponse(status=DeletionStatus.SUCCESS)

    for decision_tree in decision_trees:
        await delete_plan_decision_tree_by_id(session, decision_tree.id)

    return DeletionResponse(status=DeletionStatus.SUCCESS)
