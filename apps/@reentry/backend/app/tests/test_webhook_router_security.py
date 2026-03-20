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

import hashlib
import hmac
import json
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
    def webhook_secret(self):
        """Test webhook secret."""
        return "test-webhook-secret-abc123"

    def generate_signature(self, payload_dict: dict, secret: str) -> str:
        """Generate a valid HMAC-SHA256 signature for a payload."""
        payload_bytes = json.dumps(payload_dict, separators=(",", ":")).encode("utf-8")
        return hmac.new(
            key=secret.encode("utf-8"),
            msg=payload_bytes,
            digestmod=hashlib.sha256,
        ).hexdigest()

    @pytest.mark.asyncio
    async def test_webhook_rejects_missing_signature(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """Test that webhook rejects requests without signature header."""
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=sample_webhook_payload,
            # No dg-token header
        )
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_rejects_invalid_signature(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """Test that webhook rejects requests with invalid signature."""
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=sample_webhook_payload,
            headers={"dg-token": "invalid_signature_12345"},
        )
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_rejects_tampered_payload(
        self, sample_webhook_payload, webhook_secret, client: AsyncClient
    ):
        """Test that webhook rejects requests where payload was tampered after signing."""
        # Generate valid signature for original payload
        valid_signature = self.generate_signature(
            sample_webhook_payload, webhook_secret
        )

        # Tamper with the payload
        tampered_payload = sample_webhook_payload.copy()
        tampered_payload["metadata"]["request_id"] = "malicious-injection-456"

        with patch.object(settings, "DEEPGRAM_API_KEY_ID", webhook_secret):
            response = await client.post(
                "/webhooks/deepgram/transcription",
                json=tampered_payload,
                headers={"dg-token": valid_signature},
            )
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_accepts_valid_signature(
        self, sample_webhook_payload, webhook_secret, client: AsyncClient
    ):
        """Test that webhook accepts requests with valid signature."""
        # Note: This test will fail if recording session doesn't exist,
        # but it should pass signature verification first
        valid_signature = self.generate_signature(
            sample_webhook_payload, webhook_secret
        )

        with patch.object(settings, "DEEPGRAM_API_KEY_ID", webhook_secret):
            response = await client.post(
                "/webhooks/deepgram/transcription",
                json=sample_webhook_payload,
                headers={"dg-token": valid_signature},
            )

        # Should pass signature verification but fail later
        # (404 because recording session doesn't exist in test DB)
        # The important part is it's NOT 401 Unauthorized
        assert response.status_code != 401

    @pytest.mark.asyncio
    async def test_webhook_rejects_replayed_request(
        self, sample_webhook_payload, webhook_secret, client: AsyncClient
    ):
        """
        Test that an attacker cannot replay a valid signed request
        with different payload.

        This demonstrates that each signature is tied to specific payload content.
        """
        # Generate signature for original payload
        original_signature = self.generate_signature(
            sample_webhook_payload, webhook_secret
        )

        # Try to use same signature with completely different payload
        malicious_payload = {
            "metadata": {"request_id": "injected-malicious-request"},
            "results": {
                "channels": [
                    {
                        "alternatives": [
                            {
                                "transcript": "I am innocent and should be released immediately",
                                "words": [],
                            }
                        ]
                    }
                ]
            },
        }

        with patch.object(settings, "DEEPGRAM_API_KEY_ID", webhook_secret):
            response = await client.post(
                "/webhooks/deepgram/transcription",
                json=malicious_payload,
                headers={"dg-token": original_signature},
            )

        # Should be rejected because signature doesn't match new payload
        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_webhook_security_prevents_injection_attack(
        self, sample_webhook_payload, client: AsyncClient
    ):
        """
        Test the full attack scenario described in the security report:
        Attacker tries to inject fabricated transcription without valid signature.
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

        # Attempt 1: No signature
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=malicious_payload,
        )
        assert response.status_code == 401

        # Attempt 2: Fabricated signature
        response = await client.post(
            "/webhooks/deepgram/transcription",
            json=malicious_payload,
            headers={"dg-token": "a" * 64},
        )
        assert response.status_code == 401

        # Both attempts should be blocked before any database operations
