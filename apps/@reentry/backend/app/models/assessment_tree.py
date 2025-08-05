from enum import StrEnum
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped
from sqlmodel import JSON, Field, Relationship

from app.models.assessment_revision_link import AssessmentRevisionLink

from .base import BaseModel


class InputType(StrEnum):
    INTAKE_CONVERSATION = "intake_conversation"
    CONVERSATION_SUMMARY = "conversation_summary"


class AssessmentTree(BaseModel, table=True):
    name: str = Field(nullable=False, unique=True, index=True)
    assessment_type: str = Field(nullable=True)
    enabled: bool = Field(default=False, nullable=False)

    current_revision_id: UUID | None = Field(
        sa_column=ForeignKey(
            "assessmenttreerevision.id",
            name="fk_assessment_tree_current_revision_id",
            use_alter=True,
            ondelete="SET NULL",
            nullable=True,
        ),
    )

    revisions: Mapped[list["AssessmentTreeRevision"]] = Relationship(
        back_populates="assessment_tree",
        cascade_delete=True,
    )


class AssessmentTreeRevision(BaseModel, table=True):
    assessment_tree_id: UUID = Field(
        foreign_key="assessmenttree.id",
        ondelete="CASCADE",
    )
    assessment_tree: Mapped[AssessmentTree] = Relationship(back_populates="revisions")
    mermaid_content: str = Field(nullable=False)
    additional_structured_data: dict = Field(nullable=True, sa_type=JSON)
    content_hash: str | None = Field(nullable=True)
    input_data: list["InputType"] = Field(
        default=[InputType.INTAKE_CONVERSATION], nullable=False, sa_type=JSON
    )
    assessments: Mapped[list["Assessment"]] = Relationship(
        back_populates="assessment_trees_revisions",
        link_model=AssessmentRevisionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
