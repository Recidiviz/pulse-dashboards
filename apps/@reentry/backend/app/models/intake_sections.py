"""
DEPRECATED -- Database models for intake assessment system -- Needs to be kept for conversations from before the configIO work
"""

import logging
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from sqlalchemy.orm import Mapped

if TYPE_CHECKING:
    pass

from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship

from app.models.base import BaseModel

logger = logging.getLogger(__name__)


class CompletionStatus(StrEnum):
    """
    Status of a section within an intake conversation.
    Used both in-memory and database.
    """

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class IntakeSectionRevision(BaseModel, table=True):
    """
    Model for intake section revisions.
    Stores versioned content for intake sections.
    """

    __tablename__ = "intake_section_revision"

    intake_section_id: UUID | None = Field(
        foreign_key="intakesection.id",
        ondelete="SET NULL",
        nullable=True,
    )
    title: str = Field(..., nullable=False)
    description: str = Field(
        ..., nullable=False, description="Client-facing description of the section"
    )
    required_information: str = Field(
        ...,
        nullable=False,
        description="Assessment requirements and question guidelines",
    )
    content_hash: str = Field(
        ..., nullable=False, description="SHA-256 hash of content"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship back to intake section
    intake_section: Mapped[Optional["IntakeSection"]] = Relationship(
        back_populates="revisions"
    )


class IntakeSection(BaseModel, table=True):
    """
    Model for intake assessment sections.
    Represents the different categories/topics covered during an assessment.
    """

    __tablename__ = "intakesection"

    title: str = Field(..., nullable=False)
    description: str = Field(
        ..., nullable=False, description="Client-facing description of the section"
    )
    required_information: str = Field(
        ...,
        nullable=False,
        description="Assessment requirements and question guidelines",
    )
    intake_name: str = Field(
        ...,
        nullable=True,
        description="Assessment name",
    )
    order: int = Field(
        default=0,
        nullable=False,
        description="Order of the section in the assessment flow",
    )
    current_revision_id: UUID | None = Field(
        sa_column=ForeignKey(
            "intake_section_revision.id",
            name="fk_intake_section_current_revision",
            use_alter=True,
            ondelete="SET NULL",
            nullable=True,
        ),
    )
    enabled: bool = Field(default=True, nullable=False)

    # Relationships
    revisions: Mapped[List["IntakeSectionRevision"]] = Relationship(
        back_populates="intake_section",
        cascade_delete=True,
        sa_relationship_kwargs={
            "order_by": "IntakeSectionRevision.created_at",
            "lazy": "selectin",
        },
    )

    __table_args__ = (
        UniqueConstraint("title", "intake_name", name="unique_title_intake_name"),
    )

    @property
    def current_revision(self) -> "IntakeSectionRevision | None":
        """Get the current/latest revision for this section."""
        # First try to use the current_revision_id if it's set
        if self.current_revision_id and self.revisions:
            for revision in self.revisions:
                if revision.id == self.current_revision_id:
                    return revision

        # Fallback to latest revision by creation date
        if self.revisions:
            return max(self.revisions, key=lambda r: r.created_at)

        return None


class ClientIntakeSection(BaseModel, table=True):
    """
    Model for client-specific intake sections.
    Links clients to sections and tracks completion status.
    """

    __tablename__ = "clientintakesection"

    intake_id: UUID | None = Field(
        foreign_key="intake.id", ondelete="SET NULL", nullable=True
    )
    intake_section_id: UUID | None = Field(
        foreign_key="intakesection.id", ondelete="SET NULL", nullable=True
    )
    intake_section_revision_id: UUID | None = Field(
        foreign_key="intake_section_revision.id", nullable=True, ondelete="SET NULL"
    )
    is_active: bool = Field(default=True, nullable=False)
    order: int = Field(default=0, nullable=False)
    completion_status: str = Field(
        sa_column=Column(
            SAEnum(
                CompletionStatus,
                name="completion_status_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
            default=CompletionStatus.NOT_STARTED.value,
        )
    )
    notes: Optional[str] = Field(default=None, nullable=True)

    # Relationships
    intake_section: Mapped[Optional[IntakeSection]] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    intake_section_revision: Mapped[Optional["IntakeSectionRevision"]] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    intake: Mapped[Optional["Intake"]] = Relationship(
        back_populates="client_intake_sections"
    )

    @property
    def section_title(self) -> str:
        """Get the title of the section from the specific revision used for this client intake."""
        if self.intake_section_revision:
            return self.intake_section_revision.title
        elif self.intake_section and self.intake_section.current_revision:
            return self.intake_section.current_revision.title
        if self.intake_section:
            return self.intake_section.title
        return "Unknown Section"

    @property
    def section_description(self) -> str:
        """Get the description of the section from the specific revision used for this client intake."""
        if self.intake_section_revision:
            return self.intake_section_revision.description
        elif self.intake_section and self.intake_section.current_revision:
            return self.intake_section.current_revision.description
        elif self.intake_section:
            return self.intake_section.description
        return "No description available"

    @property
    def section_required_information(self) -> str:
        """Get the required information from the specific revision used for this client intake."""
        if self.intake_section_revision:
            return self.intake_section_revision.required_information
        elif self.intake_section and self.intake_section.current_revision:
            return self.intake_section.current_revision.required_information
        elif self.intake_section:
            return self.intake_section.required_information
        return "No requirements specified"

    @property
    def description(self) -> str:
        """Alias for section_description - returns the correct revision description."""
        return self.section_description

    @property
    def required_information(self) -> str:
        """Alias for section_required_information - returns the correct revision required_information."""
        return self.section_required_information

    @property
    def title(self) -> str:
        """Get the title from the section (should be consistent across revisions)."""
        return self.section_title

    def get_effective_section_data(self) -> dict:
        """
        Get the effective section data for API responses.
        Uses revision data if available, otherwise falls back to section data.
        """
        if self.intake_section_revision:
            return {
                "id": self.intake_section.id,
                "created_at": self.intake_section.created_at,
                "updated_at": self.intake_section.updated_at,
                "title": self.intake_section_revision.title,
                "description": self.intake_section_revision.description,
                "required_information": self.intake_section_revision.required_information,
                "source": "revision",
                "revision_id": self.intake_section_revision.id,
            }
        else:
            return {
                "id": self.intake_section.id,
                "created_at": self.intake_section.created_at,
                "updated_at": self.intake_section.updated_at,
                "title": self.intake_section.title,
                "description": self.intake_section.description,
                "required_information": self.intake_section.required_information,
                "source": "section",
                "revision_id": None,
            }
