// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import crypto from "crypto";

/**
 * Intercom Messenger "Identity Verification" hash: HMAC-SHA256 of the user_id
 * (the contact's namespaced external_id) keyed by the workspace's Identity
 * Verification secret. It proves to Intercom that the client is not
 * impersonating another user's conversations.
 *
 * The secret (INTERCOM_IDENTITY_VERIFICATION_SECRET) is server-only and must
 * never reach the browser. When it is unset — e.g. before Identity Verification
 * is enabled in the workspace — no hash is produced and the Messenger runs
 * unverified.
 */
export function computeIntercomUserHash(
  userId: string,
  secret: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(userId, "utf8")
    .digest("hex");
}
