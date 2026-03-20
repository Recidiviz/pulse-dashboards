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
Integration tests for webhook endpoint security.
"""

from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
class TestDeepgramWebhookSecurity:
    """Test suite for Deepgram webhook endpoint security."""

    @pytest.fixture
    def sample_webhook_payload(self):
        """Sample Deepgram webhook payload."""
        return {
            "metadata": {
                "request_id": "test-request-123",
                "created": "2026-03-17T12:00:00Z",
            },
            "results": {
                "channels": [
                    {
                        "alternatives": [
                            {
                                "transcript": "This is a test transcription",
                                "words": [],
                            }
                        ]
                    }
                ]
            },
        }

    @pytest.fixture
    def api_key_id(self):
        """Test API Key Identifier."""
        return "test-api-key-id-abc123"

    @pytest.mark.asyncio
    async def test_webhook_rejects_missing_token(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """Test that webhook rejects requests without dg-token header."""
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=sample_webhook_payload,
            # No dg-token header
        )
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_rejects_invalid_token(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """Test that webhook rejects requests with invalid dg-token."""
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=sample_webhook_payload,
            headers={"dg-token": "invalid_token_12345"},
        )
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_accepts_valid_token(
        self, sample_webhook_payload, api_key_id, client: AsyncClient
    ):
        """Test that webhook accepts requests with valid dg-token."""
        # Note: This test will fail if recording session doesn't exist,
        # but it should pass token verification first

        with patch.object(settings, "DEEPGRAM_API_KEY_ID", api_key_id):
            response = await client.post(
                "/webhooks/deepgram/transcription",
                json=sample_webhook_payload,
                headers={"dg-token": api_key_id},
            )

        # Should pass token verification but fail later
        # (404 because recording session doesn't exist in test DB)
        # The important part is it's NOT 401 Unauthorized
        assert response.status_code != 401

    @pytest.mark.asyncio
    async def test_webhook_rejects_wrong_api_key_id(
        self, sample_webhook_payload, api_key_id, client: AsyncClient
    ):
        """
        Test that webhook rejects requests with a different API Key ID.
        """
        # Use a different token than what's configured
        wrong_token = "different-api-key-id"

        with patch.object(settings, "DEEPGRAM_API_KEY_ID", api_key_id):
            response = await client.post(
                "/webhooks/deepgram/transcription",
                json=sample_webhook_payload,
                headers={"dg-token": wrong_token},
            )

        # Should be rejected because token doesn't match configured API Key ID
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_security_prevents_injection_attack(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """
        Test that attacker cannot inject fabricated transcription without valid token.

        Note: This token-based verification only confirms the request came from
        someone with the API Key ID. It does not cryptographically verify the
        payload integrity like HMAC would.
        """
        # Attacker crafts malicious payload
        malicious_payload = {
            "metadata": {"request_id": "legitimate-looking-id"},
            "results": {
                "channels": [
                    {
                        "alternatives": [
                            {
                                "transcript": "Fabricated content to influence reentry plan",
                                "words": [],
                            }
                        ]
                    }
                ]
            },
        }

        # Attempt 1: No token
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=malicious_payload,
        )
        assert response.status_code == 401

        # Attempt 2: Fabricated token
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=malicious_payload,
            headers={"dg-token": "fabricated-token-123"},
        )
        assert response.status_code == 401

        # Both attempts should be blocked before any database operations
