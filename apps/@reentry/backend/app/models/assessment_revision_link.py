from uuid import UUID

from sqlmodel import Field, SQLModel


class AssessmentRevisionLink(SQLModel, table=True):
    assessment_id: UUID | None = Field(
        default=None, foreign_key="assessment.id", ondelete="CASCADE", primary_key=True
    )
    assessment_tree_revision_id: UUID | None = Field(
        default=None,
        foreign_key="assessmenttreerevision.id",
        ondelete="CASCADE",
        primary_key=True,
    )
