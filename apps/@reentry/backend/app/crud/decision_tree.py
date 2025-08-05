from typing import Literal, overload
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.models.decision_tree import DecisionTree, DecisionTreeRevision
from app.utils.content_hash import compute_content_hash

from .utils import statement_or_result


@overload
async def get_decision_trees(
    session: AsyncSession,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[DecisionTree]: ...


@overload
async def get_decision_trees(
    session: AsyncSession,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: Literal[False] = False,
) -> list[DecisionTree]: ...


@statement_or_result(result_type=list)
async def get_decision_trees(
    session: AsyncSession,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: bool = False,
) -> SelectOfScalar[DecisionTree] | list[DecisionTree]:
    query = select(DecisionTree)
    if include_revisions:
        query = query.options(selectinload(DecisionTree.revisions))
    if filter_enabled is not None:
        query = query.where(DecisionTree.enabled == filter_enabled)
    return query


@overload
async def get_decision_tree_by_id(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[DecisionTree]: ...


@overload
async def get_decision_tree_by_id(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[False] = False
) -> DecisionTree | None: ...


@statement_or_result(first_only=True)
async def get_decision_tree_by_id(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[DecisionTree] | DecisionTree | None:
    return (
        select(DecisionTree)
        .options(selectinload(DecisionTree.revisions))
        .where(DecisionTree.id == decision_tree_id)
    )


@overload
async def get_decision_tree_by_name(
    session: AsyncSession, name: str, *, query_only: Literal[True]
) -> SelectOfScalar[DecisionTree]: ...


@overload
async def get_decision_tree_by_name(
    session: AsyncSession, name: str, *, query_only: Literal[False] = False
) -> DecisionTree | None: ...


@statement_or_result(first_only=True)
async def get_decision_tree_by_name(
    session: AsyncSession, name: str, *, query_only: bool = False
) -> SelectOfScalar[DecisionTree] | DecisionTree | None:
    return select(DecisionTree).where(DecisionTree.name == name)


async def upsert_decision_tree(session: AsyncSession, decision_tree: DecisionTree):
    session.add(decision_tree)
    await session.commit()
    await session.refresh(decision_tree)


async def delete_decision_tree(session: AsyncSession, decision_tree: DecisionTree):
    await session.delete(decision_tree)
    await session.commit()


@overload
async def get_decision_tree_revisions(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[DecisionTreeRevision]: ...


@overload
async def get_decision_tree_revisions(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[False] = False
) -> list[DecisionTreeRevision]: ...


@statement_or_result(result_type=list)
async def get_decision_tree_revisions(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[DecisionTreeRevision] | list[DecisionTreeRevision]:
    return select(DecisionTreeRevision).where(
        DecisionTreeRevision.decision_tree_id == decision_tree_id
    )


async def add_decision_tree_revision(
    session: AsyncSession,
    decision_tree: DecisionTree,
    revision: DecisionTreeRevision,
):
    revision.decision_tree_id = decision_tree.id
    decision_tree.current_revision_id = revision.id
    session.add(revision)
    session.add(decision_tree)
    await session.commit()
    await session.refresh(revision)
    await session.refresh(decision_tree)


@overload
async def get_decision_tree_revision_by_id(
    session: AsyncSession, decision_tree_revision_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[DecisionTreeRevision]: ...


@overload
async def get_decision_tree_revision_by_id(
    session: AsyncSession,
    decision_tree_revision_id: UUID,
    *,
    query_only: Literal[False] = False,
) -> DecisionTreeRevision | None: ...


@statement_or_result(first_only=True)
async def get_decision_tree_revision_by_id(
    session: AsyncSession, decision_tree_revision_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[DecisionTreeRevision] | DecisionTreeRevision | None:
    return select(DecisionTreeRevision).where(
        DecisionTreeRevision.id == decision_tree_revision_id
    )


@overload
async def get_latest_decision_tree_revision(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[DecisionTreeRevision]: ...


@overload
async def get_latest_decision_tree_revision(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: Literal[False] = False
) -> DecisionTreeRevision | None: ...


@statement_or_result(first_only=True)
async def get_latest_decision_tree_revision(
    session: AsyncSession, decision_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[DecisionTreeRevision] | DecisionTreeRevision | None:
    """Get the latest revision for a decision tree, ordered by creation date."""
    return (
        select(DecisionTreeRevision)
        .where(DecisionTreeRevision.decision_tree_id == decision_tree_id)
        .order_by(DecisionTreeRevision.created_at.desc())
    )


async def decision_tree_content_has_changed(
    session: AsyncSession,
    decision_tree_id: UUID,
    mermaid_content: str,
    notes: str,
) -> bool:
    """
    Check if the content has changed compared to the latest revision.

    Returns True if content has changed or no revisions exist.
    """
    latest_revision = await get_latest_decision_tree_revision(session, decision_tree_id)

    if latest_revision is None:
        return True

    new_hash = compute_content_hash(mermaid_content, notes)
    return latest_revision.content_hash != new_hash


async def add_decision_tree_revision_with_hash(
    session: AsyncSession,
    decision_tree: DecisionTree,
    mermaid_content: str,
    notes: str,
):
    """
    Add a new revision with computed content hash.
    Only creates revision if content has actually changed.
    """
    content_hash = compute_content_hash(mermaid_content, notes)

    # Check if content has changed
    has_changed = await decision_tree_content_has_changed(
        session, decision_tree.id, mermaid_content, notes
    )

    if not has_changed:
        print(
            f"Decision tree {decision_tree.name} content unchanged, skipping revision"
        )
        return None

    revision = DecisionTreeRevision(
        mermaid_content=mermaid_content, notes=notes, content_hash=content_hash
    )

    await add_decision_tree_revision(session, decision_tree, revision)
    return revision
