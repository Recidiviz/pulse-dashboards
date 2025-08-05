from typing import Literal, overload
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.models.assessment_tree import AssessmentTree, AssessmentTreeRevision
from app.utils.content_hash import compute_content_hash

from .utils import statement_or_result


@overload
async def get_assessment_trees(
    session: AsyncSession,
    assessment_type: str | None = None,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[AssessmentTree]: ...


@overload
async def get_assessment_trees(
    session: AsyncSession,
    assessment_type: str | None = None,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: Literal[False] = False,
) -> list[AssessmentTree]: ...


@statement_or_result(result_type=list)
async def get_assessment_trees(
    session: AsyncSession,
    assessment_type: str | None = None,
    include_revisions=False,
    filter_enabled: bool | None = None,
    *,
    query_only: bool = False,
) -> SelectOfScalar[AssessmentTree] | list[AssessmentTree]:
    query = select(AssessmentTree)
    if assessment_type:
        query = query.where(AssessmentTree.assessment_type == assessment_type)
    if include_revisions:
        query = query.options(selectinload(AssessmentTree.revisions))
    if filter_enabled is not None:
        query = query.where(AssessmentTree.enabled == filter_enabled)
    return query


@overload
async def get_assessment_tree_by_id(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentTree]: ...


@overload
async def get_assessment_tree_by_id(
    session: AsyncSession,
    assessment_tree_id: UUID,
    *,
    query_only: Literal[False] = False,
) -> AssessmentTree | None: ...


@statement_or_result(first_only=True)
async def get_assessment_tree_by_id(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AssessmentTree] | AssessmentTree | None:
    return (
        select(AssessmentTree)
        .options(selectinload(AssessmentTree.revisions))
        .where(AssessmentTree.id == assessment_tree_id)
    )


@overload
async def get_assessment_tree_by_name(
    session: AsyncSession, name: str, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentTree]: ...


@overload
async def get_assessment_tree_by_name(
    session: AsyncSession, name: str, *, query_only: Literal[False] = False
) -> AssessmentTree | None: ...


@statement_or_result(first_only=True)
async def get_assessment_tree_by_name(
    session: AsyncSession, name: str, *, query_only: bool = False
) -> SelectOfScalar[AssessmentTree] | AssessmentTree | None:
    return select(AssessmentTree).where(AssessmentTree.name == name)


async def upsert_assessment_tree(
    session: AsyncSession, assessment_tree: AssessmentTree
):
    session.add(assessment_tree)
    await session.commit()
    await session.refresh(assessment_tree)


async def delete_assessment_tree(
    session: AsyncSession, assessment_tree: AssessmentTree
):
    await session.delete(assessment_tree)
    await session.commit()


@overload
async def get_assessment_tree_revisions(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentTreeRevision]: ...


@overload
async def get_assessment_tree_revisions(
    session: AsyncSession,
    assessment_tree_id: UUID,
    *,
    query_only: Literal[False] = False,
) -> list[AssessmentTreeRevision]: ...


@statement_or_result(result_type=list)
async def get_assessment_tree_revisions(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AssessmentTreeRevision] | list[AssessmentTreeRevision]:
    return select(AssessmentTreeRevision).where(
        AssessmentTreeRevision.assessment_tree_id == assessment_tree_id
    )


async def add_assessment_tree_revision(
    session: AsyncSession,
    assessment_tree: AssessmentTree,
    revision: AssessmentTreeRevision,
):
    revision.assessment_tree_id = assessment_tree.id
    assessment_tree.current_revision_id = revision.id
    session.add(revision)
    session.add(assessment_tree)
    await session.commit()
    await session.refresh(revision)
    await session.refresh(assessment_tree)


@overload
async def get_assessment_tree_revision_by_id(
    session: AsyncSession,
    assessment_tree_revision_id: UUID,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[AssessmentTreeRevision]: ...


@overload
async def get_assessment_tree_revision_by_id(
    session: AsyncSession,
    assessment_tree_revision_id: UUID,
    *,
    query_only: Literal[False] = False,
) -> AssessmentTreeRevision | None: ...


@statement_or_result(first_only=True)
async def get_assessment_tree_revision_by_id(
    session: AsyncSession,
    assessment_tree_revision_id: UUID,
    *,
    query_only: bool = False,
) -> SelectOfScalar[AssessmentTreeRevision] | AssessmentTreeRevision | None:
    return select(AssessmentTreeRevision).where(
        AssessmentTreeRevision.id == assessment_tree_revision_id
    )


@overload
async def get_latest_assessment_tree_revision(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AssessmentTreeRevision]: ...


@overload
async def get_latest_assessment_tree_revision(
    session: AsyncSession,
    assessment_tree_id: UUID,
    *,
    query_only: Literal[False] = False,
) -> AssessmentTreeRevision | None: ...


@statement_or_result(first_only=True)
async def get_latest_assessment_tree_revision(
    session: AsyncSession, assessment_tree_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AssessmentTreeRevision] | AssessmentTreeRevision | None:
    """Get the latest revision for an assessment tree, ordered by creation date."""
    return (
        select(AssessmentTreeRevision)
        .where(AssessmentTreeRevision.assessment_tree_id == assessment_tree_id)
        .order_by(AssessmentTreeRevision.created_at.desc())
    )


async def content_has_changed(
    session: AsyncSession,
    assessment_tree_id: UUID,
    mermaid_content: str,
    additional_structured_data: dict = None,
) -> bool:
    """
    Check if the content has changed compared to the latest revision.

    Returns True if content has changed or no revisions exist.
    """
    latest_revision = await get_latest_assessment_tree_revision(
        session, assessment_tree_id
    )

    if latest_revision is None:
        return True

    new_hash = compute_content_hash(mermaid_content, additional_structured_data)
    return latest_revision.content_hash != new_hash


async def add_assessment_tree_revision_with_hash(
    session: AsyncSession,
    assessment_tree: AssessmentTree,
    mermaid_content: str,
    additional_structured_data: dict = None,
    input_data: list = None,
):
    """
    Add a new revision with computed content hash.
    Only creates revision if content has actually changed.
    """
    content_hash = compute_content_hash(mermaid_content, additional_structured_data)

    # Check if content has changed
    has_changed = await content_has_changed(
        session, assessment_tree.id, mermaid_content, additional_structured_data
    )

    if not has_changed:
        print(
            f"Assessment tree {assessment_tree.name} content unchanged, skipping revision"
        )
        return None

    revision = AssessmentTreeRevision(
        mermaid_content=mermaid_content,
        additional_structured_data=additional_structured_data,
        content_hash=content_hash,
        input_data=input_data or [],
    )

    await add_assessment_tree_revision(session, assessment_tree, revision)
    return revision
