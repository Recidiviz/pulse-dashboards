from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.crud.assessment import (
    get_assessment_by_id,
    get_assessments_by_intake_id,
)
from app.routes.shared_models import AssessmentResponse

router = APIRouter()


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
    summary="Get assessment by ID",
    description="Returns a specific assessment by its ID",
    tags=["Risk scoring results"],
)
async def get_assessment(
    assessment_id: UUID, session: AsyncSession = Depends(get_session)
):
    assessment = await get_assessment_by_id(session, assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return assessment


@router.get(
    "/intakes/{intake_id}",
    response_model=List[AssessmentResponse],
    summary="Get assessments by intake ID",
    description="Returns all assessments associated with an intake ID",
    tags=["Risk scoring results"],
)
async def get_intake_assessments(
    intake_id: UUID, session: AsyncSession = Depends(get_session)
):
    assessments = await get_assessments_by_intake_id(session, intake_id)

    if not assessments:
        return []

    return assessments
