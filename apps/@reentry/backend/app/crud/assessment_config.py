"""CRUD operations for AssessmentConfig"""

from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.assessment_config import AssessmentConfig


@overload
async def get_assessment_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentConfig]: ...


@overload
async def get_assessment_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: Literal[False] = False
) -> AssessmentConfig | None: ...


@statement_or_result(first_only=True)
async def get_assessment_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AssessmentConfig] | AssessmentConfig | None:
    """Get a specific assessment config by ID"""
    return select(AssessmentConfig).where(AssessmentConfig.id == config_id)


@overload
async def get_active_assessment_configs_by_state(
    session: AsyncSession, state_code: str, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentConfig]: ...


@overload
async def get_active_assessment_configs_by_state(
    session: AsyncSession, state_code: str, *, query_only: Literal[False] = False
) -> list[AssessmentConfig]: ...


async def get_active_assessment_configs_by_state(
    session: AsyncSession, state_code: str, *, query_only: bool = False
) -> SelectOfScalar[AssessmentConfig] | list[AssessmentConfig]:
    """
    Get all active assessment configurations for a given state.
    Returns only configs where is_active=True.
    If multiple active configs exist with the same code, only returns the highest version.
    """
    statement = (
        select(AssessmentConfig)
        .where(AssessmentConfig.state_code == state_code)
        .where(AssessmentConfig.is_active)
        .order_by(AssessmentConfig.display_name)
    )

    if query_only:
        return statement

    # Execute query
    result = await session.exec(statement)
    configs = result.all()

    # Filter to keep only highest version per code
    # Group by code and keep only the config with max version
    code_to_config: dict[str, AssessmentConfig] = {}
    for config in configs:
        if config.code not in code_to_config:
            code_to_config[config.code] = config
        else:
            # Keep the one with higher version
            if config.version > code_to_config[config.code].version:
                code_to_config[config.code] = config

    # Return filtered list, sorted by display_name
    return sorted(code_to_config.values(), key=lambda c: c.display_name)
