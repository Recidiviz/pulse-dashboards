from typing import Optional

import structlog
from sqlalchemy import Column, Index, Text, UniqueConstraint
from sqlmodel import Field

from .base import BaseModel

logger = structlog.get_logger(__name__)


class AssessmentConfig(BaseModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "state_code", "code", "version", name="unique_assessment_version"
        ),
        Index("idx_assessment_config_state_active", "state_code", "is_active"),
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
