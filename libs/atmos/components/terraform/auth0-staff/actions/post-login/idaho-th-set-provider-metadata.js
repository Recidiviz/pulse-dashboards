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

/**
 * Post Login Action for Idaho Transitional Housing — PROVIDER.
 *
 * Deploy to the Idaho TH Auth0 tenant (Actions → Triggers → post-login).
 * Pairs with post-login-set-idaho-th-staff-metadata.js; the two are mutually
 * exclusive by connection (a given login is handled by exactly one of them).
 *
 * Responsibilities:
 * - For provider (passwordless `email`) logins on the Idaho TH app only:
 *   reconciles the provider identity against the backend and sets the provider
 *   JWT custom claims (role: "provider") from the canonical DB pseudonymizedId.
 * - No-ops for staff connections (the staff action sets staff claims).
 * - Denies unsupported connections (fail closed), so this action is safe to
 *   deploy without the staff action (e.g. new env, DR).
 *
 * Scoping: no-ops for any application that is not the Idaho TH app (see
 * IDAHO_TH_CLIENT_ID), so other applications in the same tenant are never
 * touched — provider reconciliation runs only for the Idaho TH app.
 *
 * Must stay in sync with:
 * - libs/@idaho-th/shared/src/constants/auth.ts (USER_ROLE, AUTH0_CONNECTION)
 * - libs/@idaho-th/trpc/src/auth/constants.ts (AUTH0_NAMESPACE, APP_METADATA_KEY)
 *
 * Required Action secrets:
 * - IDAHO_TH_CLIENT_ID — Auth0 application (client) id of the Idaho TH app.
 *   Comma-separated list supported. If unset, the action does not scope by app
 *   (set it in every environment to avoid touching other apps in the tenant).
 * - IDAHO_TH_BACKEND_API_URL — base URL with trailing slash, e.g. https://api.example.com/
 * - IDAHO_TH_BACKEND_WEBHOOK_SECRET — shared secret for POST /internal/link-provider.
 *   Sent as the x-webhook-secret header AND used to HMAC-SHA256 sign each request
 *   (signature over `${timestamp}.${nonce}.${rawBody}`, with x-idaho-th-timestamp,
 *   x-idaho-th-nonce, x-idaho-th-signature headers). Must match the backend's
 *   BACKEND_WEBHOOK_SECRET exactly.
 *
 * Provider `pseudonymizedId` reconciliation:
 * - On every provider login, the Action calls POST /internal/link-provider.
 * - The backend returns the canonical DB `pseudonymizedId` on success.
 * - The Action uses that value for JWT claims and syncs Auth0 `app_metadata`,
 *   so Auth0 and the DB cannot drift after metadata loss or partial wipes.
 *
 * @param {Event} event - Details about the user and the login context.
 * @param {PostLoginAPI} api - Methods to change the behavior of the login.
 */

