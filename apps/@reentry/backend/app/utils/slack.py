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

import json
import logging
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_intake_completion_notification(
    state_code: str,
    intake_id: str,
    client_pseudo_id: str | None,
    intake_type: str,
) -> None:
    """Send a Slack notification when an intake completes. Silently no-ops if not configured."""
    if not settings.SLACK_INTAKE_WEBHOOK_URLS:
        return

    try:
        url_map: dict = json.loads(settings.SLACK_INTAKE_WEBHOOK_URLS)
    except (json.JSONDecodeError, TypeError):
        logger.warning(
            "SLACK_INTAKE_WEBHOOK_URLS is not valid JSON, skipping notification"
        )
        return

    webhook_url = url_map.get(state_code) or url_map.get("default")
    if not webhook_url:
        return

    parsed = urlparse(webhook_url)
    if parsed.scheme != "https" or parsed.netloc != "hooks.slack.com":
        logger.warning(
            f"Configured Slack webhook URL is not a valid Slack URL, skipping: {parsed.netloc}"
        )
        return

    client_label = client_pseudo_id or "(unknown)"
    message = {
        "text": (
            f"\u2705 *New intake completed*\n"
            f"*State:* {state_code}  |  *Client:* {client_label}  |  *Type:* {intake_type}  |  *ID:* {str(intake_id)[:8]}"
        )
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=message)
    except Exception as e:
        logger.warning(f"Failed to send intake completion Slack notification: {e}")
