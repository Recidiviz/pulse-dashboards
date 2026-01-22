"""
Database models for recording sessions.
"""

from enum import StrEnum
from typing import Optional
from uuid import UUID

from sqlalchemy import BigInteger, Column, UniqueConstraint
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

    client_pseudo_id: Optional[str]
    client_id: Optional[str] = None
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
    last_chunk_timestamp: int = Field(
        ...,
        sa_column=Column(BigInteger, nullable=True),
        description="Unix timestamp in milliseconds of the last received chunk",
    )
    duration: int = Field(
        nullable=True,
        default=0,
        description="Total duration of the recording in milliseconds",
    )

    transcription_approved: bool = Field(
        default=False,
        nullable=False,
        description="Flag indicating if transcription has been approved",
    )

    # Transcription validation fields
    validation_word_count: bool = Field(
        default=True,
        nullable=False,
        description="Validation result: True if transcript has at least 200 words",
    )
    validation_no_prompt_injection: bool = Field(
        default=True,
        nullable=False,
        description="Validation result: True if transcript doesn't contain injection patterns",
    )
    validation_diarization: bool = Field(
        default=True,
        nullable=False,
        description="Validation result: True if at least two speakers are present",
    )
    validation_minimum_duration: bool = Field(
        default=True,
        nullable=False,
        description="Validation result: True if audio duration is at least 10 minutes",
    )

    deepgram_request_id: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Deepgram async transcription request ID for callback tracking",
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
        UniqueConstraint("session_id", "timestamp", name="uq_session_timestamp"),
    )

    session_id: UUID = Field(..., foreign_key="recording_session.id", nullable=False)
    chunk_index: int = Field(
        ..., nullable=False, description="Index of the audio chunk"
    )
    timestamp: int = Field(
        ...,
        sa_column=Column(BigInteger, nullable=True),
        description="Unix timestamp in milliseconds",
    )
