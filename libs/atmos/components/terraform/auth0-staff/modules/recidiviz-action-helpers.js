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

const { createHmac, randomUUID } = require("crypto");
const { GoogleAuth } = require("google-auth-library");
const Base64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

const IDAHO_TH_WEBHOOK_TIMEOUT_MS = 5000;

/**
 * Helper to check for a users email across common places an SSO-provider
 * might put it
 */
function getUserEmail(event) {
  const { email, emailaddress, emailAddress } = event.user;
  return email ?? emailaddress ?? emailAddress;
}

/**
 * Canonical form of an email used as a provider linking key. Action-side
 * normalize is strict about what we send; the idaho-th backend independently
 * re-normalizes and matches case-insensitively
 * (`findHousingProviderByEmail` on prototype/idaho-transitional-housing-v2).
 */
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

/**
 * True when the login is for the Idaho TH application. Fails closed: if
 * IDAHO_TH_CLIENT_ID is unset we cannot confirm the app, so we do NOT act
 * (return false). The secret is required in every environment.
 */
function isIdahoThClient(event) {
  const configured = (actions.secrets.IDAHO_TH_CLIENT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.includes(event.client?.client_id);
}

/**
 * Query the admin panel at the url stored in the secret RECIDIVIZ_ADMIN_PANEL_URL
 * and return the unwrapped response.
 *
 * Throws if the user does not exist
 *
 * @param userEmail{string}
 */
async function fetchUserRestrictions(userEmail) {
  const credentials = JSON.parse(
    actions.secrets.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  );

  /** Get user restrictions from Admin Panel backend */
  const auth = new GoogleAuth({ credentials });
  const client = await auth.getIdTokenClient(
    actions.secrets.RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE,
  );

  // some ID accounts come up with an onmicrosoft domain. This patches the email for the request
  const request_email = userEmail?.replace(
    "iddoc.onmicrosoft.com",
    "idoc.idaho.gov",
  );

  let userHash = Base64.stringify(SHA256(request_email?.toLowerCase()));
  if (userHash.startsWith("/")) {
    userHash = userHash.replace("/", "_");
  }
  const url = `${actions.secrets.RECIDIVIZ_ADMIN_PANEL_URL}auth/users/${userHash}`;

  const apiResponse = await client.request({ url, retry: true });
  return apiResponse.data;
}

function joinIdahoThBackendUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/**
 * Normalize a webhook path to the Fastify form used in the HMAC payload
 * (`/internal/...`). Callers often pass a relative path without a leading slash.
 *
 * This does not import SIGNED_WEBHOOK_ROUTES — Auth0 Actions cannot share the
 * idaho-th backend module. After normalization, the string MUST equal the
 * matching entry in SIGNED_WEBHOOK_ROUTES on the idaho-th backend
 * (prototype/idaho-transitional-housing-v2:
 * libs/@idaho-th/trpc/src/auth/webhookSignature.ts), because the backend signs
 * and verifies `${route}.${timestamp}.${nonce}.${rawBody}` with that exact route.
 */
function toSignedWebhookRoute(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * POST a signed Idaho TH backend webhook from an Auth0 Action.
 *
 * Uses action-module secrets (see auth0_action_module.recidiviz_action_helpers):
 * - IDAHO_TH_BACKEND_API_URL
 * - IDAHO_TH_BACKEND_WEBHOOK_SECRET
 *
 * Signs `${route}.${timestamp}.${nonce}.${rawBody}` with HMAC-SHA256 and sends
 * the shared secret plus signature headers expected by /internal/* webhooks. The
 * route binds the signature to a single endpoint.
 *
 * @param {string} path - Relative path, e.g. "internal/link-provider"
 * @param {object} payload - JSON body
 */
async function callIdahoThSignedWebhook(path, payload) {
  const baseUrl = actions.secrets.IDAHO_TH_BACKEND_API_URL;
  const secret = actions.secrets.IDAHO_TH_BACKEND_WEBHOOK_SECRET;

  if (!baseUrl || !secret) {
    throw new Error(
      "Missing Auth0 Action module secrets: IDAHO_TH_BACKEND_API_URL and/or IDAHO_TH_BACKEND_WEBHOOK_SECRET",
    );
  }

  // Sign the exact bytes we send. The backend recomputes the HMAC over the raw
  // body, so any tampering in transit (or a body that doesn't match the
  // signature) is rejected. The timestamp bounds replay; the nonce makes each
  // request single-use; the route prevents cross-endpoint replay.
  const route = toSignedWebhookRoute(path);
  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${route}.${timestamp}.${nonce}.${body}`)
    .digest("hex");

  return fetch(joinIdahoThBackendUrl(baseUrl, path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
      "x-idaho-th-timestamp": timestamp,
      "x-idaho-th-nonce": nonce,
      "x-idaho-th-signature": signature,
    },
    body,
    signal: AbortSignal.timeout(IDAHO_TH_WEBHOOK_TIMEOUT_MS),
  });
}

module.exports = {
  callIdahoThSignedWebhook,
  fetchUserRestrictions,
  getUserEmail,
  isIdahoThClient,
  normalizeEmail,
};
