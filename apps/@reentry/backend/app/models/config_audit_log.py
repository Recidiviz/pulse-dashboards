from enum import StrEnum
from typing import Optional
from uuid import UUID

import structlog
from sqlalchemy import JSON, Column, Index
from sqlmodel import Field

from .base import BaseModel

logger = structlog.get_logger(__name__)


class ConfigType(StrEnum):
    """Type of config being audited."""

    ASSESSMENT = "assessment"
    OUTPUT = "output"


class ConfigAuditAction(StrEnum):
    """Actions that can be performed on configs."""

    CREATED = "created"
    UPDATED = "updated"
    ACTIVATED = "activated"
    DEACTIVATED = "deactivated"
    IMPORTED = "imported"
    EXPORTED = "exported"


class ConfigAuditLog(BaseModel, table=True):
    """Audit log for tracking all config operations."""

    __tablename__ = "config_audit_log"
    __table_args__ = (
        Index("idx_config_audit_log_config", "config_type", "config_id"),
        Index("idx_config_audit_log_action", "action", "created_at"),
    )

    config_type: str = Field(description="Type of config: 'assessment' or 'output'")
    config_id: UUID = Field(description="ID of the config being audited")
    action: str = Field(
        description="Action performed: 'created', 'updated', 'activated', etc."
    )
    performed_by_email: str = Field(
        description="Email of the user who performed the action"
    )
    details: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Additional details about the action (source_env, import_hash, etc.)",
    )
