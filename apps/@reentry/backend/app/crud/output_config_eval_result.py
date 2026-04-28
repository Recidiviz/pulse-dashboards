from typing import List
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.output_config_eval_result import OutputConfigEvalResult


async def create_output_config_eval_result(
    session: AsyncSession, result: OutputConfigEvalResult
) -> OutputConfigEvalResult:
    session.add(result)
    await session.commit()
    await session.refresh(result)
    return result


async def update_output_config_eval_result(
    session: AsyncSession, result: OutputConfigEvalResult, **kwargs
) -> OutputConfigEvalResult:
    for key, value in kwargs.items():
        setattr(result, key, value)
    session.add(result)
    await session.commit()
    await session.refresh(result)
    return result


@statement_or_result(first_only=True)
async def get_output_config_eval_result_by_id(
    session: AsyncSession, result_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[OutputConfigEvalResult] | OutputConfigEvalResult | None:
    return select(OutputConfigEvalResult).where(OutputConfigEvalResult.id == result_id)


async def get_eval_results_by_config_id(
    session: AsyncSession,
    config_id: UUID,
    limit: int = 10,
    eval_type: str | None = None,
) -> List[OutputConfigEvalResult]:
    query = select(OutputConfigEvalResult).where(
        OutputConfigEvalResult.output_config_id == config_id
    )
    if eval_type is not None:
        query = query.where(OutputConfigEvalResult.eval_type == eval_type)
    query = query.order_by(OutputConfigEvalResult.created_at.desc()).limit(limit)
    result = await session.exec(query)
    return list(result.all())
