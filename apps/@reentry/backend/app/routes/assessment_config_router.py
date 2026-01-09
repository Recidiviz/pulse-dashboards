from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.crud.assessment_config import get_active_assessment_configs_by_state
from app.crud.intake import get_intake_by_id
from app.crud.plan import get_plan_by_id
from app.routes.shared_models import AssessmentConfigOutput, AssessmentConfigResponse
from app.utils.config_loader import ConfigLoader

router = APIRouter()


@router.get(
    "",
    response_model=List[AssessmentConfigResponse],
    summary="List available assessment configurations",
    description="Returns all active assessment configurations for a given state",
    tags=["Assessment Configs"],
)
async def list_assessment_configs(
    state_code: str = Query(..., description="State code (e.g., 'US_UT')"),
    session: AsyncSession = Depends(get_session),
):
    """
    List all active assessment configurations for a state.

    Returns assessment configs that case managers can choose from when creating
    a new intake for a client.
    """
    configs = await get_active_assessment_configs_by_state(session, state_code)

    if not configs:
        return []

    return configs


@router.get(
    "/outputs/{plan_id}",
    response_model=AssessmentConfigOutput,
    summary="Get assessment configuration output by intake ID",
    description="Returns the assessment configuration associated with a specific intake ID",
    tags=["Assessment Configs"],
)
async def get_assessment_config_by_intake_id(
    plan_id: UUID, session: AsyncSession = Depends(get_session)
):
    plan = await get_plan_by_id(session, plan_id)

    if not plan:
        return HTTPException(status_code=404, detail="Plan not found")

    intake = await get_intake_by_id(session, plan.intake_id)

    if not intake:
        return HTTPException(status_code=404, detail="Intake not found")

    assessment_config = intake.assessment_config
    if not assessment_config:
        return HTTPException(
            status_code=404, detail="Assessment config not found for intake"
        )

    plan_config = await ConfigLoader.load_plan_config(
        intake.assessment_config_id, session
    )

    summary_config = await ConfigLoader.load_summary_config(
        intake.assessment_config_id, session
    )

    return AssessmentConfigOutput(
        id=intake.assessment_config.id,
        created_at=intake.assessment_config.created_at,
        updated_at=intake.assessment_config.updated_at,
        code=intake.assessment_config.code,
        version=intake.assessment_config.version,
        display_name=intake.assessment_config.display_name,
        description=intake.assessment_config.description,
        state_code=intake.assessment_config.state_code,
        outputs_action_plan_activated=plan_config is not None,
        outputs_summary_activated=summary_config is not None,
    )
