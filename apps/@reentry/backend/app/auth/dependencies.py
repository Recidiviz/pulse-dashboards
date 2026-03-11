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
"""Shared FastAPI dependencies for authentication and authorization."""

from fastapi import Depends, Header, HTTPException

from app.auth.auth_core import (
    get_auth_user_context,
    get_pseudonymized_id,
    is_internal_user,
)
from app.auth.config_access import decode_config_access_token, is_password_gate_enabled


async def require_internal_user(
    pseudonymized_id: str = Depends(get_pseudonymized_id),  # noqa: ARG001
    auth_user_context=Depends(get_auth_user_context),
    x_config_access_token: str | None = Header(default=None),
) -> dict:
    """Dependency to require internal user access for protected endpoints.

    Checks two layers:
    1. User must be from an internal domain (Recidiviz staff).
    2. If password gate is enabled (demo/staging/prod), the request must
       include a valid config access token in the X-Config-Access-Token header.

    Note: pseudonymized_id dependency is included to ensure the Auth0 userinfo
    cache is populated before get_auth_user_context runs (follows the pattern
    used in other routers like plan_router, client_router, etc.).
    """
    email = auth_user_context.get("email") or ""
    if not is_internal_user(email):
        raise HTTPException(
            status_code=403,
            detail="Config management is only available to Recidiviz staff",
        )

    # If password gate is enabled, validate config access token
    if is_password_gate_enabled():
        if not x_config_access_token:
            raise HTTPException(
                status_code=403,
                detail="Config access token required. Please enter the config management password.",
            )
        # This will raise HTTPException if token is invalid/expired
        decode_config_access_token(x_config_access_token)

    return auth_user_context
