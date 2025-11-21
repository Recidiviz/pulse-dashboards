"""
Database models for intake assessment system.
"""

import logging
import secrets
from datetime import datetime, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING, List, Optional, Tuple, Union
from uuid import UUID

from sqlalchemy.orm import Mapped

from app.crud.intake_section import get_intake_sections_with_revisions
from app.models.execution import Execution
from app.models.intake_sections import (
    ClientIntakeSection,
    CompletionStatus,
    IntakeSection,
)
from app.routes.shared_models import IntakeMessageRole
from app.utils.assessment_runner import get_assessments_type

if TYPE_CHECKING:
    from app.models.assessment import Assessment

import jwt
from sqlalchemy import Column, and_
from sqlalchemy import Enum as SAEnum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import JSON, Field, Relationship, select

from app.core.config import settings
from app.models.base import BaseModel
from app.services.client_data.queries import Queries
from app.utils.intake.utils import get_intake_name_by_state

# Special section title for completed intakes
# Not stored in DB, only used for UI organization of closing messages
COMPLETION_SECTION = "Completion"

logger = logging.getLogger(__name__)


class IntakeStatus(StrEnum):
    """
    Status for intake assessment process.
    Used for both database persistence and UI state representation.
    """

    CREATED = "created"
    IN_PROGRESS = "in_progress"
    ERROR = "error"
    COMPLETED = "completed"


