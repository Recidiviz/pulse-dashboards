from typing import Optional
from uuid import UUID

import structlog
from pydantic import computed_field
from sqlalchemy.orm import Mapped
from sqlmodel import JSON, Field, Relationship

from app.models.assessment_revision_link import AssessmentRevisionLink
from app.models.assessment_tree import AssessmentTreeRevision
from app.utils.assessment_runner import AssessmentRunnerStep

from .base import BaseModel
from .execution import Execution, ExecutionStatus
from .intake import Intake

logger = structlog.get_logger(__name__)


class Assessment(BaseModel, table=True):
    """
    UPDATED: January-13-2026 Assessment model still exist in the database to backward compatibility
    but new intake does not create new assessments anymore.
    """

    assessment_type: Optional[str] = Field(default=None, nullable=True)
    client_pseudo_id: Optional[str]
    client_id: Optional[str] = None

    # Relationship to intake
    intake_id: UUID | None = Field(
        foreign_key="intake.id",
        nullable=True,
        default=None,
    )
    intake: Mapped[Optional[Intake]] = Relationship(
        back_populates="assessments", sa_relationship_kwargs={"lazy": "selectin"}
    )

    #
    # Execution status and output
    #
    execution_id: UUID | None = Field(
        foreign_key="execution.id",
        nullable=True,
        default=None,
    )
    execution: Mapped[Optional[Execution]] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    #
    # populated by the AssessmentRunner after the execution
    # one score per tree, referenced by tree name
    # one steps recap per tree, referenced by tree name
    #
    scores: dict[str, int] | None = Field(sa_type=JSON, nullable=True, default=None)
    runs_steps: dict[str, list[AssessmentRunnerStep]] | None = Field(
        sa_type=JSON, nullable=True, default=None
    )
    misses_counts: dict[str, int] | None = Field(
        sa_type=JSON, nullable=True, default=None
    )
    #
    # Lists all the trees and their verisons that the assessment is run against
    # populated by the runner
    #
    assessment_trees_revisions: Mapped[list["AssessmentTreeRevision"]] = Relationship(
        back_populates="assessments",
        link_model=AssessmentRevisionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    @computed_field
    def status(self) -> ExecutionStatus:
        return self.execution.status if self.execution else ExecutionStatus.NOT_STARTED

    @computed_field(alias="execution")
    def ser_execution(self) -> Execution | None:
        return self.execution

    #
    # Execution
    #

    @property
    def is_execution_finished(self) -> bool:
        return self.status in ("completed", "failed")

    def to_str(self):
        if not self.is_execution_finished or not self.scores:
            return None
        else:
            res = ""
            for area, score in self.scores.items():
                misses = self.misses_counts.get(area, 0) if self.misses_counts else 0
                res += f"\n{area}: {score} ({misses} unanswered questions)"
            return res
