from typing import Literal, overload
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.plan_decision_tree import PlanDecisionTree


async def create_plan_decision_tree(
    session: AsyncSession,
    plan_decision_tree: PlanDecisionTree,
):
    session.add(plan_decision_tree)
    await session.commit()
    await session.refresh(plan_decision_tree)
    return await get_plan_decision_tree_by_id(
        session, plan_decision_tree.id, with_decision_tree=True
    )


@overload
async def get_plan_decision_tree_by_id(
    session: AsyncSession,
    decision_tree_id: UUID,
    with_decision_tree=False,
    with_plan=False,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[PlanDecisionTree]: ...


@overload
async def get_plan_decision_tree_by_id(
    session: AsyncSession,
    decision_tree_id: UUID,
    with_decision_tree=False,
    with_plan=False,
    *,
    query_only: Literal[False] = False,
) -> PlanDecisionTree | None: ...


@statement_or_result(first_only=True)
async def get_plan_decision_tree_by_id(
    session: AsyncSession,
    decision_tree_id: UUID,
    with_decision_tree=False,
    with_plan=False,
    *,
    query_only: bool = False,
) -> SelectOfScalar[PlanDecisionTree] | PlanDecisionTree | None:
    query = select(PlanDecisionTree).where(PlanDecisionTree.id == decision_tree_id)
    if with_decision_tree:
        query = query.options(selectinload(PlanDecisionTree.decision_tree))
    if with_plan:
        query = query.options(selectinload(PlanDecisionTree.plan))
    return query


@overload
async def get_plan_decision_tree_by_plan_id(
    session: AsyncSession,
    plan_id: UUID,
    with_decision_tree=False,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[PlanDecisionTree]: ...


@overload
async def get_plan_decision_tree_by_plan_id(
    session: AsyncSession,
    plan_id: UUID,
    with_decision_tree=False,
    *,
    query_only: Literal[False] = False,
) -> list[PlanDecisionTree]: ...


@statement_or_result(result_type=list)
async def get_plan_decision_tree_by_plan_id(
    session: AsyncSession,
    plan_id: UUID,
    with_decision_tree=False,
    *,
    query_only: bool = False,
) -> SelectOfScalar[PlanDecisionTree] | list[PlanDecisionTree]:
    query = select(PlanDecisionTree).where(PlanDecisionTree.plan_id == plan_id)
    if with_decision_tree:
        query = query.options(selectinload(PlanDecisionTree.decision_tree))
    return query


async def delete_plan_decision_tree_by_id(
    session: AsyncSession, decision_tree_id: UUID
):
    decision_tree = await get_plan_decision_tree_by_id(session, decision_tree_id)
    if not decision_tree:
        return False
    await session.delete(decision_tree)
    await session.commit()
    return True
