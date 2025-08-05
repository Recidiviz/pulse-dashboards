"""
Task scheduler
==============

This module provides functionality for scheduling asynchronous tasks and
managing their execution lifecycle. It includes functions to schedule a
task, manage execution statuses, and handle database operations related
to task executions.
"""

import os
import uuid
from contextlib import asynccontextmanager

import structlog
from taskiq.task import AsyncTaskiqTask

from app.core.db import AsyncSession
from app.crud.execution import get_execution_by_id, update_execution, upsert_execution
from app.models.execution import Execution, ExecutionStatus

logger = structlog.get_logger(__name__)


async def schedule_task(
    session: AsyncSession,
    table_name: str,
    table_entity_id: uuid.UUID,
    task_func: AsyncTaskiqTask,
    task_kwargs: dict,
) -> Execution:
    """
    Schedules a task for execution.

    This function creates a new execution entry in the database
    with a PENDING status, executes the provided task function with
    given arguments, and then updates the execution record with the
    generated task ID.

    Returns an Execution object representing the scheduled task.
    """
    execution = Execution(
        status=ExecutionStatus.PENDING,
        table_name=table_name,
        table_entity_id=table_entity_id,
    )
    await upsert_execution(session, execution)

    task_kwargs["execution_id"] = execution.id
    task = await task_func.kiq(**task_kwargs)

    execution.task_id = str(task.task_id)
    await upsert_execution(session, execution)

    # in pytest mode, we sync for execution
    ENVIRONMENT = os.environ.get("ENVIRONMENT")
    if ENVIRONMENT == "pytest":
        await task.wait_result()

    return execution


@asynccontextmanager
async def execution_context(session: AsyncSession, execution_id: uuid.UUID):
    """
    Provides an asynchronous execution context for a given execution ID.

    This context manager is responsible for managing the lifecycle of an
    execution by updating its status in the database. When the context is
    entered, the execution status is set to IN_PROGRESS. If the execution
    completes without exceptions, the status is updated to COMPLETED with
    a progress of 100. If an exception occurs, the status is set to FAILED,
    and the exception message is stored.
    """
    if not execution_id:
        raise ValueError("execution_id is required")

    execution = await get_execution_by_id(session, execution_id)
    if not execution:
        raise ValueError(f"Execution with id {execution_id} not found")

    try:
        logger.info(f"Starting execution of {execution_id}", execution_id=execution_id)
        await update_execution(
            session,
            execution,
            status=ExecutionStatus.IN_PROGRESS,
        )
        yield execution
        logger.info(f"Execution of {execution_id} completed", execution_id=execution_id)
        await update_execution(
            session,
            execution,
            progress=100,
            message="Execution completed",
            status=ExecutionStatus.COMPLETED,
        )
    except Exception as e:
        logger.exception(
            f"Error during the execution of {execution_id}", execution_id=execution_id
        )
        await update_execution(
            session,
            execution,
            status=ExecutionStatus.FAILED,
            message=str(e),
        )
        raise e
    finally:
        await session.close()
