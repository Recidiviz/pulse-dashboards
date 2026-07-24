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
 * Post Login Action for Idaho Transitional Housing — STAFF.
 *
 * Deploy to the Idaho TH Auth0 tenant (Actions → Triggers → post-login).
 * Pairs with post-login-set-idaho-th-provider-metadata.js; the two are mutually
 * exclusive by connection (a given login is handled by exactly one of them).
 *
 * Responsibilities:
 * - Sets staff JWT custom claims (role: "staff") from app_metadata.
 * - Denies unsupported connections (fail closed). The provider action mirrors
 *   this deny so either action is safe to deploy on its own.
 * - For the Google connection specifically, additionally denies any login
 *   whose email is not @recidiviz.org (fail closed). Google's own `hd`
 *   parameter is only a client-side hint on the account chooser and is not
 *   enforced server-side by Auth0, so this Action is the actual security
 *   boundary — mirrors the domain-allowlist precedent in
 *   libs/atmos/components/terraform/auth0-staff/actions/04-update-user-restrictions.js.
 *
 * ACCEPTED RISK: this is a domain-only gate, not a per-user allowlist. Unlike
 * the staff DB connection (an admin must manually create the account) or the
 * provider connection (reconciled against the backend DB, denies unprovisioned
 * accounts), Google auto-provisions a new Auth0 user on first login for
 * *anyone* with a valid @recidiviz.org credential — there is currently no
 * Staff table or allowlist to check against, and adding one is out of scope
 * for now. This means any current @recidiviz.org Google Workspace member
 * (and any account not promptly deprovisioned when someone leaves) gets
 * automatic "staff" access to Idaho TH state data. Revisit this once a
 * Staff table (or explicit allowlist secret) exists — see the finding in the
 * PR/security review that flagged this trade-off.
 *
 * Scoping: both actions no-op for any application that is not the Idaho TH app
 * (see IDAHO_TH_CLIENT_ID), so other applications in the same tenant are never
 * touched.
 *
 * Must stay in sync with:
 * - libs/@idaho-th/shared/src/constants/auth.ts (USER_ROLE, AUTH0_CONNECTION)
 * - libs/@idaho-th/trpc/src/auth/constants.ts (AUTH0_NAMESPACE, APP_METADATA_KEY)
 *
 * @param {Event} event - Details about the user and the login context.
 * @param {PostLoginAPI} api - Methods to change the behavior of the login.
 */

const {
  fetchUserRestrictions,
  getUserEmail,
  isIdahoThClient,
} = require("actions:recidiviz-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_STAFF = "staff";

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set([
  "Username-Password-Authentication",
  // "idaho-state-sso", // uncomment when IDOC AD SSO is configured
]);

exports.onExecutePostLogin = async (event, api) => {
  // Never touch other applications that share this tenant.
  if (!isIdahoThClient(event)) {
    return;
  }

  const connectionName = (event.connection?.name || "").trim();

  // Providers are handled by the provider action; leave their login untouched.
  if (PASSWORDLESS_CONNECTION_NAMES.has(connectionName)) {
    return;
  }

  // Fail closed: anything that is not a known staff connection is denied here.
  if (!STAFF_CONNECTION_NAMES.has(connectionName)) {
    api.access.deny(
      "This login method is not supported for Idaho Transitional Housing.",
    );
    return;
  }

  let pseudonymizedId = event.user.app_metadata?.pseudonymizedId;
  if (!pseudonymizedId) {
    const userEmail = getUserEmail(event);
    const restrictions = await fetchUserRestrictions(userEmail);
    pseudonymizedId = restrictions.pseudonymizedId;
    api.user.setAppMetadata("pseudonymizedId", pseudonymizedId);
  }

  const appMetadata = {
    stateCode: STATE_CODE,
    role: ROLE_STAFF,
    pseudonymizedId,
  };

  api.accessToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
  api.idToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
};
