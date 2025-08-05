import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.db import AsyncSession, get_session
from app.crud.execution import get_execution_by_id
from app.models.execution import ExecutionStatus

from .base import ORMResponse

router = APIRouter()


class ExecutionResponse(ORMResponse):
    status: ExecutionStatus
    progress: int
    message: str | None = None


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def router_get_execution(
    execution_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    execution = await get_execution_by_id(session, execution_id)
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution
