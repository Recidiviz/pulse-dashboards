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

import { OAuth2Client } from "google-auth-library";

/**
 * Verifies the Google-signed OIDC identity token attached to push-style
 * invocations of `POST /internal/gcs-object-scanned` (e.g. Eventarc, or a
 * Cloud Run job calling back directly). Unlike the Auth0-Action webhook
 * (`webhookSignature.ts`), there is no shared secret or custom header here —
 * the caller can only prove its identity via this bearer token, so both the
 * token's audience (this endpoint's own URL) and the invoking service
 * account's email must be checked; checking email alone is not enough, since
 * an OIDC token minted for a *different* audience could otherwise be replayed
 * against this endpoint.
 */
export type VerifyGcsScanWebhookTokenFailureReason =
  | "missing_token"
  | "invalid_token"
  | "email_not_verified"
  | "unexpected_invoker";

export type VerifyGcsScanWebhookTokenResult =
  | { valid: true }
  | { valid: false; reason: VerifyGcsScanWebhookTokenFailureReason };

export type VerifyGcsScanWebhookTokenInput = {
  authorizationHeader: string | undefined;
  audience: string;
  expectedInvokerEmail: string;
};

export async function verifyGcsScanWebhookToken(
  input: VerifyGcsScanWebhookTokenInput,
): Promise<VerifyGcsScanWebhookTokenResult> {
  const idToken = input.authorizationHeader?.startsWith("Bearer ")
    ? input.authorizationHeader.slice("Bearer ".length).trim()
    : undefined;
  if (!idToken) {
    return { valid: false, reason: "missing_token" };
  }

  const oAuth2Client = new OAuth2Client();
  let payload;
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: input.audience,
    });
    payload = ticket.getPayload();
  } catch {
    return { valid: false, reason: "invalid_token" };
  }

  if (!payload || !payload.email_verified || !payload.email) {
    return { valid: false, reason: "email_not_verified" };
  }

  if (payload.email !== input.expectedInvokerEmail) {
    return { valid: false, reason: "unexpected_invoker" };
  }

  return { valid: true };
}
