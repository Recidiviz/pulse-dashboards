from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class ORMResponse(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class DeletionStatus(StrEnum):
    SUCCESS = "success"
    FAILED = "failed"


class DeletionResponse(BaseModel):
    status: DeletionStatus


class IntakeSectionStatus(StrEnum):
    COMPLETED = "completed"
    IN_PROGRESS = "in_progress"
    NOT_STARTED = "not_started"


class IntakeSectionResponse(BaseModel):
    title: str
    description: str
    status: IntakeSectionStatus
