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
"""
Database model for AI personas used in automated intake testing.
"""

from typing import Optional
from uuid import UUID

from sqlmodel import Field

from app.models.base import BaseModel


class AIPersona(BaseModel, table=True):
    """
    AI personas for automated intake testing.

    Based on SAMPLE_PERSONAS from headless_conversation_eval.py.
    Personas define the characteristics and behavior of simulated clients
    for testing intake assessments.
    """

    __tablename__ = "ai_persona"

    name: str = Field(nullable=False, index=True)
    age: int = Field(nullable=False)
    background: str = Field(nullable=False)
    challenges: str = Field(nullable=False)
    communication_style: str = Field(nullable=False)
    is_active: bool = Field(default=True, nullable=False)


class AIIntakeTrigger(BaseModel, table=True):
    """
    Represents a triggered AI intake run, linking a persona to an intake
    and tracking the resulting background task execution.
    """

    __tablename__ = "ai_intake_trigger"

    intake_id: UUID = Field(foreign_key="intake.id", nullable=False, index=True)
    persona_id: Optional[UUID] = Field(
        default=None, foreign_key="ai_persona.id", nullable=True
    )
    execution_id: Optional[UUID] = Field(
        default=None, foreign_key="execution.id", nullable=True
    )
    is_template: bool = Field(default=False, nullable=False)
    from_template: bool = Field(default=False, nullable=False)
