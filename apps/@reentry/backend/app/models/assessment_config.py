from datetime import datetime
from enum import StrEnum
from typing import Optional

import structlog
from sqlalchemy import Column, Index, Text, UniqueConstraint
from sqlmodel import Field

from .base import BaseModel

logger = structlog.get_logger(__name__)


class ConfigStatus(StrEnum):
    """Status for config lifecycle management.

    DRAFT: Work in progress, editable, not in use
    ACTIVE: Currently being used by the application (only one per config code)
    INACTIVE: Previously active, now replaced or explicitly deactivated
    """

    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"


class AssessmentConfig(BaseModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "state_code", "code", "version", name="unique_assessment_version"
        ),
        Index("idx_assessment_config_state_active", "state_code", "is_active"),
        Index("idx_assessment_config_status", "status"),
    )

    # Metadata -- for querying
    state_code: str
    code: str
    version: int
    display_name: str
    description: Optional[str] = None
    # Content -- from files
    config_yaml: str = Field(sa_column=Column(Text, nullable=False))
    # Management
    is_active: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})
    # Config Management fields
    status: str = Field(
        default=ConfigStatus.DRAFT.value,
        sa_column_kwargs={"server_default": "draft"},
    )
    created_by_email: Optional[str] = Field(default=None)
    activated_at: Optional[datetime] = Field(default=None)
    activated_by_email: Optional[str] = Field(default=None)
    imported_from_env: Optional[str] = Field(default=None)
    import_hash: Optional[str] = Field(default=None)
