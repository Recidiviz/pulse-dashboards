"""CRUD operations for Config Management."""

from datetime import datetime
from typing import Literal, Optional, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.models.config_audit_log import ConfigAuditLog
from app.models.output_config import OutputConfig, OutputType
from app.utils.string_utils import normalize_state_code_format

# ============================================================================
# Assessment Config CRUD
# ============================================================================


async def create_assessment_config(
    session: AsyncSession,
    config: AssessmentConfig,
) -> AssessmentConfig:
    """Create a new assessment config."""
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


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
    """Get an assessment config by ID."""
    return select(AssessmentConfig).where(AssessmentConfig.id == config_id)


@overload
async def get_assessment_configs(
    session: AsyncSession,
    *,
    state_code: Optional[str] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: Literal[True],
) -> SelectOfScalar[AssessmentConfig]: ...


@overload
async def get_assessment_configs(
    session: AsyncSession,
    *,
    state_code: Optional[str] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: Literal[False] = False,
) -> list[AssessmentConfig]: ...


@statement_or_result(result_type=list)
async def get_assessment_configs(
    session: AsyncSession,
    *,
    state_code: Optional[str] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: bool = False,
) -> SelectOfScalar[AssessmentConfig] | list[AssessmentConfig]:
    """Get assessment configs with optional filters."""
    query = select(AssessmentConfig)

    if state_code:
        query = query.where(AssessmentConfig.state_code == state_code)
    if code:
        query = query.where(AssessmentConfig.code == code)
    if status:
        query = query.where(AssessmentConfig.status.in_(status))

    return query.order_by(
        AssessmentConfig.state_code,
        AssessmentConfig.code,
        AssessmentConfig.version.desc(),
    )


async def get_active_assessment_config(
    session: AsyncSession,
    state_code: str,
    code: str,
) -> AssessmentConfig | None:
    """Get the active assessment config for a given state_code and code.

    Orders by version descending so that if multiple configs are
    accidentally active for the same state/code, the latest version is returned.
    """
    query = (
        select(AssessmentConfig)
        .where(
            AssessmentConfig.state_code == normalize_state_code_format(state_code),
            AssessmentConfig.code == code,
            AssessmentConfig.is_active == True,  # noqa: E712
        )
        .order_by(AssessmentConfig.version.desc())
    )
    result = await session.exec(query)
    return result.first()


async def get_latest_assessment_config_version(
    session: AsyncSession,
    state_code: str,
    code: str,
) -> int:
    """Get the latest version number for a config family."""
    query = (
        select(AssessmentConfig.version)
        .where(
            AssessmentConfig.state_code == normalize_state_code_format(state_code),
            AssessmentConfig.code == code,
        )
        .order_by(AssessmentConfig.version.desc())
        .limit(1)
    )
    result = await session.exec(query)
    version = result.first()
    return version if version is not None else -1


async def get_assessment_config_by_version(
    session: AsyncSession,
    state_code: str,
    code: str,
    version: int,
) -> AssessmentConfig | None:
    """Get a specific version of an assessment config."""
    query = select(AssessmentConfig).where(
        AssessmentConfig.state_code == normalize_state_code_format(state_code),
        AssessmentConfig.code == code,
        AssessmentConfig.version == version,
    )
    result = await session.exec(query)
    return result.first()


async def update_assessment_config(
    session: AsyncSession,
    config: AssessmentConfig,
) -> AssessmentConfig:
    """Update an existing assessment config."""
    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


async def delete_assessment_config(
    session: AsyncSession,
    config_id: UUID,
) -> bool:
    """Delete an assessment config (only drafts)."""
    config = await get_assessment_config_by_id(session, config_id)
    if not config:
        return False
    if config.status != ConfigStatus.DRAFT.value:
        raise ValueError("Only draft configs can be deleted")

    await session.delete(config)
    await session.commit()
    return True


# ============================================================================
# Output Config CRUD
# ============================================================================


async def create_output_config(
    session: AsyncSession,
    config: OutputConfig,
) -> OutputConfig:
    """Create a new output config."""
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


@overload
async def get_output_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[OutputConfig]: ...


@overload
async def get_output_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: Literal[False] = False
) -> OutputConfig | None: ...


