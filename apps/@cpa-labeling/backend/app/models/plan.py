"""Read-only models for plan data."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel


class Plan(SQLModel, table=True):
    """Read-only model for plan table."""

    __tablename__ = "plan"

    id: UUID = Field(primary_key=True)
    created_at: datetime
    updated_at: datetime
    client_pseudo_id: Optional[str] = None
    intake_id: Optional[UUID] = Field(foreign_key="intake.id")


class PlanAsset(SQLModel, table=True):
    """Read-only model for plan assets (summary.md, etc.)."""

    __tablename__ = "planasset"

    id: UUID = Field(primary_key=True)
    created_at: datetime
    updated_at: datetime
    plan_id: UUID = Field(foreign_key="plan.id")
    filename: str
    file_blob: Optional[bytes] = None


class PlanGeneration(SQLModel, table=True):
    """Read-only model for plan generations (action plans)."""

    __tablename__ = "plangeneration"

    id: UUID = Field(primary_key=True)
    created_at: datetime
    updated_at: datetime
    plan_id: UUID = Field(foreign_key="plan.id")
    markdown_result: Optional[str] = None
    finished_at: Optional[datetime] = None
    gen_type: str = "automated"
