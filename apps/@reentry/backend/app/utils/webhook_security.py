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
    Verify the dg-token header of a Deepgram webhook request.

    The dg-token header contains the API Key Identifier used in the original request.
    This is a simple token verification, not HMAC-based cryptographic verification.

    Args:
        payload: The raw request body as bytes (unused, kept for compatibility)
        signature_header: The value of the 'dg-token' header
        webhook_secret: The expected API Key Identifier

    Returns:
        True if the token is valid, False otherwise

    Security Notes:
        - Uses constant-time comparison to prevent timing attacks
        - Validates that token exists before processing
        - Returns False for any errors to fail securely
    """
    if not signature_header:
        logger.warning("Missing dg-token header in webhook request")
        return False

    if not webhook_secret:
        logger.error("API Key Identifier not configured")
        return False

    try:
        # Verify the token matches the expected API Key Identifier
        # Use constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(webhook_secret, signature_header)

        if not is_valid:
            logger.warning(
                "Invalid dg-token",
                expected_length=len(webhook_secret),
                received_length=len(signature_header),
            )

        return is_valid

    except Exception as e:
        logger.error("Error verifying dg-token", error=str(e))
        return False
