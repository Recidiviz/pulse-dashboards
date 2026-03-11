# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
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
"""API routes for AI Persona management"""

import json
from datetime import datetime
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import BaseModel

from app.auth.dependencies import require_internal_user
from app.core.db import AsyncSession, get_session
from app.crud.address import update_intake_address
from app.crud.ai_persona import (
    create_ai_persona,
    delete_ai_persona,
    get_ai_persona_by_id,
    get_all_active_ai_personas,
    get_all_template_triggers,
    get_triggers_by_persona_id,
    update_ai_persona,
)
from app.crud.execution import get_execution_by_id, upsert_execution
from app.crud.intake import (
    get_intake_by_id,
    get_intake_by_id_with_assessment_config,
    get_intake_messages,
)
from app.models.ai_persona import AIIntakeTrigger
from app.models.base import IntakeStatus
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import IntakeMessage
from app.routes.base import DeletionResponse, DeletionStatus, ORMResponse
from app.routes.shared_models import AddressSubmission
from app.tasks.ai_intake import execute_ai_intake_task
from app.tasks.scheduler import schedule_task

router = APIRouter(prefix="/ai-personas", tags=["AI Personas"])
logger = structlog.get_logger(__name__)


# Request/Response Models
class AIPersonaCreate(BaseModel):
    name: str
    age: int
    background: str
    challenges: str
    communication_style: str


class AIPersonaUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    background: str | None = None
    challenges: str | None = None
    communication_style: str | None = None


class AIPersonaResponse(ORMResponse):
    name: str
    age: int
    background: str
    challenges: str
    communication_style: str
    is_active: bool


class AIIntakeTriggerSummary(BaseModel):
    trigger_id: UUID
    intake_id: UUID
    persona_id: UUID | None
    execution_id: UUID | None
    status: str
    progress: int
    created_at: datetime
    is_template: bool
    from_template: bool
    client_pseudo_id: str | None = None
    assessment_config_id: UUID | None = None
    assessment_config_name: str | None = None
    assessment_config_code: str | None = None


