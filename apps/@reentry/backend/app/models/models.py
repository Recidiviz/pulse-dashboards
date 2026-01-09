from datetime import datetime
from enum import StrEnum
from json import loads
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import computed_field
from sqlalchemy.orm import Mapped
from sqlmodel import JSON, Field, Relationship

from app.models.intake import Intake

from ..utils.config_loader import ConfigLoader
from .base import BaseModel
from .execution import Execution, ExecutionStatus
from .plan_decision_tree import PlanDecisionTree


class PlanGenerationStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationType(StrEnum):
    AUTOMATED = "automated"
    MANUAL = "manual"


class PlanType(StrEnum):
    EVALUATION = "evaluation"
    LIVE = "live"


class Plan(BaseModel, table=True):
    client_pseudo_id: Optional[str]
    client_id: Optional[str] = None
    # Relationship to intake
    intake_id: UUID | None = Field(
        foreign_key="intake.id",
        nullable=True,
        default=None,
    )
    intake: Mapped[Optional[Intake]] = Relationship(
        back_populates="plan", sa_relationship_kwargs={"lazy": "selectin"}
    )
    result_gen_id: Optional[int] = None
    assets: Mapped[List["PlanAsset"]] = Relationship(
        back_populates="plan", cascade_delete=True
    )
    generations: Mapped[List["PlanGeneration"]] = Relationship(
        back_populates="plan",
        cascade_delete=True,
    )
    decision_trees: Mapped[List[PlanDecisionTree]] = Relationship(
        back_populates="plan",
        cascade_delete=True,
    )
    create_execution_id: Optional[UUID] = Field(
        foreign_key="execution.id", nullable=True
    )
    create_execution: Mapped[Optional[Execution]] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    # TODO: This column is not used and can be removed.
    client_extracted_info: Dict | None = Field(
        sa_type=JSON, nullable=True, default=None
    )

    edited_manually: bool = Field(
        default=False,
        sa_column_kwargs={"server_default": "false"},
    )

    #
    # Execution
    #

    @property
    def is_create_execution_finished(self) -> bool:
        return self.create_status in ("completed", "failed")

    async def get_action_plan_config(self, session):
        action_plan_config = await ConfigLoader.load_plan_config(
            self.intake.assessment_config_id, session
        )
        return action_plan_config

    async def schedule_initial_creation(self, session) -> Execution:
        """
        Schedule the initial creation of the plan.
        (download assets, select and execution decision trees, and action plan)
        """
        from app.tasks.plan_create import plan_create_task
        from app.tasks.scheduler import schedule_task

        if self.create_execution:
            return self.execution

        execution = await schedule_task(
            session,
            table_name="plan",
            table_entity_id=self.id,
            task_func=plan_create_task,
            task_kwargs={"plan_id": self.id},
        )

        self.create_execution = execution
        self.create_execution_id = execution.id
        session.add(self)
        await session.commit()
        await session.refresh(self)
        return execution

    async def schedule_plan_decision_tree_select(self, session) -> Execution:
        """
        Schedule the selection of the decision tree for the plan.
        """
        from app.tasks.plan_decision_tree import plan_decision_tree_select_task
        from app.tasks.scheduler import schedule_task

        return await schedule_task(
            session,
            table_name="plan:decisiontrees-populate",
            table_entity_id=self.id,
            task_func=plan_decision_tree_select_task,
            task_kwargs={"plan_id": self.id},
        )

    @computed_field
    def create_status(self) -> str:
        return str(
            self.create_execution.status
            if self.create_execution
            else ExecutionStatus.NOT_STARTED.value
        )

    @computed_field(alias="create_execution")
    def ser_create_execution(self) -> Execution | None:
        return self.create_execution

    async def get_latest_generation(self, session) -> Optional["PlanGeneration"]:
        """
        Get the latest generation for the plan.
        """
        from app.crud.plan_generation import get_gen_by_plan_id

        gens = await get_gen_by_plan_id(session, self.id)
        gens = [gen for gen in gens if gen.status == PlanGenerationStatus.COMPLETED]
        gens = sorted(gens, key=lambda x: x.finished_at, reverse=True)
        return gens[0] if gens else None


class PlanAsset(BaseModel, table=True):
    plan_id: UUID = Field(foreign_key="plan.id")
    filename: str
    file_blob: bytes = Field(nullable=False)
    mimetype: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    plan: Mapped[Optional[Plan]] = Relationship(back_populates="assets")

    def data_as_json(self):
        return loads(self.file_blob.decode("utf-8"))

    def data_as_text(self):
        return self.file_blob.decode("utf-8")


class PlanGeneration(BaseModel, table=True):
    plan_id: UUID = Field(foreign_key="plan.id")
    plan: Mapped[Optional[Plan]] = Relationship(back_populates="generations")

    prompt: Optional[str] = None
    resource_to_remove_id: Optional[str] = None
    resource_to_add_content: Optional[Dict] = Field(
        sa_type=JSON, nullable=True, default=None
    )
    markdown_result: Optional[str] = None
    finished_at: Optional[datetime] = None
    gen_type: str = Field(default=GenerationType.AUTOMATED)

    # actual internal generation data
    gen_data_json: Optional[str] = None

    # if set, it would prefer a generation than edit/regeneration
    force_generation: Optional[bool] = None

    regeneration_notify: Optional[bool] = None
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

    @computed_field
    def status(self) -> str:
        if self.gen_type == GenerationType.MANUAL:
            return PlanGenerationStatus.COMPLETED.value
        return str(
            self.execution.status
            if self.execution
            else ExecutionStatus.NOT_STARTED.value
        )

    @property
    def is_execution_finished(self) -> bool:
        return self.status in ("completed", "failed")

    def set_regeneration_notify(self, state: bool) -> bool:
        self.regeneration_notify = state
        return self.regeneration_notify

    async def schedule_execution(self, session) -> Execution:
        """
        Schedule the execution of the plan generation.
        """
        from app.tasks.action_plan import generate_action_plan_task
        from app.tasks.scheduler import schedule_task

        # prevent execution to be scheduled twice
        if self.execution and not self.is_execution_finished:
            return self.execution

        execution = await schedule_task(
            session,
            table_name="plan:generate",
            table_entity_id=self.id,
            task_func=generate_action_plan_task,
            task_kwargs={"gen_id": self.id},
        )

        self.execution = execution
        self.execution_id = execution.id
        session.add(self)
        await session.commit()
        await session.refresh(self)
        return execution
