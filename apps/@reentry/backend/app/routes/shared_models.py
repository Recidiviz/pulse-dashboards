from datetime import date, datetime
from enum import StrEnum
from typing import Optional
from uuid import UUID

from app.models.base import BaseModel, IntakeStatus, IntakeType
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
    section: str | None = None


class ClientRecordResponse(BaseModel):
    pseudonymized_client_id: str
    external_client_id: str
    full_name: FullNameModel
    birthdate: date
    state_code: str
    address: Optional["ClientAddressResponse"] = None


class ClientAddressResponse(BaseModel):
    street_address: Optional[str]
    city: str
    state: str


class ProcessingStatusResponse(BaseModel):
    processing_status: str
    frontend_status: str


# Forward declarations for cross-dependent types
class IntakeResponse(ORMResponse):
    client_pseudo_id: str
    status: str
    token: str | None = None
    internal_access: Optional[bool] = None
    completed_at: datetime | None = None
    address: ClientAddressResponse | None = None
    intake_type: IntakeType
    has_address: bool | None = None
    has_survey: bool | None = None


class PlanResponse(ORMResponse):
    client_pseudo_id: str
    create_execution_id: UUID | None = None
    create_execution: ExecutionResponse | None = None
    create_status: str
    edited_manually: bool


class ClientResponse(BaseModel):
    client_pseudo_id: str
    client: ClientRecordResponse | None = None
    last_completed_date: datetime | None
    intake_count: int


class AddressSubmission(BaseModel):
    street_address: Optional[str] = None
    city: str
    state: str

    def as_combined_string(self):
        result = f"{self.city}, {self.state}"
        if self.street_address:
            result = f"{self.street_address}, {result}"
        return result


class SurveySubmission(BaseModel):
    difficulty_rating: Optional[int] = None
    questions_confusing: Optional[str] = None
    preferred_method: Optional[str] = None
    method_other: Optional[str] = None
    additional_feedback: Optional[str] = None


class AssessmentConfigResponse(ORMResponse):
    """Response model for assessment configuration listing"""

    code: str
    version: int
    display_name: str
    description: str | None = None
    state_code: str


class IntakeHistoryResponse(ORMResponse):
    """Response model for intake history listing"""

    created_at: datetime
    status: IntakeStatus
    intake_type: IntakeType
    assessment_config_code: str | None = None
    assessment_config_display_name: str | None = None
    assessment_config_outputs_action_plan_activated: bool | None = None
    completed_at: datetime | None = None


class AssessmentConfigOutput(AssessmentConfigResponse):
    """Response model for assessment configuration with outputs flag"""

    outputs_action_plan_activated: bool
    outputs_summary_activated: bool