# Endpoints
@router.get(
    "",
    response_model=Page[AIPersonaResponse],
    summary="List AI Personas",
)
async def list_ai_personas(
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Get all active AI personas with pagination.
    """
    query = await get_all_active_ai_personas(session, query_only=True)
    return await paginate(session, query)


@router.get(
    "/{persona_id}",
    response_model=AIPersonaResponse,
    summary="Get AI Persona",
)
async def get_ai_persona(
    persona_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Get a specific AI persona by ID.
    """
    persona = await get_ai_persona_by_id(session, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="AI Persona not found")
    return persona


@router.get(
    "/{persona_id}/triggers",
    response_model=list[AIIntakeTriggerSummary],
    summary="List AI Intake Triggers for Persona",
)
async def list_persona_triggers(
    persona_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    List all AI intake triggers for a specific persona, ordered by most recent first.
    Includes execution status for each trigger.
    """
    persona = await get_ai_persona_by_id(session, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="AI Persona not found")

    triggers = await get_triggers_by_persona_id(session, persona_id)

    result = []
    for trigger in triggers:
        status = "not_started"
        progress = 0
        if trigger.execution_id:
            execution = await get_execution_by_id(session, trigger.execution_id)
            if execution:
                status = execution.status.value
                progress = execution.progress

        intake = await get_intake_by_id_with_assessment_config(
            session, trigger.intake_id
        )

        result.append(
            AIIntakeTriggerSummary(
                trigger_id=trigger.id,
                intake_id=trigger.intake_id,
                persona_id=trigger.persona_id,
                execution_id=trigger.execution_id,
                status=status,
                progress=progress,
                created_at=trigger.created_at,
                is_template=trigger.is_template,
                from_template=trigger.from_template,
                client_pseudo_id=intake.client_pseudo_id if intake else None,
                assessment_config_id=intake.assessment_config.id
                if intake and intake.assessment_config
                else None,
                assessment_config_name=intake.assessment_config.display_name
                if intake and intake.assessment_config
                else None,
                assessment_config_code=intake.assessment_config.code
                if intake and intake.assessment_config
                else None,
            )
        )

    return result


@router.post(
    "",
    response_model=AIPersonaResponse,
    summary="Create AI Persona",
    status_code=201,
)
async def create_ai_persona_endpoint(
    request: AIPersonaCreate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Create a new AI persona.
    """
    persona = await create_ai_persona(
        session=session,
        name=request.name,
        age=request.age,
        background=request.background,
        challenges=request.challenges,
        communication_style=request.communication_style,
    )
    logger.info(f"Created AI persona: {persona.name} (ID: {persona.id})")
    return persona


@router.put(
    "/{persona_id}",
    response_model=AIPersonaResponse,
    summary="Update AI Persona",
)
async def update_ai_persona_endpoint(
    persona_id: UUID,
    request: AIPersonaUpdate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Update an existing AI persona.
    """
    persona = await update_ai_persona(
        session=session,
        persona_id=persona_id,
        name=request.name,
        age=request.age,
        background=request.background,
        challenges=request.challenges,
        communication_style=request.communication_style,
    )
    if not persona:
        raise HTTPException(status_code=404, detail="AI Persona not found")

    logger.info(f"Updated AI persona: {persona.name} (ID: {persona.id})")
    return persona


@router.delete(
    "/{persona_id}",
    response_model=DeletionResponse,
    summary="Delete AI Persona",
)
async def delete_ai_persona_endpoint(
    persona_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Soft delete an AI persona (sets is_active to False).
    """
    success = await delete_ai_persona(session, persona_id)
    if not success:
        raise HTTPException(status_code=404, detail="AI Persona not found")

    logger.info(f"Deleted AI persona ID: {persona_id}")
    return DeletionResponse(status=DeletionStatus.SUCCESS)


# AI Intake Trigger Models
class ChatTemplateMessage(BaseModel):
    from_role: str
    content: str


class ChatTemplateSection(BaseModel):
    title: str
    messages: list[ChatTemplateMessage]


class AIIntakeTriggerRequest(BaseModel):
    intake_id: UUID
    persona_id: UUID | None = None
    template_trigger_id: UUID | None = None
    chat_template: list[ChatTemplateSection] | None = None
    street_address: str | None = None
    city: str | None = None
    state: str | None = None


class AIIntakeTriggerResponse(BaseModel):
    trigger_id: UUID
    intake_id: UUID
    execution_id: UUID


class AIIntakeStatusResponse(BaseModel):
    execution_id: UUID
    intake_id: UUID | None
    persona_id: UUID | None = None
    status: str
    progress: int
    message: str | None
    output: str | None
    is_template: bool | None = None
    from_template: bool | None = None
    assessment_config_id: UUID | None = None
    assessment_config_name: str | None = None
    assessment_config_code: str | None = None


@router.post(
    "/ai-intakes/trigger",
    response_model=AIIntakeTriggerResponse,
    summary="Trigger AI Intake",
    status_code=201,
)
async def trigger_ai_intake(
    request: AIIntakeTriggerRequest,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Trigger an AI-powered intake using a persona or a template trigger.

    Exactly one of `persona_id` or `template_trigger_id` must be provided.
    When `template_trigger_id` is provided the persona is resolved from the
    referenced template trigger.
    """
    from app.crud.ai_persona import get_ai_intake_trigger_by_id

    provided = sum(
        [
            bool(request.persona_id),
            bool(request.template_trigger_id),
            bool(request.chat_template),
        ]
    )
    if provided == 0:
        raise HTTPException(
            status_code=400,
            detail="One of persona_id, template_trigger_id, or chat_template must be provided",
        )
    if provided > 1:
        raise HTTPException(
            status_code=400,
            detail="Only one of persona_id, template_trigger_id, or chat_template may be provided",
        )

    # Resolve persona_id from template when template_trigger_id is given
    resolved_persona_id = request.persona_id
    if request.template_trigger_id:
        template = await get_ai_intake_trigger_by_id(
            session, request.template_trigger_id
        )
        if not template:
            raise HTTPException(status_code=404, detail="Template trigger not found")
        if not template.is_template:
            raise HTTPException(
                status_code=400, detail="Referenced trigger is not a template"
            )
        resolved_persona_id = template.persona_id

    # Validate persona exists and is active (not required for chat_template path)
    if resolved_persona_id:
        persona = await get_ai_persona_by_id(session, resolved_persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="AI Persona not found")
        if not persona.is_active:
            raise HTTPException(status_code=400, detail="AI Persona is not active")

    # Validate intake exists
    intake = await get_intake_by_id(session, request.intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # Update address if provided
    if request.city and request.state:
        await update_intake_address(
            session,
            intake_id=intake.id,
            address_data=AddressSubmission(
                street_address=request.street_address,
                city=request.city,
                state=request.state,
            ),
        )

    # --- JSON template path: create messages directly from provided JSON ---
    if request.chat_template:
        total_messages = 0
        completed_sections = []
        for section in request.chat_template:
            for msg in section.messages:
                session.add(
                    IntakeMessage(
                        intake_id=intake.id,
                        from_role=msg.from_role,
                        content=msg.content,
                        section=section.title,
                    )
                )
                total_messages += 1
            if section.messages:
                completed_sections.append(section.title)

        if total_messages == 0:
            raise HTTPException(
                status_code=400,
                detail="chat_template contains no messages",
            )

        execution = Execution(
            status=ExecutionStatus.COMPLETED,
            progress=100,
            message="Completed from JSON template",
            table_name="intake",
            table_entity_id=intake.id,
            output=json.dumps(
                {
                    "status": "completed_from_json_template",
                    "message_count": total_messages,
                    "completed_sections": completed_sections,
                }
            ),
        )
        await upsert_execution(session, execution)

        trigger = AIIntakeTrigger(
            intake_id=intake.id,
            persona_id=None,
            execution_id=execution.id,
            from_template=True,
        )
        session.add(trigger)
        await session.commit()
        await session.refresh(trigger)

        await intake.update_status(session, IntakeStatus.COMPLETED)

        logger.info(
            "Created intake from JSON template",
            intake_id=str(intake.id),
            execution_id=str(execution.id),
            trigger_id=str(trigger.id),
            message_count=total_messages,
        )

        return AIIntakeTriggerResponse(
            trigger_id=trigger.id,
            intake_id=intake.id,
            execution_id=execution.id,
        )

    # --- Template path: copy messages from template intake synchronously ---
    if request.template_trigger_id:
        template_intake = await get_intake_by_id(session, template.intake_id)
        if not template_intake:
            raise HTTPException(status_code=404, detail="Template intake not found")

        source_messages = await get_intake_messages(session, template_intake.id)
        if not source_messages:
            raise HTTPException(
                status_code=400,
                detail="Template intake has no messages to copy",
            )

        # Copy every message into the new intake
        for msg in source_messages:
            session.add(
                IntakeMessage(
                    intake_id=intake.id,
                    from_role=msg.from_role,
                    content=msg.content,
                    section=msg.section,
                )
            )

        # Collect stats for the execution output
        completed_sections = list(
            dict.fromkeys(m.section for m in source_messages if m.section)
        )

        # Create a pre-completed execution record (no background task)
        execution = Execution(
            status=ExecutionStatus.COMPLETED,
            progress=100,
            message="Completed from template",
            table_name="intake",
            table_entity_id=intake.id,
            output=json.dumps(
                {
                    "status": "completed_from_template",
                    "message_count": len(source_messages),
                    "completed_sections": completed_sections,
                }
            ),
        )
        await upsert_execution(session, execution)
        # Create trigger record linked to the execution
        trigger = AIIntakeTrigger(
            intake_id=intake.id,
            persona_id=resolved_persona_id,
            execution_id=execution.id,
            from_template=True,
        )
        session.add(trigger)
        await session.commit()
        await session.refresh(trigger)

        # Mark intake as completed (sets current_section, completed_at, schedules plan)
        await intake.update_status(session, IntakeStatus.COMPLETED)

        logger.info(
            f"Created intake from template for persona: {persona.name}",
            intake_id=str(intake.id),
            execution_id=str(execution.id),
            persona_id=str(resolved_persona_id),
            trigger_id=str(trigger.id),
            template_trigger_id=str(request.template_trigger_id),
            message_count=len(source_messages),
        )

        return AIIntakeTriggerResponse(
            trigger_id=trigger.id,
            intake_id=intake.id,
            execution_id=execution.id,
        )

    # --- Standard path: update intake to IN_PROGRESS and schedule background task ---
    if intake.status == IntakeStatus.CREATED:
        await intake.update_status(session, IntakeStatus.IN_PROGRESS)

    # Create trigger record
    trigger = AIIntakeTrigger(
        intake_id=intake.id,
        persona_id=resolved_persona_id,
    )
    session.add(trigger)
    await session.commit()
    await session.refresh(trigger)

    # Schedule background task
    execution = await schedule_task(
        session=session,
        table_name="intake",
        table_entity_id=intake.id,
        task_func=execute_ai_intake_task,
        task_kwargs={
            "trigger_id": trigger.id,
        },
    )

    # Update trigger with execution ID
    trigger.execution_id = execution.id
    session.add(trigger)
    await session.commit()

    logger.info(
        f"Triggered AI intake for persona: {persona.name}",
        intake_id=str(intake.id),
        execution_id=str(execution.id),
        persona_id=str(resolved_persona_id),
        trigger_id=str(trigger.id),
    )

    return AIIntakeTriggerResponse(
        trigger_id=trigger.id,
        intake_id=intake.id,
        execution_id=execution.id,
    )


@router.get(
    "/ai-intakes/{execution_id}/status",
    response_model=AIIntakeStatusResponse,
    summary="Get AI Intake Status",
)
async def get_ai_intake_status(
    execution_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Get the status of an AI intake execution.

    Returns the current progress, status, and output of the AI intake task.
    """
    execution = await get_execution_by_id(session, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    return AIIntakeStatusResponse(
        execution_id=execution.id,
        intake_id=execution.table_entity_id,
        status=execution.status.value,
        progress=execution.progress,
        message=execution.message,
        output=execution.output,
    )


@router.get(
    "/ai-intakes/{trigger_id}/trigger-status",
    response_model=AIIntakeStatusResponse,
    summary="Get AI Intake Status by Trigger ID",
)
async def get_ai_intake_status_by_trigger(
    trigger_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Get the status of an AI intake execution by trigger ID.

    Looks up the AIIntakeTrigger to find the associated execution,
    then returns the current progress, status, and output.
    """
    from app.crud.ai_persona import get_ai_intake_trigger_by_id

    trigger = await get_ai_intake_trigger_by_id(session, trigger_id)
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")

    if not trigger.execution_id:
        raise HTTPException(
            status_code=404, detail="Execution not yet assigned to trigger"
        )

    execution = await get_execution_by_id(session, trigger.execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    intake = await get_intake_by_id_with_assessment_config(session, trigger.intake_id)

    return AIIntakeStatusResponse(
        execution_id=execution.id,
        intake_id=execution.table_entity_id,
        persona_id=trigger.persona_id,
        status=execution.status.value,
        progress=execution.progress,
        message=execution.message,
        output=execution.output,
        is_template=trigger.is_template,
        from_template=trigger.from_template,
        assessment_config_id=intake.assessment_config.id
        if intake and intake.assessment_config
        else None,
        assessment_config_name=intake.assessment_config.display_name
        if intake and intake.assessment_config
        else None,
        assessment_config_code=intake.assessment_config.code
        if intake and intake.assessment_config
        else None,
    )


@router.post(
    "/ai-intakes/{trigger_id}/retry",
    response_model=AIIntakeTriggerResponse,
    summary="Retry AI Intake",
    status_code=201,
)
async def retry_ai_intake(
    trigger_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Retry an AI intake execution for an existing trigger.

    Creates a new background task execution for the same trigger and updates
    the trigger's execution_id to track the new attempt.
    """
    from app.crud.ai_persona import get_ai_intake_trigger_by_id

    trigger = await get_ai_intake_trigger_by_id(session, trigger_id)
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")

    intake = await get_intake_by_id(session, trigger.intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # Reset intake status so the task can re-run
    await intake.update_status(session, IntakeStatus.IN_PROGRESS)

    # Schedule a new background task
    execution = await schedule_task(
        session=session,
        table_name="intake",
        table_entity_id=intake.id,
        task_func=execute_ai_intake_task,
        task_kwargs={
            "trigger_id": trigger.id,
        },
    )

    # Update trigger to point to the new execution
    trigger.execution_id = execution.id
    session.add(trigger)
    await session.commit()

    logger.info(
        "Retrying AI intake",
        trigger_id=str(trigger_id),
        intake_id=str(intake.id),
        execution_id=str(execution.id),
    )

    return AIIntakeTriggerResponse(
        trigger_id=trigger.id,
        intake_id=intake.id,
        execution_id=execution.id,
    )


@router.get(
    "/ai-intakes/templates",
    response_model=list[AIIntakeTriggerSummary],
    summary="List Template AI Intake Triggers",
)
async def list_template_triggers(
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    List all AI intake triggers that have been marked as templates.
    """
    triggers = await get_all_template_triggers(session)

    result = []
    for trigger in triggers:
        status = "not_started"
        progress = 0
        if trigger.execution_id:
            execution = await get_execution_by_id(session, trigger.execution_id)
            if execution:
                status = execution.status.value
                progress = execution.progress

        intake = await get_intake_by_id_with_assessment_config(
            session, trigger.intake_id
        )

        result.append(
            AIIntakeTriggerSummary(
                trigger_id=trigger.id,
                intake_id=trigger.intake_id,
                persona_id=trigger.persona_id,
                execution_id=trigger.execution_id,
                status=status,
                progress=progress,
                created_at=trigger.created_at,
                is_template=trigger.is_template,
                from_template=trigger.from_template,
                client_pseudo_id=intake.client_pseudo_id if intake else None,
                assessment_config_id=intake.assessment_config.id
                if intake and intake.assessment_config
                else None,
                assessment_config_name=intake.assessment_config.display_name
                if intake and intake.assessment_config
                else None,
                assessment_config_code=intake.assessment_config.code
                if intake and intake.assessment_config
                else None,
            )
        )

    return result


@router.post(
    "/ai-intakes/{trigger_id}/toggle-template",
    response_model=AIIntakeTriggerSummary,
    summary="Toggle AI Intake Trigger as Template",
)
async def toggle_trigger_as_template(
    trigger_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Toggle the is_template flag on an AI intake trigger.

    If the trigger is not currently a template, it will be marked as one.
    If it is already a template, it will be unmarked.
    """
    from app.crud.ai_persona import get_ai_intake_trigger_by_id

    trigger = await get_ai_intake_trigger_by_id(session, trigger_id)
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")

    trigger.is_template = not trigger.is_template
    session.add(trigger)
    await session.commit()
    await session.refresh(trigger)

    status = "not_started"
    progress = 0
    if trigger.execution_id:
        execution = await get_execution_by_id(session, trigger.execution_id)
        if execution:
            status = execution.status.value
            progress = execution.progress

    logger.info(
        "Toggled template status for AI intake trigger",
        trigger_id=str(trigger_id),
        is_template=trigger.is_template,
    )

    return AIIntakeTriggerSummary(
        trigger_id=trigger.id,
        intake_id=trigger.intake_id,
        persona_id=trigger.persona_id,
        execution_id=trigger.execution_id,
        status=status,
        progress=progress,
        created_at=trigger.created_at,
        is_template=trigger.is_template,
        from_template=trigger.from_template,
    )


class TestPersonaRequest(BaseModel):
    message: str


class TestPersonaResponse(BaseModel):
    response: str


@router.post(
    "/{persona_id}/test",
    response_model=TestPersonaResponse,
    summary="Test AI Persona",
)
async def test_ai_persona(
    persona_id: UUID,
    request: TestPersonaRequest,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    """
    Test an AI persona by sending a message and getting a response.

    This endpoint allows interactive testing of persona characteristics
    without creating a full intake.
    """
    # Get persona
    persona = await get_ai_persona_by_id(session, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="AI Persona not found")
    if not persona.is_active:
        raise HTTPException(status_code=400, detail="AI Persona is not active")

    # Import here to avoid circular dependencies
    from app.utils.intake.ai_intake_executor import AIIntakeClient

    # Create AI client for testing
    ai_client = AIIntakeClient(
        client_pseudo_id="test-client",
        client_name=persona.name,
        persona={
            "name": persona.name,
            "age": persona.age,
            "background": persona.background,
            "challenges": persona.challenges,
            "communication_style": persona.communication_style,
        },
    )

    try:
        # Generate response
        response = await ai_client.generate_response(
            ai_message=request.message,
            current_section="test",
        )

        logger.info(
            f"Generated test response for persona: {persona.name}",
            persona_id=str(persona_id),
            message_length=len(request.message),
        )

        return TestPersonaResponse(response=response)

    except Exception as e:
        logger.error(
            f"Error generating test response for persona {persona.name}: {e}",
            persona_id=str(persona_id),
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to generate response: {str(e)}"
        )
