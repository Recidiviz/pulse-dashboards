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
Tests for webhook security utilities.
"""

import hashlib
import hmac

import pytest

from app.utils.webhook_security import verify_deepgram_signature


class TestDeepgramSignatureVerification:
    """Test suite for Deepgram webhook signature verification."""

    @pytest.fixture
    def webhook_secret(self):
        """Sample webhook secret for testing."""
        return "test-webhook-secret-12345"

    @pytest.fixture
    def sample_payload(self):
        """Sample webhook payload."""
        return b'{"request_id": "test-123", "results": {"channels": []}}'

    @pytest.fixture
    def valid_signature(self, sample_payload, webhook_secret):
        """Generate a valid HMAC-SHA256 signature for the sample payload."""
        return hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=sample_payload,
            digestmod=hashlib.sha256,
        ).hexdigest()

    def test_valid_signature(self, sample_payload, valid_signature, webhook_secret):
        """Test that a valid signature is accepted."""
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=valid_signature,
            webhook_secret=webhook_secret,
        )
        assert result is True

    def test_invalid_signature(self, sample_payload, webhook_secret):
        """Test that an invalid signature is rejected."""
        invalid_signature = "0" * 64  # Wrong signature
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=invalid_signature,
            webhook_secret=webhook_secret,
        )
        assert result is False

    def test_missing_signature_header(self, sample_payload, webhook_secret):
        """Test that missing signature header is rejected."""
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=None,
            webhook_secret=webhook_secret,
        )
        assert result is False

    def test_empty_signature_header(self, sample_payload, webhook_secret):
        """Test that empty signature header is rejected."""
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header="",
            webhook_secret=webhook_secret,
        )
        assert result is False

    def test_tampered_payload(self, sample_payload, valid_signature, webhook_secret):
        """Test that signature verification fails when payload is tampered."""
        # Modify the payload after signature generation
        tampered_payload = sample_payload + b"malicious_data"
        result = verify_deepgram_signature(
            payload=tampered_payload,
            signature_header=valid_signature,
            webhook_secret=webhook_secret,
        )
        assert result is False

    def test_wrong_secret(self, sample_payload, valid_signature):
        """Test that signature verification fails with wrong secret."""
        wrong_secret = "wrong-secret"
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=valid_signature,
            webhook_secret=wrong_secret,
        )
        assert result is False

    def test_missing_webhook_secret(self, sample_payload, valid_signature):
        """Test that missing webhook secret is rejected."""
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=valid_signature,
            webhook_secret="",
        )
        assert result is False

    def test_signature_case_sensitivity(
        self, sample_payload, valid_signature, webhook_secret
    ):
        """Test that signature comparison is case-sensitive."""
        # HMAC signatures should be case-sensitive
        uppercase_signature = valid_signature.upper()
        result = verify_deepgram_signature(
            payload=sample_payload,
            signature_header=uppercase_signature,
            webhook_secret=webhook_secret,
        )
        # Should fail because hexdigest() returns lowercase
        assert result is False

    def test_various_payload_sizes(self, webhook_secret, valid_signature):
        """Test signature verification with different payload sizes."""
        # Test with empty payload
        empty_payload = b""
        empty_sig = hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=empty_payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        result = verify_deepgram_signature(
            payload=empty_payload,
            signature_header=empty_sig,
            webhook_secret=webhook_secret,
        )
        assert result is True

        # Test with large payload
        large_payload = b"x" * 10000
        large_sig = hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=large_payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        result = verify_deepgram_signature(
            payload=large_payload,
            signature_header=large_sig,
            webhook_secret=webhook_secret,
        )
        assert result is True

    def test_unicode_in_payload(self, webhook_secret):
        """Test signature verification with unicode characters in payload."""
        unicode_payload = '{"message": "Hello 世界 🌍"}'.encode("utf-8")
        unicode_sig = hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=unicode_payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        result = verify_deepgram_signature(
            payload=unicode_payload,
            signature_header=unicode_sig,
            webhook_secret=webhook_secret,
        )
        assert result is True
