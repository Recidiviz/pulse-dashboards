from typing import Any, Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.models import Plan


async def create_plan(session: AsyncSession, plan: Plan):
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


@overload
async def get_plan_by_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[Plan]: ...


@overload
async def get_plan_by_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[False] = False
) -> Plan | None: ...


@statement_or_result(first_only=True)
async def get_plan_by_id(
    session: AsyncSession, plan_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[Plan] | Plan | None:
    return select(Plan).where(Plan.id == plan_id)


@overload
async def get_plan_by_client_id(
    session: AsyncSession, client_id: str, *, query_only: Literal[True]
) -> SelectOfScalar[Plan]: ...


@overload
async def get_plan_by_client_id(
    session: AsyncSession, client_id: str, *, query_only: Literal[False] = False
) -> Plan | None: ...


@statement_or_result(first_only=True)
async def get_plan_by_client_id(
    session: AsyncSession, client_id: str, *, query_only: bool = False
) -> SelectOfScalar[Plan] | Plan | None:
    return select(Plan).where(Plan.client_id == client_id)


@overload
async def get_plans(
    session: AsyncSession, *, query_only: Literal[True]
) -> SelectOfScalar[Plan]: ...


@overload
async def get_plans(
    session: AsyncSession, *, query_only: Literal[False] = False
) -> list[Plan]: ...


@statement_or_result(result_type=list)
async def get_plans(
    session: AsyncSession, *, query_only: bool = False
) -> SelectOfScalar[Plan] | list[Plan]:
    return select(Plan)


async def delete_plan_by_id(session: AsyncSession, plan_id: UUID):
    plan = await get_plan_by_id(session, plan_id)
    if not plan:
        return False
    await session.delete(plan)
    await session.commit()
    return True


async def update_plan_field(
    session: AsyncSession, plan_id: UUID, field_name: str, new_value: Any
):
    plan = await get_plan_by_id(session, plan_id)
    if not plan:
        return None

    # check if the field exists on the Plan model
    if not hasattr(plan, field_name):
        raise ValueError(f"Field '{field_name}' does not exist on Plan")

    setattr(plan, field_name, new_value)
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


async def retry_plan_creation(session: AsyncSession, plan: Plan):
    """
    Retry plan creation by deleting failed execution and scheduling a new one.
    Returns the new execution.
    """
    from app.crud.execution import delete_execution_by_id

    # Delete failed plan creation execution
    if plan.create_execution_id:
        await delete_execution_by_id(session, plan.create_execution_id)

    # Reset execution references
    plan.create_execution = None
    plan.create_execution_id = None
    session.add(plan)
    await session.commit()

    # Schedule new plan creation
    return await plan.schedule_initial_creation(session)