class IntakeType(StrEnum):
    TRANSCRIPTION = "transcription"
    CONVERSATION = "conversation"
    EXTERNAL = "external"


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

    __tablename__ = "intake"

    intake_type: Optional[IntakeType] = Field(
        default=None,
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
    client_pseudo_id: Optional[str]
    client_id: Optional[str] = None
    internal_access: bool = Field(
        default=True,
        nullable=True,
        description="Enable for internal access",
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
    current_section: Optional[str] = Field(
        default=None, nullable=True, description="Current section being processed"
    )

    # Store external chat messages for external intakes
    external_chat_messages: list[dict] | None = Field(
        sa_type=JSON, nullable=True, default=None
    )

    # Relationships
    client_intake_sections: Mapped[List["ClientIntakeSection"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "order_by": "ClientIntakeSection.order",
            "lazy": "selectin",
            "cascade": "all, delete-orphan",
        },
    )
    intake_token: Mapped[Optional["IntakeToken"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
            "uselist": False,
        },
    )
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

    survey: Mapped[Optional["IntakeSurvey"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    # One-to-one relationship with RecordingSession
    recording_session: Mapped[Optional["RecordingSession"]] = Relationship(
        back_populates="intake",
        sa_relationship_kwargs={
            "uselist": False,
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
        },
    )

    @property
    def has_survey(self) -> bool:
        """Check if client has filled out the intake survey."""
        return self.survey is not None

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

        # If specifically completed, also schedule assessment creation
        if self.status == IntakeStatus.COMPLETED:
            logger.info(f"Scheduling assessment for intake {self.id}")
            await self.schedule_assessment(session)

        session.add(self)
        await session.commit()
        await session.refresh(self)
        return self

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

    async def _handle_conversation_status(self, session):
        """
        Handle logic specific to conversation-type intakes when status is updated.
        """

        # If new status is in_progress, check if the sections are populated and otherwise populate them
        if self.status == IntakeStatus.IN_PROGRESS.value:
            # First check if intake sections already exist for this intake
            await self._initialize_conversation_sections(session)

            # Set the first section as in progress and set current_section
            if self.client_intake_sections:
                # Get the first section by order
                statement = (
                    select(ClientIntakeSection)
                    .where(ClientIntakeSection.intake_id == self.id)
                    .order_by(ClientIntakeSection.order)
                    .limit(1)
                )
                result = await session.exec(statement)
                first_section = result.first()

                if first_section:
                    # Set the first section as in progress
                    first_section.completion_status = CompletionStatus.IN_PROGRESS.value
                    session.add(first_section)

                    # Set the current section to the first section's title
                    self.current_section = first_section.section_title
                    session.add(self)

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

    async def _initialize_conversation_sections(self, session):
        """
        Populate intake sections for a conversation-type intake if they don't already exist.
        """

        # First check if intake sections already exist for this intake
        statement = select(ClientIntakeSection).where(
            ClientIntakeSection.intake_id == self.id
        )
        result = await session.exec(statement)
        existing_sections = result.all()

        if existing_sections:
            return

        logger.info(f"Populating sections for intake {self.id}")

        # Get client data to determine assessment type based on state
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            self.client_pseudo_id
        )
        intake_name = get_intake_name_by_state(client_record.state_code)
        logger.info(
            f"Client state: {client_record.state_code}, Intake name: {intake_name}"
        )
        print(f"Client state: {client_record.state_code}, Intake name: {intake_name}")

        # Get enabled IntakeSection records for this assessment type, ordered by the order field
        section_records = await get_intake_sections_with_revisions(
            session, intake_name, True, True
        )

        if not section_records:
            raise ValueError(f"No sections found for intake name {intake_name}")

        # Create client intake sections for each section in the correct order
        print(
            f"🔄 Creating {len(section_records)} ClientIntakeSection records for intake {self.id}"
        )
        for i, section in enumerate(section_records):
            # Get the current revision for this section
            current_revision = section.current_revision

            print(f"  📝 Section: {section.title}")
            print(f"     Section ID: {section.id}")
            print(f"     Section description (direct): {section.description[:50]}...")
            print(f"     Section current_revision_id: {section.current_revision_id}")

            if current_revision:
                print(f"     ✅ Current revision found: {current_revision.id}")
                print(
                    f"     ✅ Revision description: {current_revision.description[:50]}..."
                )
                print(
                    f"     ✅ Will link ClientIntakeSection to revision: {current_revision.id}"
                )
            else:
                print("     ❌ NO CURRENT REVISION FOUND!")

            client_section = ClientIntakeSection(
                intake_id=self.id,
                intake_section_id=section.id,
                intake_section_revision_id=current_revision.id
                if current_revision
                else None,
                is_active=True,
                order=i,
                completion_status=CompletionStatus.NOT_STARTED.value,
            )
            session.add(client_section)
            print(
                f"     ➕ Created ClientIntakeSection with revision_id: {client_section.intake_section_revision_id}"
            )

        session.add(self)
        await session.commit()
        await session.refresh(self)

    async def next_section(self, session: AsyncSession):
        """
        Move to the next section in the intake process.
        Marks current section as completed and advances to the next section.
        If all sections are completed, marks the intake as completed.

        Args:
            session: Database session

        Returns:
            self (updated intake object)

        Raises:
            ValueError: If there is no current section to advance from
        """
        if not self.current_section:
            raise ValueError(f"Intake {self.id}: No current section to advance from")

        # Find the current client intake section
        statement = (
            select(ClientIntakeSection)
            .join(IntakeSection)
            .where(
                ClientIntakeSection.intake_id == self.id,
                IntakeSection.title == self.current_section,
            )
        )
        result = await session.exec(statement)
        current_section = result.first()

        if not current_section:
            raise ValueError(
                f"Intake {self.id}: Could not find section {self.current_section}"
            )

        # Mark current section as completed
        current_section.completion_status = CompletionStatus.COMPLETED
        session.add(current_section)

        # Find all sections ordered by the order field
        from sqlalchemy.orm import selectinload

        statement = (
            select(ClientIntakeSection)
            .join(IntakeSection)
            .where(ClientIntakeSection.intake_id == self.id)
            .order_by(ClientIntakeSection.order)
            .options(
                selectinload(ClientIntakeSection.intake_section).selectinload(
                    IntakeSection.revisions
                ),
                selectinload(ClientIntakeSection.intake_section_revision),
            )
        )
        result = await session.exec(statement)
        all_sections = result.all()

        # Find the next section with a higher order value
        next_section = None
        for section in all_sections:
            if section.order > current_section.order:
                next_section = section
                break

        # Check if there's a next section to process
        if next_section:
            # Mark the next section as in progress
            next_section.completion_status = CompletionStatus.IN_PROGRESS
            session.add(next_section)

            # Update the current section to the next one
            self.current_section = next_section.section_title
            self.status = IntakeStatus.IN_PROGRESS
        else:
            # All sections are completed
            # Instead of setting to None, set to COMPLETION_SECTION
            # The update_status method will handle this, but we set it here too for clarity

            self.current_section = COMPLETION_SECTION

        # Save changes
        session.add(self)
        await session.commit()
        await session.refresh(self)

        return self

    async def schedule_assessment(self, session) -> Execution | None:
        """
        Schedule the creation of an assessment for this intake.
        Only works when intake status is COMPLETED.
        """
        from app.crud.assessment import create_assessment
        from app.models.assessment import Assessment

        # Only create assessment if intake is completed
        # Check both string value and enum value to be safe
        if self.status != IntakeStatus.COMPLETED.value and self.status != "completed":
            logger.warning(
                f"Cannot create assessment for intake {self.id} with status {self.status}"
            )
            return None

        # Check if assessment already exists for this client_pseudo_id
        from sqlmodel import select

        statement = select(Assessment).where(
            Assessment.client_pseudo_id == self.client_pseudo_id
        )
        result = await session.exec(statement)
        existing_assessment = result.first()

        if existing_assessment:
            logger.info(f"Assessment already exists for client {self.client_pseudo_id}")
            return existing_assessment.id

        # Create and schedule the assessment
        logger.info(f"Creating new assessment for client {self.client_pseudo_id}")
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            self.client_pseudo_id
        )
        # todo: getting assessments type as array, since we probably will have more than one type in the near future
        assessments_types = get_assessments_type(client_record.state_code)
        logger.info(f"Assessments type determined: {assessments_types}")
        logger.info(f"Using assessment type: {assessments_types[0]}")

        assessment = Assessment(
            client_pseudo_id=self.client_pseudo_id,
            intake_id=self.id,
            assessment_type=assessments_types[0],  # Using by default the first type
        )
        assessment = await create_assessment(session, assessment)
        execution = await assessment.schedule_execution(session)
        await session.refresh(assessment)

        return execution

    async def get_current_section_messages(
        self, session: AsyncSession, current_session_time: datetime = None
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
