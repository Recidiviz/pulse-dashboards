"""
Re-enqueue pending executions
=============================
!!!! Destructive !!!! Only run once

This command fetches all plans from a given date, deletes them and enqueues them again.
"""

from datetime import datetime

import structlog
from sqlalchemy.orm import make_transient
from sqlmodel import select

from app.core.db import get_session_async_manager
from app.crud.plan import create_plan, delete_plan_by_id
from app.models.models import Plan, PlanType

from .base import cli

logger = structlog.get_logger(__name__)

# 7/31
START_DATE = datetime(2025, 7, 31)


@cli.command()
async def retry_plan_gens_date():
    """
    Fetch all plans created after the start date, delete them, and enqueue new processing.
    """
    async with get_session_async_manager() as session:
        # Fetch all plans created after the START_DATE
        plans = await session.exec(select(Plan).where(Plan.created_at > START_DATE))
        plans = list(plans)

        if not plans:
            logger.info("No plans found after the start date", start_date=START_DATE)
            return

        for plan in plans:
            logger.info("Processing plan", plan_id=plan.id, client_id=plan.client_id)

            make_transient(plan)

            # Delete the existing plan
            await delete_plan_by_id(session, plan.id)
            logger.info("Deleted plan", plan_id=plan.id)

            # Create a new plan generation
            new_plan = Plan(client_id=plan.client_id, type=PlanType.LIVE)
            new_plan = await create_plan(session, new_plan)
            # here is the error, should have been new_plan.schedule...
            await plan.schedule_initial_creation(session)

        logger.info("Retry process completed", total_plans=len(plans))


@cli.command()
async def retry_plan_gens():
    """
    Fetch all plans created after the start date, delete them, and enqueue new processing.
    """
    async with get_session_async_manager() as session:
        plans = await session.exec(
            select(Plan).where(Plan.create_execution_id.is_(None))
        )

        for plan in plans:
            logger.info("Processing plan", plan_id=plan.id, client_id=plan.client_id)

            await plan.schedule_initial_creation(session)

        logger.info("Retry process completed")
