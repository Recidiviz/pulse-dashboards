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
"""CRUD operations for AIPersona"""

from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.ai_persona import AIIntakeTrigger, AIPersona


@overload
async def get_ai_persona_by_id(
    session: AsyncSession, persona_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AIPersona]: ...


@overload
async def get_ai_persona_by_id(
    session: AsyncSession, persona_id: UUID, *, query_only: Literal[False] = False
) -> AIPersona | None: ...


@statement_or_result(first_only=True)
async def get_ai_persona_by_id(
    session: AsyncSession, persona_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AIPersona] | AIPersona | None:
    """Get a specific AI persona by ID"""
    return select(AIPersona).where(AIPersona.id == persona_id)


@overload
async def get_ai_intake_trigger_by_id(
    session: AsyncSession, trigger_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AIIntakeTrigger]: ...


@overload
async def get_ai_intake_trigger_by_id(
    session: AsyncSession, trigger_id: UUID, *, query_only: Literal[False] = False
) -> AIIntakeTrigger | None: ...


@statement_or_result(first_only=True)
async def get_ai_intake_trigger_by_id(
    session: AsyncSession, trigger_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AIIntakeTrigger] | AIIntakeTrigger | None:
    """Get a specific AI intake trigger by ID"""
    return select(AIIntakeTrigger).where(AIIntakeTrigger.id == trigger_id)


@overload
async def get_latest_ai_intake_trigger_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AIIntakeTrigger]: ...


@overload
async def get_latest_ai_intake_trigger_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[False] = False
) -> AIIntakeTrigger | None: ...


@statement_or_result(first_only=True)
async def get_latest_ai_intake_trigger_by_intake_id(
    session: AsyncSession, intake_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AIIntakeTrigger] | AIIntakeTrigger | None:
    """Get the most recent AI intake trigger for a given intake, ordered by creation date"""
    return (
        select(AIIntakeTrigger)
        .where(AIIntakeTrigger.intake_id == intake_id)
        .order_by(AIIntakeTrigger.created_at.desc())
    )


@overload
async def get_triggers_by_persona_id(
    session: AsyncSession, persona_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[AIIntakeTrigger]: ...


@overload
async def get_triggers_by_persona_id(
    session: AsyncSession, persona_id: UUID, *, query_only: Literal[False] = False
) -> list[AIIntakeTrigger]: ...


@statement_or_result(result_type=list)
async def get_triggers_by_persona_id(
    session: AsyncSession, persona_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[AIIntakeTrigger] | list[AIIntakeTrigger]:
    """Get all AI intake triggers for a specific persona, ordered by creation date descending"""
    return (
        select(AIIntakeTrigger)
        .where(AIIntakeTrigger.persona_id == persona_id)
        .order_by(AIIntakeTrigger.created_at.desc())
    )


@overload
async def get_all_template_triggers(
    session: AsyncSession, *, query_only: Literal[True]
) -> SelectOfScalar[AIIntakeTrigger]: ...


@overload
async def get_all_template_triggers(
    session: AsyncSession, *, query_only: Literal[False] = False
) -> list[AIIntakeTrigger]: ...


@statement_or_result(result_type=list)
async def get_all_template_triggers(
    session: AsyncSession, *, query_only: bool = False
) -> SelectOfScalar[AIIntakeTrigger] | list[AIIntakeTrigger]:
    """Get all AI intake triggers marked as templates, ordered by creation date descending"""
    return (
        select(AIIntakeTrigger)
        .where(AIIntakeTrigger.is_template.is_(True))
        .order_by(AIIntakeTrigger.created_at.desc())
    )


@overload
async def get_all_active_ai_personas(
    session: AsyncSession, *, query_only: Literal[True]
) -> SelectOfScalar[AIPersona]: ...


@overload
async def get_all_active_ai_personas(
    session: AsyncSession, *, query_only: Literal[False] = False
) -> list[AIPersona]: ...


@statement_or_result(result_type=list)
async def get_all_active_ai_personas(
    session: AsyncSession, *, query_only: bool = False
) -> SelectOfScalar[AIPersona] | list[AIPersona]:
    """Get all active AI personas"""
    return (
        select(AIPersona).where(AIPersona.is_active.is_(True)).order_by(AIPersona.name)
    )


async def create_ai_persona(
    session: AsyncSession,
    name: str,
    age: int,
    background: str,
    challenges: str,
    communication_style: str,
) -> AIPersona:
    """Create a new AI persona"""
    persona = AIPersona(
        name=name,
        age=age,
        background=background,
        challenges=challenges,
        communication_style=communication_style,
        is_active=True,
    )
    session.add(persona)
    await session.commit()
    await session.refresh(persona)
    return persona


async def update_ai_persona(
    session: AsyncSession,
    persona_id: UUID,
    name: str | None = None,
    age: int | None = None,
    background: str | None = None,
    challenges: str | None = None,
    communication_style: str | None = None,
) -> AIPersona | None:
    """Update an existing AI persona"""
    persona = await get_ai_persona_by_id(session, persona_id)
    if not persona:
        return None

    if name is not None:
        persona.name = name
    if age is not None:
        persona.age = age
    if background is not None:
        persona.background = background
    if challenges is not None:
        persona.challenges = challenges
    if communication_style is not None:
        persona.communication_style = communication_style

    session.add(persona)
    await session.commit()
    await session.refresh(persona)
    return persona


async def delete_ai_persona(session: AsyncSession, persona_id: UUID) -> bool:
    """Soft delete an AI persona by setting is_active to False"""
    persona = await get_ai_persona_by_id(session, persona_id)
    if not persona:
        return False

    persona.is_active = False
    session.add(persona)
    await session.commit()
    return True
