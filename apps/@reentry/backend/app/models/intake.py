"""
Database models for intake assessment system.
"""

import secrets
from datetime import datetime, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING, List, Optional, Tuple, Union
from uuid import UUID

import structlog
from sqlalchemy.orm import Mapped

from app.crud.clientintakesections import (
    get_all_client_sections_ordered,
    get_current_client_section_by_title,
    mark_section_completed,
    mark_section_in_progress,
)
from app.models.assessment_config import AssessmentConfig
from app.models.base import IntakeStatus
from app.models.execution import ExecutionStatus
from app.models.intake_sections import ClientIntakeSection
from app.routes.shared_models import IntakeMessageRole
from app.utils.assessment_config_utils import (
    get_first_section_from_config,
    get_next_section_from_config,
)

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.models import Plan
    from app.models.recording import RecordingSession

import jwt
from sqlalchemy import Column, and_
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, select

from app.core.config import settings
from app.core.db import AsyncSession
from app.models.base import BaseModel, IntakeType
from app.services.client_data.queries import Queries

# Special section title for completed intakes
# Not stored in DB, only used for UI organization of closing messages
COMPLETION_SECTION = "Completion"

logger = structlog.get_logger(__name__)


class QuestionsConfusing(StrEnum):
    NO = "no"
    SOME = "some"  # Yes, some of them were confusing
    MOST_ALL = "most_all"  # Yes, most or all of them were confusing


class PreferredMethod(StrEnum):
    CHATBOT = "chatbot"  # Typing on the computer to a chatbot (like you just did)
    VOICE = "voice"  # Talking into a microphone on the computer instead of typing
    PERSON = "person"  # Talking face-to-face with a person, like a case manager
    OTHER = "other"


