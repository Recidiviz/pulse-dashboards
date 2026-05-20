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

"""Tests for the chat history PDF endpoint data preparation."""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from app.models.intake import IntakeMessage
from app.routes.intake_admin_router import generate_chat_history_pdf
from app.routes.shared_models import IntakeMessageRole

AUTH_CONTEXT = {
    "cpa_client_locations": [],
    "is_zero_caseload_user": True,
}


def _capture_render():
    """Returns a (patch context manager, captured dict) pair.

    The captured dict is populated with the template context when render() is called.
    """
    captured = {}

    def _render(template, context, stylesheet):
        captured.update(context)
        return b""

    return patch(
        "app.routes.intake_admin_router.pdf_renderer.render", side_effect=_render
    ), captured


@pytest.mark.asyncio
async def test_section_order_follows_conversation(
    async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Sections must appear in conversation order, not alphabetically.

    'Work' sorts after 'Housing' alphabetically, but here Work comes first in
    the conversation. The bug was ordering by (section, created_at) which would
    put Housing first.
    """
    base = datetime(2026, 1, 1, 12, 0, 0)
    messages = [
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CASEWORKER,
            content="Tell me about your work situation.",
            section="Work",
            created_at=base,
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CLIENT,
            content="I have a part-time job.",
            section="Work",
            created_at=base + timedelta(seconds=1),
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CASEWORKER,
            content="Tell me about your housing situation.",
            section="Housing",
            created_at=base + timedelta(seconds=2),
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CLIENT,
            content="I'm staying with family.",
            section="Housing",
            created_at=base + timedelta(seconds=3),
        ),
    ]
    for msg in messages:
        async_session.add(msg)
    await async_session.commit()

    render_patch, captured = _capture_render()
    with render_patch:
        with patch("app.routes.intake_admin_router.check_access"):
            await generate_chat_history_pdf(
                intake_id=mock_intake.id,
                session=async_session,
                pseudonymized_id="test_pseudonymized_id",
                auth_user_context=AUTH_CONTEXT,
            )

    section_titles = [s["title"] for s in captured["sections"]]
    assert section_titles == ["Work", "Housing"]


@pytest.mark.asyncio
async def test_chatbot_messages_labeled_chatbot_not_caseworker(
    async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """CASEWORKER role must appear as 'Chatbot', CLIENT role as 'Client'."""
    base = datetime(2026, 1, 1, 12, 0, 0)
    messages = [
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CASEWORKER,
            content="How are you doing today?",
            section="General",
            created_at=base,
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            from_role=IntakeMessageRole.CLIENT,
            content="I'm doing well, thanks.",
            section="General",
            created_at=base + timedelta(seconds=1),
        ),
    ]
    for msg in messages:
        async_session.add(msg)
    await async_session.commit()

    render_patch, captured = _capture_render()
    with render_patch:
        with patch("app.routes.intake_admin_router.check_access"):
            await generate_chat_history_pdf(
                intake_id=mock_intake.id,
                session=async_session,
                pseudonymized_id="test_pseudonymized_id",
                auth_user_context=AUTH_CONTEXT,
            )

    senders = [m["sender"] for m in captured["sections"][0]["messages"]]
    assert senders == ["Chatbot", "Client"]
