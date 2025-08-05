from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.crud.assessment import get_assessment_by_id, get_assessments_by_client_id
from app.routes.shared_models import AssessmentResponse

router = APIRouter()


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
    summary="Get assessment by ID",
    description="Returns a specific assessment by its ID",
    tags=["Assessments"],
)
async def get_assessment(
    assessment_id: UUID, session: AsyncSession = Depends(get_session)
):
    assessment = await get_assessment_by_id(session, assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return assessment


@router.get(
    "/clients/{client_id}",
    response_model=List[AssessmentResponse],
    summary="Get assessments by client ID",
    description="Returns all assessments associated with a client ID",
    tags=["Assessments"],
)
async def get_client_assessments(
    client_id: str, session: AsyncSession = Depends(get_session)
):
    assessments = await get_assessments_by_client_id(session, client_id)

    if not assessments:
        return []

    return assessments
