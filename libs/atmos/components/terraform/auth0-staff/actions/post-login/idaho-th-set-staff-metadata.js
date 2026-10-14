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
 * - Registers the login with the backend (signed POST /internal/link-staff)
 *   so a HousingStaff row exists for them: the staff daily digest selects its
 *   recipients from that table, cmEmailOnFile on a submitted draft reads the
 *   email from it, and the Intercom contact is created by the same call. The
 *   call is one-way — see registerStaffWithBackend. JWT and tokens stay
 *   email-free.
 * - Denies unsupported connections (fail closed). The provider action mirrors
 *   this deny so either action is safe to deploy on its own.
 * - Denies any login whose roster restrictions are not for US_ID (fail
 *   closed) — see handleRosterStaffLogin for why that is re-checked on every
 *   login rather than trusted from app_metadata.
 * - Routes @recidiviz.org logins off the roster entirely. They are never on an
 *   Idaho roster, so the Admin Panel lookup would 404 for them and there is no
 *   pseudonymizedId to read. Authorization comes from the Idaho TH backend
 *   (signed POST /internal/check-staff-authorized) and the identifier is
 *   derived from the email.
 *
 * An account on the staff database connection is NOT authorization by itself.
 * That connection is shared tenant-wide, so an account on it says only that
 * some admin created it for some application. The backend holds the explicit
 * per-person grant, which is why the check is a call and not a domain test.
 *
 * It is deliberately the Idaho TH backend that answers, and not the Recidiviz
 * auth bucket update-user-restrictions.js reads for @recidiviz.org logins.
 * Every shared action in this tenant skips the Idaho TH app on purpose, and
 * reaching back into the Recidiviz permission system from a TH action would
 * re-couple what that pattern separates. Access is revoked by removing the
 * person from the backend's list.
 *
 * Scoping: both actions no-op for any application that is not the Idaho TH app
 * (see IDAHO_TH_CLIENT_ID), so other applications in the same tenant are never
 * touched.
 *
 * Must stay in sync with:
 * - libs/@idaho-th/shared/src/constants/auth.ts (USER_ROLE, AUTH0_CONNECTION)
 * - libs/@idaho-th/trpc/src/auth/constants.ts (AUTH0_NAMESPACE, APP_METADATA_KEY)
 * - libs/@idaho-th/trpc/src/auth/webhookSignature.ts
 *   (SIGNED_WEBHOOK_ROUTES.linkStaff, SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized)
 *
 * Backend webhook secrets (IDAHO_TH_BACKEND_*) live on the shared action
 * module (recidiviz-action-helpers), already configured there for the provider
 * action, so this needs no new terraform secret.
 *
 * @param {Event} event - Details about the user and the login context.
 * @param {PostLoginAPI} api - Methods to change the behavior of the login.
 */

