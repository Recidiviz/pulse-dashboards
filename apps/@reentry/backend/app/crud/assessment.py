from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.assessment import Assessment
from app.models.assessment_tree import AssessmentTreeRevision


async def create_assessment(
    session: AsyncSession,
    assessment: Assessment,
):
    session.add(assessment)
    await session.commit()
    await session.refresh(assessment)
    return assessment


@overload
async def get_assessment_by_id(
    session: AsyncSession, assessment_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[Assessment]: ...


@overload
async def get_assessment_by_id(
    session: AsyncSession, assessment_id: UUID, *, query_only: Literal[False] = False
) -> Assessment | None: ...


@statement_or_result(first_only=True)
async def get_assessment_by_id(
    session: AsyncSession, assessment_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[Assessment] | Assessment | None:
    query = select(Assessment).where(Assessment.id == assessment_id)
    return query


@overload
async def get_assessments_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: Literal[True]
) -> SelectOfScalar[Assessment]: ...


@overload
async def get_assessments_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: Literal[False] = False
) -> list[Assessment]: ...


@statement_or_result(first_only=False)
async def get_assessments_by_client_pseudo_id(
    session: AsyncSession, client_pseudo_id: str, *, query_only: bool = False
) -> SelectOfScalar[Assessment] | list[Assessment]:
    query = select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    return query


@overload
async def get_assessments_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[Assessment]: ...


@overload
async def get_assessments_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[False] = False
) -> list[Assessment]: ...


@statement_or_result(first_only=False)
async def get_assessments_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[Assessment] | list[Assessment]:
    query = select(Assessment).where(Assessment.intake_id == intake_id)
    return query


async def update_assessment_with_tree_results(
    session: AsyncSession,
    assessment: Assessment,
    revisions: list[AssessmentTreeRevision],
    step_results: dict,
    score_results: dict,
    misses_results: dict,
) -> Assessment:
    """
    Update assessment with tree results and save to database.
    After updating assessment data, marks the assessment execution as completed
    which will trigger plan generation.
    """
    from app.models.execution import ExecutionStatus

    # Update assessment data
    assessment.assessment_trees_revisions.extend(revisions)
    assessment.scores = score_results
    assessment.runs_steps = step_results
    assessment.misses_counts = misses_results

    # Save the assessment data
    assessment = await create_assessment(session, assessment)

    # Mark assessment execution as completed which will trigger plan generation
    await assessment.update_status(session, ExecutionStatus.COMPLETED)

    return assessment
