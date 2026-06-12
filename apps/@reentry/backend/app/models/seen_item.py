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

from enum import StrEnum
from uuid import UUID

from sqlalchemy import Column, Index, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field

from app.models.base import BaseModel


class SeenItemType(StrEnum):
    INTAKE_CONVERSATION = "intake_conversation"
    INTAKE_SUMMARY = "intake_summary"
    ACTION_PLAN = "action_plan"


class SeenItem(BaseModel, table=True):
    __tablename__ = "seen_item"
    __table_args__ = (
        UniqueConstraint(
            "seen_by", "item_type", "item_id", name="uq_seen_item_admin_type_item"
        ),
        Index("ix_seen_item_admin_intake", "seen_by", "intake_id"),
    )

    seen_by: str
    intake_id: UUID = Field(foreign_key="intake.id", ondelete="CASCADE")
    item_type: SeenItemType = Field(
        sa_column=Column(
            SAEnum(
                SeenItemType,
                name="seenitemtype",
                native_enum=True,
                values_callable=lambda e: [x.value for x in e],
            ),
            nullable=False,
        )
    )
    item_id: UUID
