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

from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.seen_item import SeenItem, SeenItemType


async def get_seen_items_for_admin_and_intakes(
    session: AsyncSession,
    seen_by: str,
    intake_ids: list[UUID],
) -> list[SeenItem]:
    if not intake_ids:
        return []
    result = await session.exec(
        select(SeenItem).where(
            SeenItem.seen_by == seen_by,
            SeenItem.intake_id.in_(intake_ids),
        )
    )
    return list(result.all())


async def upsert_seen_item(
    session: AsyncSession,
    seen_by: str,
    intake_id: UUID,
    item_type: SeenItemType,
    item_id: UUID,
) -> None:
    stmt = (
        insert(SeenItem)
        .values(
            seen_by=seen_by,
            intake_id=intake_id,
            item_type=item_type,
            item_id=item_id,
        )
        .on_conflict_do_nothing(
            constraint="uq_seen_item_admin_type_item",
        )
    )
    await session.execute(stmt)
    await session.commit()
