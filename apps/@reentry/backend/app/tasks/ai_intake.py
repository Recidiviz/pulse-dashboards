# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================
"""Background task for executing AI-powered intakes with personas."""

from uuid import UUID

import orjson
import structlog
from taskiq import TaskiqDepends

from app.core.db import AsyncSession, get_session
from app.crud.ai_persona import get_ai_intake_trigger_by_id, get_ai_persona_by_id
from app.crud.intake import get_intake_by_id
from app.models.base import IntakeStatus
from app.utils.intake.ai_intake_executor import run_ai_intake

from .base import broker
from .scheduler import execution_context

logger = structlog.get_logger(__name__)


@broker.task
async def execute_ai_intake_task(
    execution_id: UUID,
    trigger_id: UUID,
    session: AsyncSession = TaskiqDepends(get_session),
):
    """
    Execute an AI intake conversation using a persona.

    Args:
        execution_id: ID of the execution tracking this task
        trigger_id: ID of the AIIntakeTrigger record
        session: Database session
    """
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(
            execution_id=execution_id.hex,
            trigger_id=trigger_id.hex,
        )

        try:
            # Load trigger and extract intake/persona IDs
            await execution.log_progress(
                session, 10, "Loading trigger", logger=task_logger
            )
            trigger = await get_ai_intake_trigger_by_id(session, trigger_id)

            if not trigger:
                raise ValueError(f"AIIntakeTrigger {trigger_id} not found")

            intake_id = trigger.intake_id
            persona_id = trigger.persona_id

            task_logger = task_logger.bind(
                intake_id=intake_id.hex,
                persona_id=persona_id.hex,
            )

            # Load persona from database
            persona = await get_ai_persona_by_id(session, persona_id)

            if not persona:
                raise ValueError(f"Persona {persona_id} not found")

            if not persona.is_active:
                raise ValueError(f"Persona {persona_id} is not active")

            task_logger.info(
                f"Starting AI intake with persona: {persona.name}",
                persona_name=persona.name,
                persona_age=persona.age,
            )

            # Convert persona to dict for executor
            persona_dict = {
                "name": persona.name,
                "age": persona.age,
                "background": persona.background,
                "challenges": persona.challenges,
                "communication_style": persona.communication_style,
            }

            # Run AI intake
            await execution.log_progress(
                session, 30, "Starting AI conversation", logger=task_logger
            )

            result = await run_ai_intake(intake_id, persona_dict, session)

            # Mark intake as complete
            intake = await get_intake_by_id(session, intake_id)
            if intake:
                await intake.update_status(session, IntakeStatus.COMPLETED)

            # Store result
            await execution.log_progress(
                session, 100, "AI intake completed", logger=task_logger
            )

            # Store output as JSON
            execution.output = orjson.dumps(result).decode("utf-8")

            task_logger.info(
                "AI intake completed successfully",
                status=result.get("status"),
                message_count=result.get("message_count"),
                completed_sections=result.get("completed_sections"),
            )

        except Exception as e:
            task_logger.error(
                f"Error in AI intake task: {e}",
                error=str(e),
                exc_info=True,
            )
            # Store error in output
            execution.output = orjson.dumps(
                {
                    "intake_id": str(intake_id),
                    "status": "failed",
                    "error": str(e),
                }
            ).decode("utf-8")
            raise
