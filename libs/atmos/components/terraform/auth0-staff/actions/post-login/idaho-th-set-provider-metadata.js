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
 * Backend webhook secrets (IDAHO_TH_BACKEND_*) and IDAHO_TH_CLIENT_ID live on
 * the shared action module (recidiviz-action-helpers), not on this action.
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

const { randomUUID } = require("crypto");
const {
  callIdahoThSignedWebhook,
  isIdahoThClient,
  normalizeEmail,
} = require("actions:recidiviz-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_PROVIDER = "provider";
// Must match SIGNED_WEBHOOK_ROUTES.linkProvider on
// prototype/idaho-transitional-housing-v2
// (libs/@idaho-th/trpc/src/auth/webhookSignature.ts).
const LINK_PROVIDER_PATH = "internal/link-provider";

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set([
  "Username-Password-Authentication",
  "google-oauth2",
  // "idaho-state-sso", // uncomment when IDOC AD SSO is configured
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
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

  const res = await callIdahoThSignedWebhook(LINK_PROVIDER_PATH, {
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

  const email = normalizeEmail(event.user.email);

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
