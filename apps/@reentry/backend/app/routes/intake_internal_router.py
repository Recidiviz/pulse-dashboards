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

"""
Internal-only intake viewer routes for Recidiviz staff.

These endpoints mirror the intake admin routes but skip the caseload-based
check_access call, instead requiring a @recidiviz.org email. They exist
specifically to support Slack guardrail alert deep links, where the viewer
is a Recidiviz employee who is not the assigned caseworker.
"""

from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException

from app.auth.auth_core import require_internal_user
from app.core.db import AsyncSession, get_session
from app.crud.intake import get_intake_by_id, get_intake_section_messages
from app.routes.intake_admin_router import (
    IntakeWithSectionsResponse,
    prepare_intake_response,
)
from app.routes.shared_models import IntakeMessageResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "/{intake_id}",
    summary="Fetch intake (internal)",
    description="Returns intake details for Recidiviz staff. Does not require caseload membership.",
    tags=["Intake - Internal"],
    response_model=IntakeWithSectionsResponse,
)
async def get_intake_internal(
    intake_id: UUID,
    session: AsyncSession = Depends(get_session),
    internal_user: dict = Depends(require_internal_user),
):
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail=f"Intake not found: {intake_id}")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    logger.info(
        "internal intake access", intake_id=str(intake_id), email=internal_user["email"]
    )
    return await prepare_intake_response(
        intake=intake, session=session, pseudonymized_staff_id=None
    )


@router.get(
    "/{intake_id}/{section_title:path}/messages",
    summary="Fetch intake section messages (internal)",
    description="Returns messages for a section for Recidiviz staff. Does not require caseload membership.",
    tags=["Intake - Internal"],
    response_model=list[IntakeMessageResponse],
)
async def get_intake_section_messages_internal(
    intake_id: UUID,
    section_title: str,
    session: AsyncSession = Depends(get_session),
    internal_user: dict = Depends(require_internal_user),
):
    intake = await get_intake_by_id(session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail=f"Intake not found: {intake_id}")

    structlog.contextvars.bind_contextvars(client_pseudo_id=intake.client_pseudo_id)
    logger.info(
        "internal section messages access",
        intake_id=str(intake_id),
        section_title=section_title,
        email=internal_user["email"],
    )

    messages = await get_intake_section_messages(session, intake_id, section_title)

    if not messages:
        raise HTTPException(
            status_code=404,
            detail=f"No messages found for intake {intake_id} in section '{section_title}'",
        )

    return messages
