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


class IntakeSectionResponse(ORMResponse):
    title: str
    description: str


class ClientIntakeSectionResponse(ORMResponse):
    intake_section_id: UUID
    is_active: bool
    completion_status: str
    notes: str | None = None
    intake_section: IntakeSectionResponse
