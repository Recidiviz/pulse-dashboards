from enum import StrEnum
from typing import Optional
from uuid import UUID

import structlog
from pydantic import (
    ConfigDict,
    computed_field,
    field_serializer,
)
from sqlalchemy.orm import Mapped
from sqlmodel import JSON, Field, Relationship

from app.models.assessment_revision_link import AssessmentRevisionLink
from app.models.assessment_tree import AssessmentTreeRevision
from app.utils.assessment_runner import AssessmentRunnerStep

from .base import BaseModel
from .execution import Execution, ExecutionStatus
from .intake import Intake

logger = structlog.get_logger(__name__)


class AssessmentType(StrEnum):
    LSIR = "lsir"
    UTAH_LSIR = "utah_lsir"
    ORAS_PIT = "oras_pit"
    ORAS_RT = "oras_rt"


class Assessment(BaseModel, table=True):
    assessment_type: Optional[str] = Field(default=None, nullable=True)
    client_id: str

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
    # Note: It seems SQLModel does not return Pydantic related model for list[]
    # Issue encountered: Expected DecisionTreeRunnerStep but received dict with value
    # {'node_key': 'A', 'node_v...t', 'annotations': None} - serialized value may not be as expected
    #

    @field_serializer("runs_steps")
    def ensure_run_steps_type(self, value):
        if (
            value
            and isinstance(value, dict)
            and not isinstance(list(value.values())[0], AssessmentRunnerStep)
        ):
            return {
                key: [AssessmentRunnerStep.model_validate(step) for step in val]
                for (key, val) in value.items()
            }
        return value

    model_config = ConfigDict(extra="allow", from_attributes=True)

    #
    # Execution
    #

    @property
    def is_execution_finished(self) -> bool:
        return self.status in ("completed", "failed")

    async def schedule_execution(self, session) -> Execution:
        """
        Schedule the execution of the assessment generation.
        """
        from app.tasks.assessment import assessment_task
        from app.tasks.scheduler import schedule_task

        # prevent execution to be scheduled twice
        if self.execution:
            return self.execution

        execution = await schedule_task(
            session,
            table_name="assessmenttrees",
            table_entity_id=self.id,
            task_func=assessment_task,
            task_kwargs={"assessment_id": self.id},
        )

        self.execution = execution
        self.execution_id = execution.id
        session.add(self)
        await session.commit()
        return execution

    def to_str(self):
        if not self.is_execution_finished or not self.scores:
            return None
        else:
            res = ""
            for area, score in self.scores.items():
                misses = self.misses_counts.get(area, 0) if self.misses_counts else 0
                res += f"\n{area}: {score} ({misses} unanswered questions)"
            return res

    async def update_status(self, session, status: ExecutionStatus):
        """
        Update the assessment status and trigger appropriate side effects.

        If status is changed to 'completed', automatically schedules plan generation.
        """
        if not self.execution:
            logger.warning(
                f"Assessment {self.id} has no execution, cannot update status"
            )
            return self

        # Update the execution status
        self.execution.status = status
        session.add(self.execution)

        # If status is completed, schedule plan generation
        if status == ExecutionStatus.COMPLETED.value:
            logger.info(
                f"Assessment {self.id} marked as completed, scheduling plan generation"
            )
            await self.schedule_plan_generation(session)

        # Save changes
        session.add(self)
        await session.commit()
        await session.refresh(self)

        return self

    async def schedule_plan_generation(self, session) -> UUID:
        """
        Schedule the creation of a plan based on this assessment.
        Only works when assessment status is COMPLETED.
        """
        from app.crud.plan import create_plan, get_plan_by_client_id
        from app.models.models import Plan

        # Only create plan if assessment is completed
        if self.status != ExecutionStatus.COMPLETED.value:
            logger.warning(
                f"Cannot create plan for assessment {self.id} with status {self.status}"
            )
            return None

        # Check if plan already exists for this client_id
        existing_plan = await get_plan_by_client_id(session, self.client_id)

        if existing_plan:
            logger.info(f"Plan already exists for client {self.client_id}")
            return existing_plan.id

        # Create and schedule the plan
        logger.info(f"Creating new plan for client {self.client_id}")
        plan = Plan(client_id=self.client_id)
        plan = await create_plan(session, plan)
        await plan.schedule_initial_creation(session)

        return plan.id
