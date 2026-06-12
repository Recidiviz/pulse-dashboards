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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
from app.core.db import AsyncSession, get_session
from app.crud.intake import get_intake_by_id
from app.crud.seen_item import upsert_seen_item
from app.models.seen_item import SeenItemType
from app.utils.permission_utils import check_access

router = APIRouter()


class MarkSeenRequest(BaseModel):
    intake_id: UUID
    item_type: SeenItemType
    item_id: UUID


@router.post(
    "",
    status_code=204,
    summary="Mark an artifact as seen",
    tags=["Seen Items"],
)
async def mark_seen(
    body: MarkSeenRequest,
    session: AsyncSession = Depends(get_session),
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    intake = await get_intake_by_id(session, body.intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    check_access(
        intake.client_pseudo_id,
        pseudonymized_id,
        cpa_client_locations=auth_user_context["cpa_client_locations"],
        is_zero_caseload_user=auth_user_context["is_zero_caseload_user"],
    )

    await upsert_seen_item(
        session,
        seen_by=pseudonymized_id,
        intake_id=body.intake_id,
        item_type=body.item_type,
        item_id=body.item_id,
    )