const { createHmac, randomUUID } = require("crypto");
const { isIdahoThClient } = require("actions:recidiviz-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_PROVIDER = "provider";
const LINK_PROVIDER_PATH = "internal/link-provider";
const LINK_REQUEST_TIMEOUT_MS = 5000;

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set([
  "Username-Password-Authentication",
  "google-oauth2",
  // "idaho-state-sso", // uncomment when IDOC AD SSO is configured
]);

function joinBackendUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

async function callLinkProviderWebhook(
  event,
  { email, auth0Sub, pseudonymizedId },
) {
  const baseUrl = event.secrets.IDAHO_TH_BACKEND_API_URL;
  const secret = event.secrets.IDAHO_TH_BACKEND_WEBHOOK_SECRET;

  if (!baseUrl || !secret) {
    throw new Error(
      "Missing Auth0 Action secrets: BACKEND_API_URL and/or BACKEND_WEBHOOK_SECRET",
    );
  }

  // Sign the exact bytes we send. The backend recomputes the HMAC over the raw
  // body, so any tampering in transit (or a body that doesn't match the
  // signature) is rejected. The timestamp bounds replay; the nonce makes each
  // request single-use.
  const body = JSON.stringify({ email, auth0Sub, pseudonymizedId });
  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${body}`)
    .digest("hex");

  const signal = AbortSignal.timeout(LINK_REQUEST_TIMEOUT_MS);

  return fetch(joinBackendUrl(baseUrl, LINK_PROVIDER_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
      "x-idaho-th-timestamp": timestamp,
      "x-idaho-th-nonce": nonce,
      "x-idaho-th-signature": signature,
    },
    body,
    signal,
  });
}

/**
 * Reconciles a provider identity on every login. Returns the canonical
 * `pseudonymizedId` from the backend (DB source of truth).
 */
async function reconcileProviderIdentity(event, api, { email, auth0Sub }) {
  // Provisional value for first-time claim only; ignored by the backend once
  // the provider row is linked. Prefer existing Auth0 metadata when present.
  const provisionalPseudonymizedId =
    event.user.app_metadata?.pseudonymizedId || randomUUID();

  const res = await callLinkProviderWebhook(event, {
    email,
    auth0Sub,
    pseudonymizedId: provisionalPseudonymizedId,
  });

  if (res.status === 404) {
    api.access.deny(
      "Your account has not been set up. Please contact your administrator.",
    );
    return undefined;
  }

  if (res.status === 409) {
    api.access.deny(
      "Your account is already linked to another login. Please contact your administrator.",
    );
    return undefined;
  }

  if (!res.ok) {
    api.access.deny(
      "There was a problem authorizing your account. Please contact the Recidiviz team.",
    );
    return undefined;
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = undefined;
  }

  if (
    !payload ||
    payload.success !== true ||
    !isNonEmptyString(payload.pseudonymizedId)
  ) {
    api.access.deny(
      "There was a problem authorizing your account. Please contact the Recidiviz team.",
    );
    return undefined;
  }

  const canonicalPseudonymizedId = payload.pseudonymizedId;

  if (event.user.app_metadata?.pseudonymizedId !== canonicalPseudonymizedId) {
    api.user.setAppMetadata("pseudonymizedId", canonicalPseudonymizedId);
  }

  if (!event.user.app_metadata?.auth0SubLinked) {
    api.user.setAppMetadata("auth0SubLinked", true);
  }

  return canonicalPseudonymizedId;
}

exports.onExecutePostLogin = async (event, api) => {
  // Never touch other applications that share this tenant.
  if (!isIdahoThClient(event)) {
    return;
  }

  const connectionName = (event.connection?.name || "").trim();

  if (!PASSWORDLESS_CONNECTION_NAMES.has(connectionName)) {
    // Staff connections are handled by the staff action.
    if (STAFF_CONNECTION_NAMES.has(connectionName)) {
      return;
    }

    // Fail closed so this action is safe without the staff action installed.
    api.access.deny(
      "This login method is not supported for Idaho Transitional Housing.",
    );
    return;
  }

  // Normalize identically to the backend (trim + lowercase) so the linking key
  // matches on both sides.
  const email = (event.user.email || "").trim().toLowerCase();

  if (!email || !event.user.user_id) {
    api.access.deny("Provider account is missing required identity fields.");
    return;
  }

  let pseudonymizedId;
  try {
    pseudonymizedId = await reconcileProviderIdentity(event, api, {
      email,
      auth0Sub: event.user.user_id,
    });
    if (!pseudonymizedId) {
      return;
    }
  } catch (err) {
    console.error("Backend link failed:", err);
    api.access.deny(
      "There was a problem authorizing your account. Please contact the Recidiviz team.",
    );
    return;
  }

  const appMetadata = {
    stateCode: STATE_CODE,
    role: ROLE_PROVIDER,
    pseudonymizedId,
  };

  api.accessToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
  api.idToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
};
