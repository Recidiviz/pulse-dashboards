"""
Utility functions for database row-level locking.
"""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import DBAPIError
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.intake import Intake


async def acquire_intake_lock(session: AsyncSession, intake_id: UUID) -> Intake:
    """
    Acquire a row-level lock on an intake to prevent race conditions.

    Uses PostgreSQL's SELECT FOR UPDATE NOWAIT to acquire an exclusive lock
    on the intake row. If another transaction already holds a lock on this row,
    raises a 409 Conflict error immediately instead of waiting.

    Args:
        session: The database session
        intake_id: The UUID of the intake to lock

    Returns:
        The locked Intake object

    Raises:
        HTTPException(404): If the intake is not found
        HTTPException(409): If another transaction holds a lock on this intake
    """
    try:
        stmt = select(Intake).where(Intake.id == intake_id).with_for_update(nowait=True)
        result = await session.execute(stmt)
        intake = result.scalar_one_or_none()
        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")
        return intake
    except DBAPIError as e:
        # Handle LockNotAvailableError - another operation is in progress
        if "LockNotAvailableError" in str(e) or "could not obtain lock" in str(e):
            raise HTTPException(
                status_code=409,
                detail="A retry operation is already in progress for this intake",
            )
        raise
