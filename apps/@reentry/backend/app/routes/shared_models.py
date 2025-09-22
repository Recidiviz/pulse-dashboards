from datetime import date
from enum import StrEnum
from typing import Optional
from uuid import UUID

from pydantic import computed_field

from app.models.base import BaseModel
from app.routes.execution_router import ExecutionResponse
from app.services.client_data.types import FullNameModel

from .base import ORMResponse


class IntakeMessageRole(StrEnum):
    """Roles for messages in intake assessment."""

    CLIENT = "client"
    CASEWORKER = "caseworker"
    SYSTEM = "system"


class ProcessingStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_RETRY = "needs_retry"


class IntakeMessageResponse(ORMResponse):
    content: str
    from_role: IntakeMessageRole


class ClientRecordResponse(BaseModel):
    pseudonymized_client_id: str
    external_client_id: str
    full_name: FullNameModel
    birthdate: date
    state_code: str


# Forward declarations for cross-dependent types
class IntakeResponse(ORMResponse):
    client_pseudo_id: str
    status: str
    current_section: str | None = None
    token: str | None = None
    internal_access: Optional[bool] = None


class PlanResponse(ORMResponse):
    client_pseudo_id: str
    create_execution_id: UUID | None = None
    create_execution: ExecutionResponse | None = None
    create_status: str
    edited_manually: bool


class AssessmentResponse(ORMResponse):
    client_pseudo_id: str
    intake_id: UUID | None = None
    scores: dict | None = None
    status: str


class ClientResponse(BaseModel):
    client_pseudo_id: str
    intake: IntakeResponse | None = None
    plans: PlanResponse | None = None
    processing_status: ProcessingStatus
    client: ClientRecordResponse | None = None

    @computed_field
    @property
    def frontend_status(self) -> str:
        from app.crud.client import compute_frontend_status

        intake_status = self.intake.status if self.intake else None
        return compute_frontend_status(intake_status, self.processing_status)


class AddressSubmission(BaseModel):
    street_address: Optional[str] = None
    city: str
    state: str

    def as_combined_string(self):
        result = f"{self.city}, {self.state}"
        if self.street_address:
            result = f"{self.street_address}, {result}"
        return result
