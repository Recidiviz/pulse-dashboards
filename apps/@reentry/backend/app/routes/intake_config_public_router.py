import logging
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.db import get_session
from app.utils.config_loader import ConfigLoader

logger = logging.getLogger(__name__)

router = APIRouter()


class ConversationStateCodesResponse(BaseModel):
    state_codes: List[str]


@router.get(
    "/conversation-states",
    summary="Get state codes with active conversation intake assessments",
    description="Returns all state codes that have active AssessmentConfigs with conversation intake type",
    tags=["Public intake endpoints"],
    response_model=ConversationStateCodesResponse,
)
async def get_conversation_state_codes(session=Depends(get_session)):
    """Get all state codes that have active conversation intake assessments."""
    state_codes = await ConfigLoader.get_conversation_intake_state_codes(session)
    return ConversationStateCodesResponse(state_codes=state_codes)