const {
  callIdahoThSignedWebhook,
  fetchUserRestrictions,
  generatePseudonymizedId,
  getUserEmail,
  isIdahoThClient,
  normalizeEmail,
} = require("actions:recidiviz-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_STAFF = "staff";
// Must match SIGNED_WEBHOOK_ROUTES.linkStaff on
// prototype/idaho-transitional-housing-v4
// (libs/@idaho-th/trpc/src/auth/webhookSignature.ts).
const LINK_STAFF_PATH = "internal/link-staff";
// Must match SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized on
// prototype/idaho-transitional-housing-v4
// (libs/@idaho-th/trpc/src/auth/webhookSignature.ts).
const CHECK_STAFF_AUTHORIZED_PATH = "internal/check-staff-authorized";

const RECIDIVIZ_STAFF_EMAIL_SUFFIX = "@recidiviz.org";

const NOT_AUTHORIZED_MESSAGE =
  "Your account is not authorized for Idaho Transitional Housing.";

const MISSING_IDENTITY_MESSAGE =
  "Staff account is missing required identity fields.";

const STAFF_IDENTITY_CONFLICT_MESSAGE =
  "Your Recidiviz account is already linked to Idaho Transitional Housing " +
  "under a different identity. Please contact the Recidiviz team.";

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set([
  "Username-Password-Authentication",
  // "idaho-state-sso", // uncomment when IDOC AD SSO is configured
]);

/**
 * Asks the backend whether this Recidiviz address is authorized for Idaho TH.
 *
 * The staff database connection is shared tenant-wide across every state's
 * app, so an account existing on it says only that some admin created it for
 * some application — not that anyone granted this person Idaho TH access. The
 * roster carries that grant for IDOC staff; Recidiviz staff are on no roster,
 * so the backend answers for them, which keeps the decision in a system this
 * team owns rather than in a domain test.
 *
 * Fails closed in every direction: an unreachable backend, a non-2xx, an
 * unreadable body, or anything other than an explicit `authorized: true`
 * denies. Recidiviz staff cannot sign in at all today, so a backend that is
 * down — or that has not shipped this route yet — leaves them exactly where
 * they already are rather than letting anyone through.
 */
async function isRecidivizStaffAuthorized(email) {
  let res;
  try {
    res = await callIdahoThSignedWebhook(CHECK_STAFF_AUTHORIZED_PATH, {
      email,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Idaho TH check-staff-authorized failed:", errorMessage);
    return false;
  }

  if (!res.ok) {
    // 403 is the routine answer for someone who is not on the list; any other
    // status means the check itself did not work and is worth seeing.
    if (res.status !== 403) {
      console.error("Idaho TH check-staff-authorized returned", res.status);
    }
    return false;
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    console.error(
      "Idaho TH check-staff-authorized returned an unreadable body",
    );
    return false;
  }

  return payload?.authorized === true;
}

/**
 * Registers this login's `HousingStaff` row with the backend.
 *
 * That row is what the staff daily digest selects from, what supplies
 * `cmEmailOnFile` on a submitted draft, and what carries the Intercom contact;
 * a staff member who is never registered has none of them. The email is sent
 * here but never put in a token.
 *
 * TRUST BOUNDARY — do not "improve" this by adopting the backend's response.
 * `pseudonymizedId` is the identifier the app scopes case access by, and it is
 * settled before this call: from the Admin Panel roster for IDOC staff, from
 * the email for Recidiviz staff, who have no roster entry. This ships that
 * value one way; the response body is deliberately never read, so a bug or
 * compromise in the backend cannot put a different identity into a production
 * token.
 *
 * Returns whether the backend reported an identity conflict. Transport and
 * server errors are reported as no conflict: they cost this person their
 * digest email, not their access. A conflict is returned rather than acted on
 * here, because what it costs depends on where the pseudonymizedId came from.
 */
async function registerStaffWithBackend({ email, auth0Sub, pseudonymizedId }) {
  let res;
  try {
    res = await callIdahoThSignedWebhook(LINK_STAFF_PATH, {
      email,
      auth0Sub,
      pseudonymizedId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Idaho TH link-staff failed:", errorMessage);
    return { conflict: false };
  }

  if (res.status === 409) {
    // The backend stored this email under a different pseudonymizedId, so the
    // row is keyed away from this account's applications: the digest query
    // joins StaffHousingApplication.staffPseudonymizedId to
    // HousingStaff.pseudonymizedId, and will not match. Needs reconciling by
    // hand — the claim is never re-pointed at the backend's value.
    console.error(
      "Idaho TH link-staff identity conflict: this email already owns a HousingStaff row under a different pseudonymizedId.",
    );
    return { conflict: true };
  }

  if (!res.ok) {
    console.error("Idaho TH link-staff returned", res.status);
  }

  return { conflict: false };
}

/** Writes the identity this login resolved to into Auth0 and both tokens. */
function stampStaffIdentity(event, api, pseudonymizedId) {
  if (pseudonymizedId !== event.user.app_metadata?.pseudonymizedId) {
    api.user.setAppMetadata("pseudonymizedId", pseudonymizedId);
  }

  const appMetadata = {
    stateCode: STATE_CODE,
    role: ROLE_STAFF,
    pseudonymizedId,
  };

  api.accessToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
  api.idToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
}

/**
 * Recidiviz staff have no Idaho roster entry, so the roster path cannot
 * authorize them: the Admin Panel lookup 404s, and there is no
 * pseudonymizedId to read. The backend answers both questions the roster
 * answers for IDOC staff — may they in, and as whom — through
 * isRecidivizStaffAuthorized and a derived identifier.
 *
 * The identifier is always derived, never read back from app_metadata. It
 * costs nothing to recompute, and reading a cached value would make this
 * action's notion of who someone is depend on what other actions in the tenant
 * happen to write there.
 *
 * A conflict denies here. It leaves the account's applications keyed to a
 * pseudonymizedId its token does not carry, and there is no roster entry to
 * fall back on, so the portal would load empty rather than degraded. Saying so
 * plainly beats an empty page.
 */
async function handleRecidivizStaffLogin(event, api, { email, auth0Sub }) {
  if (!(await isRecidivizStaffAuthorized(email))) {
    api.access.deny(NOT_AUTHORIZED_MESSAGE);
    return;
  }

  const pseudonymizedId = generatePseudonymizedId(STATE_CODE, email);
  if (!pseudonymizedId) {
    api.access.deny(MISSING_IDENTITY_MESSAGE);
    return;
  }

  const { conflict } = await registerStaffWithBackend({
    email,
    auth0Sub,
    pseudonymizedId,
  });
  if (conflict) {
    api.access.deny(STAFF_IDENTITY_CONFLICT_MESSAGE);
    return;
  }

  stampStaffIdentity(event, api, pseudonymizedId);
}

/**
 * IDOC staff take their identity from the Admin Panel roster, which is also
 * what authorizes them: the staff DB connection is shared tenant-wide, so an
 * account whose restrictions belong to another state must not be stamped as
 * Idaho TH staff just because it can authenticate here. Re-checked on every
 * login rather than only when there is no cached identity, because other
 * actions in this tenant cache pseudonymizedId for non-Idaho accounts on that
 * same connection.
 *
 * A conflict does not deny. The roster value stays authoritative, so it costs
 * this person their digest email rather than their access.
 */
async function handleRosterStaffLogin(
  event,
  api,
  { userEmail, email, auth0Sub },
) {
  let restrictions;
  try {
    restrictions = await fetchUserRestrictions(userEmail);
  } catch (err) {
    // Throws when the roster has no entry for this email, which is a denial
    // and not an outage; either way there is no stateCode to authorize on.
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Idaho TH roster lookup failed:", errorMessage);
    api.access.deny(NOT_AUTHORIZED_MESSAGE);
    return;
  }

  if (restrictions?.stateCode !== STATE_CODE) {
    api.access.deny(NOT_AUTHORIZED_MESSAGE);
    return;
  }

  const { pseudonymizedId } = restrictions;
  if (!pseudonymizedId) {
    api.access.deny(MISSING_IDENTITY_MESSAGE);
    return;
  }

  await registerStaffWithBackend({ email, auth0Sub, pseudonymizedId });
  stampStaffIdentity(event, api, pseudonymizedId);
}

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

  const userEmail = getUserEmail(event);
  const identity = {
    userEmail,
    email: normalizeEmail(userEmail),
    auth0Sub: event.user.user_id,
  };

  // Fail closed once, so neither path below has to carry the absent case: an
  // account with no email cannot be authorized, and one with no subject cannot
  // be registered.
  if (!identity.email || !identity.auth0Sub) {
    api.access.deny(MISSING_IDENTITY_MESSAGE);
    return;
  }

  if (identity.email.endsWith(RECIDIVIZ_STAFF_EMAIL_SUFFIX)) {
    await handleRecidivizStaffLogin(event, api, identity);
    return;
  }

  await handleRosterStaffLogin(event, api, identity);
};
