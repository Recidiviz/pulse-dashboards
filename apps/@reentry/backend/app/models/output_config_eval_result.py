from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Column, Index
from sqlmodel import JSON, Field

from .base import BaseModel


class OutputConfigEvalResult(BaseModel, table=True):
    __tablename__ = "output_config_eval_result"
    __table_args__ = (
        Index("ix_output_config_eval_result_output_config_id", "output_config_id"),
    )

    output_config_id: UUID
    eval_type: str = Field(default="intake_summary")
    metrics: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    execution_id: Optional[UUID] = Field(default=None, foreign_key="execution.id")
    created_by_email: Optional[str] = None
    ran_at: Optional[datetime] = None
