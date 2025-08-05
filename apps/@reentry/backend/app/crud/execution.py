from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.execution import Execution


async def upsert_execution(
    session: AsyncSession,
    execution: Execution,
):
    session.add(execution)
    await session.commit()
    await session.refresh(execution)


async def update_execution(session: AsyncSession, execution: Execution, **kwargs):
    for key, value in kwargs.items():
        setattr(execution, key, value)
    await upsert_execution(session, execution)


@overload
async def get_execution_by_id(
    session: AsyncSession, execution_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[Execution]: ...


@overload
async def get_execution_by_id(
    session: AsyncSession, execution_id: UUID, *, query_only: Literal[False] = False
) -> Execution | None: ...


@statement_or_result(first_only=True)
async def get_execution_by_id(
    session: AsyncSession, execution_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[Execution] | Execution | None:
    return select(Execution).where(Execution.id == execution_id)


@overload
async def get_executions(
    session: AsyncSession, *, query_only: Literal[True]
) -> SelectOfScalar[Execution]: ...


@overload
async def get_executions(
    session: AsyncSession, *, query_only: Literal[False] = False
) -> list[Execution]: ...


@statement_or_result(result_type=list)
async def get_executions(
    session: AsyncSession, *, query_only: bool = False
) -> SelectOfScalar[Execution] | list[Execution]:
    return select(Execution)


async def delete_execution_by_id(session: AsyncSession, execution_id: UUID):
    execution = await get_execution_by_id(session, execution_id)
    if not execution:
        return False
    await session.delete(execution)
    await session.commit()
    return True