class Intake(BaseModel, table=True):
    """
    Model for intake assessment.
    Represents the overall assessment process for a client.
    """

    # General fields
    client_pseudo_id: Optional[str]
    intake_type: IntakeType = Field(
        sa_column=Column(
            SAEnum(
                IntakeType,
                name="intake_type_enum",
                native_enum=True,
                values_callable=lambda enum: [e.value for e in enum],
            ),
            nullable=True,
        ),
        description="Type of intake assessment",
    )
    status: IntakeStatus = Field(
        default=IntakeStatus.CREATED.value,
        sa_column=Column(
            SAEnum(
                IntakeStatus,
                name="intake_status_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
            default=IntakeStatus.CREATED.value,
        ),
        description="Current status of the intake",
    )
    assessment_config_id: UUID = Field(
        foreign_key="assessmentconfig.id",
        index=True,
        nullable=True,
        ondelete="SET NULL",
        description="Reference to the assessment configuration used for this intake",
    )
    completed_at: Optional[datetime] = Field(
        default=None, nullable=True, description="Timestamp when intake was completed"
    )
    current_section: Optional[str] = Field(
        default=None, nullable=True, description="Current section being processed"
    )

    # Relationships
    assessment_config: Mapped[Optional["AssessmentConfig"]] = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
        },
    )
    # The scoring results for this completed intake
    assessments: Mapped[List["Assessment"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )
    address: Mapped[Optional["ClientAddress"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    plan: Mapped[Optional["Plan"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    # Conversation intake specific fields
    current_section: Optional[str] = Field(
        default=None, nullable=True, description="Current section being processed"
    )
    # Enable intake access by Name + DOB
    internal_access: bool = Field(
        default=True,
        nullable=True,
        description="Enable for internal access",
    )
    # For shareable token authentication
    intake_token: Mapped[Optional["IntakeToken"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
            "uselist": False,
        },
    )
    survey: Mapped[Optional["IntakeSurvey"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    # Transcription specific fields
    recording_session: Mapped[Optional["RecordingSession"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "uselist": False,
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    # Deprecated
    client_id: Optional[str] = None
    client_intake_sections: Mapped[List["ClientIntakeSection"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "order_by": "ClientIntakeSection.order",
            "lazy": "selectin",
            "cascade": "all, delete-orphan",
        },
    )

    # -------------------------- Shared Methods ----------------------------------
    @property
    def has_address(self) -> bool:
        """Check if client has provided address information."""
        return self.address is not None

    async def update_status(self, session, status: IntakeStatus):
        """
        Update the status of this intake record and perform necessary side effects.
        """
        if self.status == status:
            logger.info(
                f"Intake {self.id} status is already {status}, no update needed"
            )
            return self

        # Prevent going back to CREATED state once the intake has moved beyond it
        if (
            status == IntakeStatus.CREATED.value
            and self.status != IntakeStatus.CREATED.value
        ):
            error_msg = f"Cannot change intake status from {self.status} back to {IntakeStatus.CREATED.value}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        self.status = status

        if self.intake_type == IntakeType.CONVERSATION.value:
            await self._handle_conversation_status(session)

        if self.intake_type == IntakeType.TRANSCRIPTION.value:
            self._handle_transcription_status()

        # If specifically completed, also schedule action plan creation
        if self.status == IntakeStatus.COMPLETED:
            self.completed_at = datetime.utcnow()
            logger.info(f"Scheduling action plan for intake {self.id}")
            await self.schedule_plan_generation(session)

        session.add(self)
        await session.commit()
        await session.refresh(self)
        return self

    async def schedule_plan_generation(self, session) -> UUID:
        """
        Schedule the creation of a plan based on this intake.
        Only works when intake status is COMPLETED.
        """
        from app.crud.plan import create_plan, get_plan_by_intake_id
        from app.models.models import Plan

        # Only create plan if intake is completed
        if self.status != ExecutionStatus.COMPLETED.value:
            logger.warning(
                f"Cannot create plan for intake {self.id} with status {self.status}"
            )
            return None

        # Check if plan already exists for this intake
        existing_plan = await get_plan_by_intake_id(session, self.id)

        if existing_plan:
            logger.info(f"Plan already exists for client {self.client_pseudo_id}")
            return existing_plan.id

        # Create and schedule the plan
        logger.info(f"Creating new plan for client {self.client_pseudo_id}")
        plan = Plan(client_pseudo_id=self.client_pseudo_id, intake_id=self.id)
        plan = await create_plan(session, plan)
        await plan.schedule_initial_creation(session)

        return plan.id

    # -------------------------- Conversation Methods ----------------------------------
    @property
    def has_survey(self) -> bool:
        """Check if client has filled out the intake survey."""
        return self.survey is not None

    async def _handle_conversation_status(self, session):
        """
        Handle logic specific to conversation-type intakes when status is updated.
        """

        # If new status is in_progress, initialize and set first section
        if self.status == IntakeStatus.IN_PROGRESS.value:
            try:
                from app.utils.config_loader import ConfigLoader

                conversation_config = await ConfigLoader.load_conversation_config(
                    self.assessment_config_id, session
                )
                first_section = get_first_section_from_config(conversation_config)
                if first_section:
                    self.current_section = first_section["title"]
                    session.add(self)
                    logger.info(
                        f"Set first section from config: {self.current_section}"
                    )
            except Exception as e:
                logger.error(f"Failed to load assessment config: {e}")
                raise

        # For statuses that represent the end of the intake process, set current_section to COMPLETION_SECTION
        if self.status in [
            IntakeStatus.COMPLETED.value,
            IntakeStatus.ERROR.value,
        ]:
            logger.info(
                f"Intake {self.id} marked as {self.status}, setting current_section to {COMPLETION_SECTION}"
            )
            # Set the current section to "Completion" for closing remarks
            self.current_section = COMPLETION_SECTION

    async def next_section(self, session: AsyncSession):
        """
        Move to the next section in the intake process.
        Marks current section as completed and advances to the next section.
        If all sections are completed, marks the intake as completed.

        LEGACY: If ClientIntakeSections, use them.
        NEW: Else use assessment_config directly.

        Args:
            session: Database session

        Returns:
            self (updated intake object)

        Raises:
            ValueError: If there is no current section to advance from
        """
        if not self.current_section:
            raise ValueError(f"Intake {self.id}: No current section to advance from")

        # LEGACY: Use ClientIntakeSection table
        if self.client_intake_sections:
            await self._next_section_legacy(session)

        else:
            try:
                from app.utils.config_loader import ConfigLoader

                assessment_config = await ConfigLoader.load_conversation_config(
                    self.assessment_config_id, session
                )
                next_section = get_next_section_from_config(
                    assessment_config, self.current_section
                )

                if next_section:
                    # Update to next section
                    self.current_section = next_section["title"]
                    self.status = IntakeStatus.IN_PROGRESS
                    logger.info(
                        f"Advanced to next section from config: {self.current_section}"
                    )
                else:
                    # All sections completed
                    self.current_section = COMPLETION_SECTION
                    logger.info("All sections completed (config-based)")

            except Exception as e:
                logger.error(f"Failed to get next section from config: {e}")
                raise

        # Save changes
        session.add(self)
        await session.commit()
        await session.refresh(self)

        return self

    async def _next_section_legacy(self, session):
        # Find current section
        current_section = await get_current_client_section_by_title(
            session, self.id, self.current_section
        )

        if not current_section:
            raise ValueError(
                f"Intake {self.id}: Could not find section {self.current_section}"
            )

        # Mark current section as completed
        await mark_section_completed(session, current_section)

        # Get all sections ordered
        all_sections = await get_all_client_sections_ordered(session, self.id)

        # Find next section
        next_section = None
        for section in all_sections:
            if section.order > current_section.order:
                next_section = section
                break

        if next_section:
            # Mark next section as in progress
            await mark_section_in_progress(session, next_section)
            # Update current section
            self.current_section = next_section.section_title
            self.status = IntakeStatus.IN_PROGRESS
        else:
            # All sections completed
            self.current_section = COMPLETION_SECTION

    async def get_current_section_messages(
        self, session: AsyncSession, current_session_time: datetime | None = None
    ) -> tuple[List["IntakeMessage"], bool]:
        """
        Get messages for current section AND check if user has accepted terms.

        Returns:
            tuple: (current_section_messages, has_accepted_terms)
        """
        if not self.current_section:
            any_messages_query = (
                select(IntakeMessage).where(IntakeMessage.intake_id == self.id).limit(1)
            )
            any_result = await session.execute(any_messages_query)
            has_accepted_terms = any_result.first() is not None
            return [], has_accepted_terms

        current_query = (
            select(IntakeMessage)
            .where(
                and_(
                    IntakeMessage.intake_id == self.id,
                    IntakeMessage.section == self.current_section,
                )
            )
            .order_by(IntakeMessage.created_at)
        )

        current_result = await session.execute(current_query)
        current_messages = current_result.scalars().all()

        if current_messages:
            has_accepted_terms = True
        else:
            any_messages_query = (
                select(IntakeMessage).where(IntakeMessage.intake_id == self.id).limit(1)
            )
            any_result = await session.execute(any_messages_query)
            has_accepted_terms = any_result.first() is not None

        # Apply time filtering for display (internal users)
        if current_session_time:
            session_messages = [
                msg
                for msg in current_messages
                if msg.created_at >= current_session_time
            ]

            if session_messages:
                return session_messages, has_accepted_terms

            return [], has_accepted_terms

        return current_messages, has_accepted_terms

    # -------------------------- Transcription Methods ----------------------------------
    def _handle_transcription_status(self):
        """
        Handle logic specific to transcription-type intakes when status is updated.
        """
        if self.status == IntakeStatus.COMPLETED.value and (
            not self.recording_session
            or not self.recording_session.transcription_approved
        ):
            raise ValueError(
                f"Transcription intake {self.id} cannot be marked as completed without transcription approved"
            )


# ------------------------------ Intake Message ------------------------------------------
class IntakeMessage(BaseModel, table=True):
    """
    Model for intake assessment messages.
    Stores the conversation between client and case worker.
    """

    __tablename__ = "intakemessage"

    intake_id: UUID = Field(foreign_key="intake.id", ondelete="CASCADE")
    from_role: str = Field(
        sa_column=Column(
            SAEnum(
                IntakeMessageRole,
                name="intake_message_role_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
        )
    )
    content: str = Field(nullable=False)
    section: str = Field(default=None, nullable=True)


# ------------------------------ Intake Token ------------------------------------------
class IntakeToken(BaseModel, table=True):
    """
    Auth tokens related to intakes.
    TEMPORARY APPROACH: Raw tokens are stored directly in the database.
    """

    __tablename__ = "intaketoken"

    intake_id: UUID = Field(foreign_key="intake.id", index=True, ondelete="CASCADE")
    token: str = Field(..., nullable=False, description="Raw authentication token")
    expires_at: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="When the access token expires",
    )
    refresh_token: str = Field(
        default="",
        nullable=False,
        description="Raw refresh token",
    )
    refresh_expires_at: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="When the refresh token expires.",
    )

    intake: Mapped[Intake] = Relationship(back_populates="intake_token")

    @property
    def is_expired(self) -> bool:
        """Check if the access token is expired based on its expiration date."""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False

    @property
    def is_valid(self) -> bool:
        """Check if the access token is still valid."""
        return not self.is_expired

    @classmethod
    def generate_token(cls, intake_id: UUID) -> Tuple["IntakeToken", str]:
        """
        Generate a secure random access token for an intake.
        In this temporary approach, we generate a token and store it directly
        in the database without hashing.
        Returns a tuple of (token_entry, token).
        """
        # TODO: Should be longer
        token = secrets.token_urlsafe(8)

        token_entry = cls(
            intake_id=intake_id,
            token=token,
            expires_at=None,
            refresh_token="",
            refresh_expires_at=None,
        )
        return token_entry, token

    async def verify(self, token: str, dob: str, session) -> Union[dict, bool]:
        """
        Verify the provided token"
        """
        if self.is_expired:
            return False

        if self.token != token:
            return False

        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            self.intake.client_pseudo_id
        )

        if not client_record:
            print("No client found")
            return False

        # Convert the incoming string dob to a date object for comparison with birthdate
        try:
            from datetime import datetime

            # Assuming dob is in format MM/DD/YYYY
            dob_date = datetime.strptime(dob, "%m/%d/%Y").date()
            if dob_date != client_record.birthdate:
                return False
        except ValueError:
            # If date format is invalid
            logger.error(f"Invalid date format for DOB: {dob}")
            return False

        refresh_token = secrets.token_urlsafe(16)
        refresh_expiration = datetime.utcnow() + timedelta(days=7)

        self.refresh_token = refresh_token
        self.refresh_expires_at = refresh_expiration
        await session.commit()

        payload = {
            "intake_id": str(self.intake_id),
            "client_pseudo_id": self.intake.client_pseudo_id,
            "exp": datetime.utcnow() + timedelta(hours=1),
        }

        jwt_token = jwt.encode(
            payload, settings.INTAKE_JWT_SECRET, algorithm=settings.INTAKE_JWT_ALGORITHM
        )

        return {"jwt_token": jwt_token, "refresh_token": refresh_token}


# ------------------------------ Client Address ------------------------------------------
class ClientAddress(BaseModel, table=True):
    """
    Model for client addresses collected during intake.
    """

    __tablename__ = "client_address"

    intake_id: UUID = Field(foreign_key="intake.id", nullable=False, ondelete="CASCADE")
    street_address: Optional[str] = Field(default=None, nullable=True)
    city: str = Field(..., nullable=False)
    state: str = Field(..., nullable=False)

    # Relationship
    intake: Mapped["Intake"] = Relationship(back_populates="address")

    def as_formatted_string(self):
        return f"{self.street_address}, {self.city}, {self.state}".strip()


# ------------------------------ Intake Survey ------------------------------------------
class IntakeSurvey(BaseModel, table=True):
    """
    Model for survey filled out after intake completion.
    """

    __tablename__ = "intake_survey"

    intake_id: UUID = Field(foreign_key="intake.id", nullable=False, ondelete="CASCADE")
    # How hard or easy was it to do this intake?
    difficulty_rating: Optional[int] = Field(
        ge=1, le=5, description="1=Very hard, 5=Very easy", nullable=True
    )
    # Were any of the questions confusing or hard to understand?
    questions_confusing: Optional[QuestionsConfusing] = Field(
        description="Whether questions were confusing", nullable=True
    )
    # If you had to do this intake again, how would you prefer to do it?
    preferred_method: Optional[PreferredMethod] = Field(
        default=None,
        max_length=500,
        description="Preferred method for future intakes",
        nullable=True,
    )
    method_other: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Free text explanation if 'other' is selected",
        nullable=True,
    )
    # Is there anything else you want to tell us that could help make this intake better or easier for others?
    additional_feedback: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Additional feedback to improve the intake",
        nullable=True,
    )

    # Relationship
    intake: Mapped["Intake"] = Relationship(back_populates="survey")
