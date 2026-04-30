from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class AssessmentType(StrEnum):
    """Shared enum to avoid circular imports between assessment and intake modules."""

    LSIR = "lsir"
    ORAS_PIT = "oras_pit"
    ORAS_RT = "oras_rt"


class IntakeType(StrEnum):  # Todo manually keep up to date with AssessmentModels
    TRANSCRIPTION = "transcription"
    CONVERSATION = "conversation"


class IntakeStatus(StrEnum):
    """
    Status for intake assessment process.
    Used for both database persistence and UI state representation.
    """

    CREATED = "created"
    IN_PROGRESS = "in_progress"
    ERROR = "error"
    COMPLETED = "completed"
    PROCESSING = "processing"


class BaseModel(SQLModel):
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SQLModelWithValidation(BaseModel):
    def __init__(self, **data):
        is_table = self.model_config["table"]
        self.model_config["table"] = False
        try:
            super().__init__(**data)
        finally:
            # Always restore the original value.
            # If validation raises during super().__init__, leaving this mutated will
            # corrupt the class-level config and can make later tests/orderings fail.
            self.model_config["table"] = is_table
