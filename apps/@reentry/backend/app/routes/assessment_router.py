from typing import List
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.crud.assessment import (
    get_assessment_by_id,
    get_assessments_by_intake_id,
)
from app.routes.shared_models import AssessmentResponse
from app.crud.intake import get_intake_by_id

router = APIRouter()

logger = structlog.get_logger(__name__)

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
    
    intake = await get_intake_by_id(session, intake_id)
    if intake and intake.client_pseudo_id:
        structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    else: 
        logger.error(f"Couldn't find client_pseudo_id from the intake. intake_id: {intake_id}")
    
    assessments = await get_assessments_by_intake_id(session, intake_id)

    if not assessments:
        return []

    return assessments
