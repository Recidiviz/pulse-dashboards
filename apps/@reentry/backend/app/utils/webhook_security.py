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
Webhook security utilities for verifying external service signatures.
"""

import hashlib
import hmac
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


def verify_deepgram_signature(
    payload: bytes,
    signature_header: Optional[str],
    webhook_secret: str,
) -> bool:
    """
    Verify the HMAC-SHA256 signature of a Deepgram webhook request.

    Args:
        payload: The raw request body as bytes
        signature_header: The value of the 'dg-token' header
        webhook_secret: The webhook secret configured in Deepgram

    Returns:
        True if the signature is valid, False otherwise

    Security Notes:
        - Uses constant-time comparison to prevent timing attacks
        - Validates that signature exists before processing
        - Returns False for any errors to fail securely
    """
    if not signature_header:
        logger.warning("Missing dg-token header in webhook request")
        return False

    if not webhook_secret:
        logger.error("Webhook secret not configured")
        return False

    try:
        # Compute the expected signature
        # Deepgram uses HMAC-SHA256 with the webhook secret
        expected_signature = hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha256,
        ).hexdigest()

        # Use constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(expected_signature, signature_header)

        if not is_valid:
            logger.warning(
                "Invalid webhook signature",
                expected_length=len(expected_signature),
                received_length=len(signature_header),
            )

        return is_valid

    except Exception as e:
        logger.error("Error verifying webhook signature", error=str(e))
        return False