@statement_or_result(first_only=True)
async def get_output_config_by_id(
    session: AsyncSession, config_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[OutputConfig] | OutputConfig | None:
    """Get an output config by ID."""
    return select(OutputConfig).where(OutputConfig.id == config_id)


@overload
async def get_output_configs(
    session: AsyncSession,
    *,
    output_type: Optional[OutputType] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: Literal[True],
) -> SelectOfScalar[OutputConfig]: ...


@overload
async def get_output_configs(
    session: AsyncSession,
    *,
    output_type: Optional[OutputType] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: Literal[False] = False,
) -> list[OutputConfig]: ...


@statement_or_result(result_type=list)
async def get_output_configs(
    session: AsyncSession,
    *,
    output_type: Optional[OutputType] = None,
    code: Optional[str] = None,
    status: Optional[list[str]] = None,
    query_only: bool = False,
) -> SelectOfScalar[OutputConfig] | list[OutputConfig]:
    """Get output configs with optional filters."""
    query = select(OutputConfig)

    if output_type:
        query = query.where(OutputConfig.output_type == output_type)
    if code:
        query = query.where(OutputConfig.code == code)
    if status:
        query = query.where(OutputConfig.status.in_(status))

    return query.order_by(
        OutputConfig.output_type,
        OutputConfig.code,
        OutputConfig.version.desc(),
    )


async def get_active_output_config(
    session: AsyncSession,
    code: str,
) -> OutputConfig | None:
    """Get the active output config for a given code.

    Orders by version descending so that if multiple configs are
    accidentally active for the same code, the latest version is returned.
    """
    query = (
        select(OutputConfig)
        .where(
            OutputConfig.code == code,
            OutputConfig.is_active == True,  # noqa: E712
        )
        .order_by(OutputConfig.version.desc())
    )
    result = await session.exec(query)
    return result.first()


async def get_latest_output_config_version(
    session: AsyncSession,
    code: str,
) -> int:
    """Get the latest version number for an output config family."""
    query = (
        select(OutputConfig.version)
        .where(OutputConfig.code == code)
        .order_by(OutputConfig.version.desc())
        .limit(1)
    )
    result = await session.exec(query)
    version = result.first()
    return version if version is not None else -1


async def get_output_config_by_version(
    session: AsyncSession,
    code: str,
    version: int,
) -> OutputConfig | None:
    """Get a specific version of an output config."""
    query = select(OutputConfig).where(
        OutputConfig.code == code,
        OutputConfig.version == version,
    )
    result = await session.exec(query)
    return result.first()


async def update_output_config(
    session: AsyncSession,
    config: OutputConfig,
) -> OutputConfig:
    """Update an existing output config."""
    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


async def delete_output_config(
    session: AsyncSession,
    config_id: UUID,
) -> bool:
    """Delete an output config (only drafts)."""
    config = await get_output_config_by_id(session, config_id)
    if not config:
        return False
    if config.status != ConfigStatus.DRAFT.value:
        raise ValueError("Only draft configs can be deleted")

    await session.delete(config)
    await session.commit()
    return True


# ============================================================================
# Audit Log CRUD
# ============================================================================


async def create_audit_log(
    session: AsyncSession,
    audit_log: ConfigAuditLog,
) -> ConfigAuditLog:
    """Create a new audit log entry."""
    session.add(audit_log)
    await session.commit()
    await session.refresh(audit_log)
    return audit_log


@overload
async def get_audit_logs(
    session: AsyncSession,
    *,
    config_type: Optional[str] = None,
    config_id: Optional[UUID] = None,
    action: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    query_only: Literal[True],
) -> SelectOfScalar[ConfigAuditLog]: ...


@overload
async def get_audit_logs(
    session: AsyncSession,
    *,
    config_type: Optional[str] = None,
    config_id: Optional[UUID] = None,
    action: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    query_only: Literal[False] = False,
) -> list[ConfigAuditLog]: ...


@statement_or_result(result_type=list)
async def get_audit_logs(
    session: AsyncSession,
    *,
    config_type: Optional[str] = None,
    config_id: Optional[UUID] = None,
    action: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    query_only: bool = False,
) -> SelectOfScalar[ConfigAuditLog] | list[ConfigAuditLog]:
    """Get audit logs with optional filters."""
    query = select(ConfigAuditLog)

    if config_type:
        query = query.where(ConfigAuditLog.config_type == config_type)
    if config_id:
        query = query.where(ConfigAuditLog.config_id == config_id)
    if action:
        query = query.where(ConfigAuditLog.action == action)
    if from_date:
        query = query.where(ConfigAuditLog.created_at >= from_date)
    if to_date:
        query = query.where(ConfigAuditLog.created_at <= to_date)

    return query.order_by(ConfigAuditLog.created_at.desc())
