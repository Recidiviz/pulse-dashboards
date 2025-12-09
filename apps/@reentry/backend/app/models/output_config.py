from enum import Enum
from typing import Optional

import structlog
from sqlalchemy import Column, Text, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field

from .base import BaseModel

logger = structlog.get_logger(__name__)


class OutputType(str, Enum):
    intake_summary = "intake_summary"
    action_plan = "action_plan"


class OutputConfig(BaseModel, table=True):
    __table_args__ = (
        UniqueConstraint("code", "version", name="unique_output_version"),
    )

    # Metadata -- for querying
    output_type: OutputType = Field(
        sa_column=Column(
            SAEnum(
                OutputType,
                name="output_type_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
        )
    )
    code: str
    version: int
    display_name: str
    description: Optional[str] = None
    # Content -- from files
    config_yaml: str = Field(sa_column=Column(Text, nullable=False))
    # Management
    is_active: bool = Field(default=True, sa_column_kwargs={"server_default": "true"})
