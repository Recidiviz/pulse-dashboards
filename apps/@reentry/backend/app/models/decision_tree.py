"""
# Decision Tree Models

## Internal notes

The definition of theses models was hard due to the youngness of SQLModel
and the lack of documentation.

1. Trying to define Field(foreign_key=) only for current_revision_id

    sqlalchemy.exc.CircularDependencyError: Can't sort tables for
    DROP; an unresolvable foreign key dependency exists between tables:
    decisiontree, decisiontreerevision.  Please ensure that the ForeignKey
    and ForeignKeyConstraint objects involved in the cycle have names so
    that they can be dropped using DROP CONSTRAINT.

    And SQLModel does not allow to pass kwargs argument to ForeignKey.
    (`sa_column_kwargs` does not work directly with ForeignKey.)

2. Unable to have multiple join path

    Initially, i wanted a DecisionTree with a link to the current revision
    and a list of all revisions attached to the model

    So:
        DecisionTree.revisions: list[DecisionTreeRevision]
        DecisionTree.current_revision: DecisionTreeRevision

    But it was not possible to define the relationship with the current_revision_id
    and the DecisionTreeRevision model at the same time, without having
    a circular dependency error, which i have not be able to overcome,
    despite many approaches, even with direct sqlalchemy, or NoForeignKeysError..

    After more than a day on the issue, i ended up with having a @property instead.
    for current_revision.

3. Access to DecisionTree.revisions with async code will fail.

    https://github.com/fastapi/sqlmodel/issues/74

    The issue is that the relationship is not properly defined for async code.
    The solution is to use `lazy="selectin"` to avoid the issue, but it meant
    it will load all the revisions at once, which is not optimal.

    So the idea is to have CRUD not loading revision of a decision tree, unless asked.

"""

from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship

from .base import BaseModel


class DecisionTree(BaseModel, table=True):
    name: str = Field(nullable=False, unique=True, index=True)
    criterias: str | None = Field(nullable=True)
    enabled: bool = Field(default=False, nullable=False)

    current_revision_id: UUID | None = Field(
        sa_column=ForeignKey(
            "decisiontreerevision.id",
            name="fk_decision_tree_current_revision_id",
            use_alter=True,
            ondelete="SET NULL",
            nullable=True,
        ),
    )

    revisions: Mapped[list["DecisionTreeRevision"]] = Relationship(
        back_populates="decision_tree",
        cascade_delete=True,
    )


class DecisionTreeRevision(BaseModel, table=True):
    decision_tree_id: UUID = Field(
        foreign_key="decisiontree.id",
        ondelete="CASCADE",
    )
    decision_tree: Mapped[DecisionTree] = Relationship(back_populates="revisions")
    mermaid_content: str = Field(nullable=False)
    notes: str = Field(nullable=False)
    content_hash: str | None = Field(nullable=True)
