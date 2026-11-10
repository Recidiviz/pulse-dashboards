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
 * A Recidiviz address reaches the passwordless connection as either role, so
 * the connection alone no longer decides: a login there asking for the staff
 * role belongs to the staff action and this one returns without denying it.
 * Auth0 runs every action in the trigger and a deny from any one ends the
 * login, so the action that does not own a login must stay silent.
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
 * Required Action module:
 * - idaho-th-action-helpers — the shared module in ./modules, published in
 *   this tenant and bound to this action. The require at the top of the file
 *   cannot resolve without it and every login this action owns fails, so add
 *   it before adding the action to the trigger. See DEPLOYMENT.md step 0b.
 *
 * Required Action secrets:
 * - IDAHO_TH_CLIENT_ID — Auth0 application (client) id of the Idaho TH app.
 *   Comma-separated list supported. If unset, the action does not scope by app
 *   (set it in every environment to avoid touching other apps in the tenant).
 * - BACKEND_API_URL — base URL with trailing slash, e.g. https://api.example.com/
 * - BACKEND_WEBHOOK_SECRET — shared secret for POST /internal/link-provider.
 *   Sent as the x-webhook-secret header AND used to HMAC-SHA256 sign each request
 *   (signature over `${route}.${timestamp}.${nonce}.${rawBody}`, with
 *   x-idaho-th-timestamp, x-idaho-th-nonce, x-idaho-th-signature headers). Must
 *   match the backend's BACKEND_WEBHOOK_SECRET exactly.
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

const {
  callIdahoThSignedWebhook,
  generatePseudonymizedId,
  getUserEmail,
  IDAHO_TH_ROLE,
  isIdahoThClient,
  isRecidivizPasswordlessStaffLogin,
  isRecidivizStaffEmail,
  normalizeEmail,
  persistRequestedRole,
} = require("actions:idaho-th-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_PROVIDER = "provider";
/** Must match SIGNED_WEBHOOK_ROUTES.linkProvider in webhookSignature.ts */
const LINK_PROVIDER_ROUTE = "/internal/link-provider";

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set(["Username-Password-Authentication"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

/**
 * Reconciles a provider identity on every login. Returns the canonical
 * `pseudonymizedId` from the backend (DB source of truth).
 */
async function reconcileProviderIdentity(event, api, { email, auth0Sub }) {
  // Provisional value for first-time claim only; ignored by the backend once
  // the provider row is linked. Derived rather than minted, so two concurrent
  // first logins propose the same value instead of racing two uuids, and so a
  // person who also reaches the app as staff proposes the same one there.
  const provisionalPseudonymizedId =
    event.user.app_metadata?.pseudonymizedId ||
    generatePseudonymizedId(STATE_CODE, email);

  const res = await callIdahoThSignedWebhook(event, LINK_PROVIDER_ROUTE, {
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

  // A Recidiviz address can reach this connection as either role, so the one
  // asking for staff belongs to the staff action. Returns rather than denies:
  // a deny here would end the login no matter what that action decides.
  if (isRecidivizPasswordlessStaffLogin(event)) {
    return;
  }

  // Normalize identically to the backend (trim + lowercase) so the linking key
  // matches on both sides.
  const email = normalizeEmail(getUserEmail(event));

  if (!email || !event.user.user_id) {
    api.access.deny("Provider account is missing required identity fields.");
    return;
  }

  // Record the provider choice for the one population that has a choice.
  // Session metadata is shared by every tab on the SSO session, so a Recidiviz
  // address that signed in as staff earlier would leave "staff" there; a
  // provider login that did not overwrite it would come back as staff on its
  // next renewal, which carries no role parameter to correct it.
  if (isRecidivizStaffEmail(email)) {
    persistRequestedRole(api, IDAHO_TH_ROLE.PROVIDER);
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Backend link failed:", errorMessage);
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
