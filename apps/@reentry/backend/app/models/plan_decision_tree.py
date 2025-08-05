from typing import Optional
from uuid import UUID

from pydantic import (
    ConfigDict,
    computed_field,
    field_serializer,
)
from sqlalchemy.orm import Mapped
from sqlmodel import JSON, Field, Relationship, UniqueConstraint

from app.utils.decision_tree_runner import Annotation, DecisionTreeRunnerStep

from .base import BaseModel
from .decision_tree import DecisionTree
from .execution import Execution, ExecutionStatus


class PlanDecisionTree(BaseModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "plan_id", "decision_tree_id", name="unique_plan_decision_tree"
        ),
    )

    plan_id: UUID = Field(foreign_key="plan.id", ondelete="CASCADE")
    plan: Mapped[Optional["Plan"]] = Relationship(back_populates="decision_trees")

    decision_tree_id: UUID | None = Field(
        foreign_key="decisiontree.id", ondelete="SET NULL", nullable=True
    )
    decision_tree: Mapped[Optional[DecisionTree]] = Relationship()

    # populated by the LLM about why it has been selected
    annotations: list[Annotation] | None = Field(
        sa_type=JSON, nullable=True, default=None
    )

    #
    # Execution status and output
    #
    execution_id: UUID | None = Field(
        foreign_key="execution.id",
        ondelete="SET NULL",
        nullable=True,
        default=None,
    )
    execution: Mapped[Optional[Execution]] = Relationship(
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    #
    # populated by the DecisionTreeRunner after the execution
    #
    run_statements: list[str] | None = Field(sa_type=JSON, nullable=True, default=None)
    run_steps: list[DecisionTreeRunnerStep] | None = Field(
        sa_type=JSON, nullable=True, default=None
    )

    @computed_field
    def status(self) -> str:
        return str(
            self.execution.status
            if self.execution
            else ExecutionStatus.NOT_STARTED.value
        )

    @computed_field(alias="decision_tree")
    def ser_decision_tree(self) -> DecisionTree | None:
        # XXX another issue with SQLModel, it does not serialize relationship
        # so we need to manually serialize it, and don't forgot to use
        # by_alias=True in model_dump()
        return self.decision_tree

    @computed_field(alias="execution")
    def ser_execution(self) -> Execution | None:
        return self.execution

    #
    # Note: It seems SQLModel does not return Pydantic related model for list[]
    # Issue encountered: Expected DecisionTreeRunnerStep but received dict with value
    # {'node_key': 'A', 'node_v...t', 'annotations': None} - serialized value may not be as expected
    #

    @field_serializer("run_steps")
    def ensure_run_steps_type(self, value):
        if (
            value
            and isinstance(value, list)
            and not isinstance(value[0], DecisionTreeRunnerStep)
        ):
            return [DecisionTreeRunnerStep.model_validate(step) for step in value]
        return value

    @field_serializer("annotations")
    def ensure_annotations_type(cls, value):
        if value and isinstance(value, list) and not isinstance(value[0], Annotation):
            return [Annotation.model_validate(annotation) for annotation in value]
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
        Schedule the execution of the plan generation.
        """
        from app.tasks.plan_decision_tree import plan_decision_tree_run_task
        from app.tasks.scheduler import schedule_task

        # prevent execution to be scheduled twice
        if self.execution and not self.is_execution_finished:
            return self.execution

        execution = await schedule_task(
            session,
            table_name="plandecisiontrees",
            table_entity_id=self.id,
            task_func=plan_decision_tree_run_task,
            task_kwargs={"plan_decision_tree_id": self.id},
        )

        self.execution = execution
        self.execution_id = execution.id
        session.add(self)
        await session.commit()
        return execution
