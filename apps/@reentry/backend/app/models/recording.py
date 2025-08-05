"""
Database models for recording sessions.
"""

from enum import StrEnum
from typing import Optional
from uuid import UUID

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship

from .base import BaseModel
from .execution import Execution
from .intake import Intake


class RecordingStatus(StrEnum):
    CREATED = "created"
    RECORDING = "recording"
    PAUSED = "paused"
    PROCESSING = "processing"
    ERROR = "error"
    COMPLETED = "completed"


class RecordingSession(BaseModel, table=True):
    __tablename__ = "recording_session"

    client_id: str = Field(..., nullable=False, description="Client identifier")
    intake_id: UUID = Field(
        foreign_key="intake.id",
        nullable=False,
        description="Reference to the related intake",
        ondelete="CASCADE",
    )
    audio_chunks_url: Optional[str] = Field(
        default=None, nullable=True, description="URL to audio chunks storage"
    )
    audio_file_url: Optional[str] = Field(
        default=None, nullable=True, description="URL to final audio file"
    )
    status: RecordingStatus = Field(
        default=RecordingStatus.CREATED.value,
        sa_column=Column(
            SAEnum(
                RecordingStatus,
                name="recording_status_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
            default=RecordingStatus.CREATED.value,
        ),
        description="Current status of the recording session",
    )

    gcs_bucket_name: Optional[str] = Field(default=None, nullable=True)
    gcs_chunks_folder: Optional[str] = Field(default=None, nullable=True)
    gcs_final_file_path: Optional[str] = Field(default=None, nullable=True)
    chunk_count: int = Field(default=0)

    transcription_approved: bool = Field(
        default=False,
        nullable=False,
        description="Flag indicating if transcription has been approved",
    )

    # Relationship back to Intake
    intake: Mapped[Intake] = Relationship(
        back_populates="recording_session",
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    #
    # Execution status and output
    #
    execution_id: UUID | None = Field(
        foreign_key="execution.id",
        nullable=True,
        default=None,
    )
    execution: Mapped[Optional[Execution]] = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "RecordingSession.execution_id",
        }
    )


class RecordingChunk(BaseModel, table=True):
    __tablename__ = "recording_chunk"
    __table_args__ = (
        UniqueConstraint("session_id", "chunk_index", name="uq_session_chunk"),
    )

    session_id: UUID = Field(..., foreign_key="recording_session.id", nullable=False)
    chunk_index: int = Field(
        ..., nullable=False, description="Index of the audio chunk"
    )
