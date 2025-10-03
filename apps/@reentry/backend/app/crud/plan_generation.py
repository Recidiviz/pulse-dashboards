from typing import Literal, overload
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.models import PlanGeneration


async def create_plan_generation(
    session: AsyncSession, plan_generation: PlanGeneration
):
    session.add(plan_generation)
    await session.commit()
    await session.refresh(plan_generation)
    return plan_generation


@overload
async def get_gen_by_id(
    session: AsyncSession,
    gen_id: UUID,
    with_plan: bool = False,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[PlanGeneration]: ...


@overload
async def get_gen_by_id(
    session: AsyncSession,
    gen_id: UUID,
    with_plan: bool = False,
    *,
    query_only: Literal[False] = False,
) -> PlanGeneration | None: ...


@statement_or_result(first_only=True)
async def get_gen_by_id(
    session: AsyncSession,
    gen_id: UUID,
    with_plan: bool = False,
    *,
    query_only: bool = False,
) -> SelectOfScalar[PlanGeneration] | PlanGeneration | None:
    query = select(PlanGeneration).where(PlanGeneration.id == gen_id)
    if with_plan:
        query = query.options(selectinload(PlanGeneration.plan))
    return query


@overload
async def get_gen_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[PlanGeneration]: ...


@overload
async def get_gen_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[False] = False
) -> list[PlanGeneration]: ...


@statement_or_result(result_type=list)
async def get_gen_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[PlanGeneration] | list[PlanGeneration]:
    return select(PlanGeneration).where(PlanGeneration.plan_id == plan_id)


async def get_gen_by_plan_id_with_executions(
    session: AsyncSession, plan_id: UUID
) -> list[PlanGeneration]:
    """Get all generations for a plan with their executions eagerly loaded."""
    from app.models.models import Execution

    stmt = (
        select(PlanGeneration, Execution)
        .where(PlanGeneration.plan_id == plan_id)
        .outerjoin(Execution, PlanGeneration.execution_id == Execution.id)
    )
    result = await session.exec(stmt)
    rows = result.all()

    # Attach executions to generations
    generations = []
    for gen, execution in rows:
        gen.execution = execution
        generations.append(gen)

    return generations


async def update_plan_generation(session: AsyncSession, gen: PlanGeneration):
    session.add(gen)
    await session.commit()
    await session.refresh(gen)
