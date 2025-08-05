import asyncio
from enum import StrEnum
from time import monotonic
from uuid import UUID

import structlog
from sqlalchemy import Enum as SAEnum
from sqlmodel import JSON, Column, Field

from .base import BaseModel


class ExecutionStatus(StrEnum):
    NOT_STARTED = "not_started"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Execution(BaseModel, table=True):
    status: ExecutionStatus = Field(
        default=ExecutionStatus.NOT_STARTED,
        sa_column=Column(
            SAEnum(
                ExecutionStatus,
                name="execution_status_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
            default=ExecutionStatus.NOT_STARTED,
        ),
    )

    message: str | None = None
    progress: int = 0
    task_id: str | None = None
    table_name: str | None
    table_entity_id: UUID | None
    output: dict | None = Field(sa_type=JSON)

    async def wait(self, session, timeout: int, poll=1) -> bool:
        from app.core.db import get_session_async_manager
        from app.crud.execution import get_execution_by_id
        # XXX didn't find a way with TaskIQ recreate the Task object from the id
        # and wait from there. So we poll the DB instead...
        # We force to have a timeout to ensure tasks is not going to run forever

        deadline = monotonic() + timeout
        while deadline - monotonic() > 0:
            # since it's transactional, you cannot check the status of the execution
            # in the same transaction that created it. So we need to create a new session
            async with get_session_async_manager() as session2:
                execution = await get_execution_by_id(session2, self.id)
                print(f"waiting for execution {self.id} status {self.status}")
                if execution.status in (
                    ExecutionStatus.COMPLETED,
                    ExecutionStatus.FAILED,
                ):
                    return True

            await asyncio.sleep(poll)

        return False

    async def log_progress(
        self,
        session,
        progress: int,
        message: str,
        logger: structlog.BoundLogger | None = None,
    ):
        """
        Log the progress of the execution and update the DB.
        """
        self.progress = progress
        self.message = message
        session.add(self)
        await session.commit()
        await session.refresh(self)
        if logger:
            logger.info(message, progress=progress)

    @property
    def is_completed(self):
        return self.status == ExecutionStatus.COMPLETED

    @property
    def is_failed(self):
        return self.status == ExecutionStatus.FAILED
