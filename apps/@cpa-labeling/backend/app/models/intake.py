"""Read-only models for intake data."""

from datetime import datetime
from enum import StrEnum
from typing import Optional
from uuid import UUID

from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel

class IntakeStatus(StrEnum):
    """Status for intake assessment process"""

    CREATED = "created"
    IN_PROGRESS = "in_progress"
    ERROR = "error"
    COMPLETED = "completed"
    PROCESSING = "processing"


class IntakeType(StrEnum):
    """Type of intake assessment."""

    TRANSCRIPTION = "transcription"
    CONVERSATION = "conversation"
    EXTERNAL = "external"


class Intake(SQLModel, table=True):
    """Read-only model for intake table."""

    __tablename__ = "intake"

    id: UUID = Field(primary_key=True)
    created_at: datetime
    updated_at: datetime
    client_pseudo_id: Optional[str] = None
    intake_type: Optional[IntakeType] = Field(
        default=None,
        sa_column=Column(
            SAEnum(
                IntakeType,
                name="intake_type_enum",
                native_enum=True,
                create_type=False,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=True,
        ),
    )
    status: IntakeStatus = Field(
        sa_column=Column(
            SAEnum(
                IntakeStatus,
                name="intake_status_enum",
                native_enum=True,
                create_type=False,  # Don't try to create the enum type, it already exists
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
        ),
    )
    completed_at: Optional[datetime] = None
    current_section: Optional[str] = None
    assessment_config_id: Optional[UUID] = Field(default=None, foreign_key="assessmentconfig.id")


class AssessmentConfig(SQLModel, table=True):
    """Read-only model for assessment_config table (minimal)."""

    __tablename__ = "assessmentconfig"

    id: UUID = Field(primary_key=True)
    state_code: str
    display_name: str
    code: str


class IntakeMessage(SQLModel, table=True):
    """Read-only model for intake messages."""

    __tablename__ = "intakemessage"

    id: UUID = Field(primary_key=True)
    created_at: datetime
    updated_at: datetime
    intake_id: UUID = Field(foreign_key="intake.id")
    from_role: str
    content: str
    section: Optional[str] = None
