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

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.auth_core import (
    get_auth_user_context,
    get_pseudonymized_id,
    is_internal_user,
)
from app.auth.impersonation import get_impersonated_user_metadata

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/impersonate")
async def impersonate_user(
    email: str,
    request: Request,
    pseudonymized_id: str = Depends(get_pseudonymized_id),
    auth_user_context=Depends(get_auth_user_context),
):
    """
    Fetch metadata for a target user to enable impersonation.
    Only accessible to internal (Recidiviz) users.
    """
    caller_email = auth_user_context.get("email")

    if not is_internal_user(caller_email):
        raise HTTPException(
            status_code=403,
            detail="Impersonation requires internal user access",
        )

    app_metadata = await get_impersonated_user_metadata(email)

    logger.info("Impersonation request", impersonator=caller_email, target_email=email)

    return {
        "email": email,
        "pseudonymized_id": app_metadata.get("pseudonymizedId"),
        "state_code": app_metadata.get("stateCode"),
        "feature_variants": app_metadata.get("featureVariants", {}),
    }
