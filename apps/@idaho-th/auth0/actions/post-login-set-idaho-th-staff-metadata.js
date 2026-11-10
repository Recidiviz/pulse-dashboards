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
 * Pairs with post-login-set-idaho-th-provider-metadata.js. The two are
 * mutually exclusive, by connection everywhere except one case: a Recidiviz
 * address on the passwordless connection, where the connection carries both
 * roles and the requested role decides which action owns the login.
 *
 * Responsibilities:
 * - Sets staff JWT custom claims (role: "staff") from app_metadata.
 * - On the staff database connection, after `pseudonymizedId` is known, signed
 *   POST /internal/link-staff so the backend can upsert `HousingStaff` (email
 *   server-side only) + sync Intercom. JWT / tokens remain email-free.
 *   Fail-open except identity conflict (409). Not called on the passwordless
 *   path, where the row is provisioned in the Admin Panel and is what
 *   authorized the login in the first place.
 * - Denies unsupported connections (fail closed). The provider action mirrors
 *   this deny so either action is safe to deploy on its own.
 * - For @recidiviz.org logins, asks the backend whether this address is
 *   allowed in at all and derives their identifier from the email. Which
 *   question it asks depends on who issued the address — see below. Both fail
 *   closed in every direction: an unreachable backend, a non-2xx, an
 *   unreadable body, or anything other than an explicit `authorized: true`.
 *
 * Two staff connections, two grants:
 * - Staff database connection — signups are disabled and accounts are made by
 *   hand, so this tenant issued the address. /internal/check-staff-authorized
 *   answers, and in this tenant the domain itself is the grant.
 * - Passwordless connection, @recidiviz.org asking for the staff role — the
 *   address is whatever the person typed before proving they can read mail at
 *   it, so the domain cannot stand in for a grant.
 *   /internal/check-recidiviz-staff answers, and only a `HousingStaff` row
 *   provisioned in the Admin Panel grants.
 *
 * Staging has no IDOC connection, so IDOC addresses land on the database
 * connection; anything else is denied by the unsupported-connection branch.
 *
 * Scoping: both actions no-op for any application that is not the Idaho TH app
 * (see IDAHO_TH_CLIENT_ID), so other applications in the same tenant are never
 * touched.
 *
 * Must stay in sync with:
 * - libs/@idaho-th/shared/src/constants/auth.ts (USER_ROLE, AUTH0_CONNECTION)
 * - libs/@idaho-th/trpc/src/auth/constants.ts (AUTH0_NAMESPACE, APP_METADATA_KEY)
 * - libs/@idaho-th/trpc/src/auth/webhookSignature.ts
 *   (SIGNED_WEBHOOK_ROUTES.linkStaff, SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized,
 *   SIGNED_WEBHOOK_ROUTES.checkRecidivizStaff)
 * - libs/atmos/components/terraform/auth0-staff/actions/post-login/idaho-th-set-staff-metadata.js,
 *   the production counterpart. It reads the Admin Panel roster for IDOC staff;
 *   this tenant has no roster, so every identifier here is derived from the
 *   address by the shared module instead.
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
 * - BACKEND_API_URL — base URL with trailing slash.
 * - BACKEND_WEBHOOK_SECRET — shared secret for signed /internal/* webhooks.
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
  normalizeEmail,
  persistRequestedRole,
} = require("actions:idaho-th-action-helpers");

const NAMESPACE = "https://idaho_th.recidiviz.org";
const STATE_CODE = "US_ID";
const ROLE_STAFF = "staff";
const RECIDIVIZ_STAFF_EMAIL_SUFFIX = "@recidiviz.org";
const LINK_STAFF_ROUTE = "/internal/link-staff";
const CHECK_STAFF_AUTHORIZED_ROUTE = "/internal/check-staff-authorized";
/** Must match SIGNED_WEBHOOK_ROUTES.checkRecidivizStaff in webhookSignature.ts */
const CHECK_RECIDIVIZ_STAFF_ROUTE = "/internal/check-recidiviz-staff";

const NOT_AUTHORIZED_MESSAGE =
  "Your account is not authorized for Idaho Transitional Housing. Please contact the Recidiviz team.";

const PASSWORDLESS_CONNECTION_NAMES = new Set(["email"]);
const STAFF_CONNECTION_NAMES = new Set(["Username-Password-Authentication"]);

const IDOC_STAFF_EMAIL_DOMAINS = ["idoc.idaho.gov", "iddoc.onmicrosoft.com"];
// Pentest/QA fixture domain. Only the case-manager user type is staff here;
// pentester-housing-provider-* belongs to the provider flow.
const TEST_EMAIL_DOMAIN = "recidiviz-test.org";
const TEST_STAFF_USER_TYPES = new Set(["housing-case-manager"]);

function isTestStaffEmail(email) {
  const suffix = `@${TEST_EMAIL_DOMAIN}`;
  if (!email.endsWith(suffix)) return false;

  const localPart = email.slice(0, -suffix.length);
  const match = /^pentester-(.+)-\d+$/.exec(localPart);
  return match !== null && TEST_STAFF_USER_TYPES.has(match[1]);
}

/**
 * Whether this address belongs to a population that signs in as staff here.
 *
 * Not a grant, and not the only check: @recidiviz.org still has to pass the
 * backend below. Production bounds the same set from the Admin Panel roster;
 * this tenant has none, so the domains it issues accounts on stand in for one.
 *
 * Mirrors isStaffEmail in libs/@idaho-th/shared with isStaging true.
 */
function isKnownStaffEmail(email) {
  return (
    IDOC_STAFF_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`)) ||
    email.endsWith(RECIDIVIZ_STAFF_EMAIL_SUFFIX) ||
    isTestStaffEmail(email)
  );
}

/**
 * Asks the backend whether this Recidiviz address is authorized for Idaho TH.
 *
 * Recidiviz staff are on no Idaho roster, so there is nothing local to check
 * them against; the backend owns the grant and this is the only question that
 * admits them. On staging the backend treats the @recidiviz.org domain itself
 * as the grant, so every Recidiviz address answers true there — the call still
 * runs, which is what makes this path the same one production exercises.
 *
 * Fails closed in every direction: an unreachable backend, a non-2xx, an
 * unreadable body, or anything other than an explicit `authorized: true`.
 */
async function isRecidivizStaffAuthorized(event, email) {
  let res;
  try {
    res = await callIdahoThSignedWebhook(event, CHECK_STAFF_AUTHORIZED_ROUTE, {
      email,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Idaho TH check-staff-authorized failed:", errorMessage);
    return false;
  }

  if (!res.ok) {
    // 403 is the routine answer for someone who is not granted; anything else
    // means the check itself did not work and is worth seeing.
    if (res.status !== 403) {
      console.error("Idaho TH check-staff-authorized returned", res.status);
    }
    return false;
  }

  try {
    const payload = await res.json();
    return payload?.authorized === true;
  } catch {
    console.error(
      "Idaho TH check-staff-authorized returned an unreadable body",
    );
    return false;
  }
}

/**
 * Asks whether a `HousingStaff` row has been provisioned for this address.
 *
 * The grant for a Recidiviz address that arrives on the passwordless
 * connection. It cannot be the one above: that answer treats the domain itself
 * as the grant in this tenant, which is safe only where an admin issued the
 * account, and on this connection the address is whatever the person typed
 * before proving they can read mail at it. A row somebody provisioned in the
 * Admin Panel is the question that survives the move.
 *
 * Fails closed in every direction, like its database-connection counterpart:
 * an unreachable backend, a non-2xx, an unreadable body, or anything other
 * than an explicit `authorized: true` denies.
 */
async function isRecidivizStaffProvisioned(event, email) {
  let res;
  try {
    res = await callIdahoThSignedWebhook(event, CHECK_RECIDIVIZ_STAFF_ROUTE, {
      email,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Idaho TH check-recidiviz-staff failed:", errorMessage);
    return false;
  }

  if (!res.ok) {
    // 403 is the routine answer for an address with no provisioned row;
    // anything else means the check itself did not work and is worth seeing.
    if (res.status !== 403) {
      console.error("Idaho TH check-recidiviz-staff returned", res.status);
    }
    return false;
  }

  try {
    const payload = await res.json();
    return payload?.authorized === true;
  } catch {
    console.error("Idaho TH check-recidiviz-staff returned an unreadable body");
    return false;
  }
}

/**
 * Links this login to its `HousingStaff` row and returns the identifier the
 * backend considers canonical.
 *
 * The returned `pseudonymizedId` wins over the one we sent. It differs when a
 * `HousingStaff` row already owns this email under another identifier, which
 * the backend adopts (`ADOPTED`) — seeded rows, and wholesale on a staging
 * database restored from production, whose identifiers come from the Admin
 * Panel roster rather than from this derivation. Adopting keeps the account
 * working here; production refuses the same move, since a roster identifier is
 * authoritative there. See the TRUST BOUNDARY note on its
 * registerStaffWithBackend.
 *
 * Fails open: an unreachable backend must not block a login. It only fails
 * closed on 409, which is a genuine two-identities-one-address conflict.
 *
 * @returns {Promise<{ allowed: boolean, pseudonymizedId?: string }>}
 */
async function linkStaffIdentity(
  event,
  api,
  { email, auth0Sub, pseudonymizedId },
) {
  let res;
  try {
    res = await callIdahoThSignedWebhook(event, LINK_STAFF_ROUTE, {
      email,
      auth0Sub,
      pseudonymizedId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Backend link-staff failed:", errorMessage);
    return { allowed: true };
  }

  if (res.status === 409) {
    api.access.deny(
      "Your account is already linked to another login. Please contact your administrator.",
    );
    return { allowed: false };
  }

  if (!res.ok) {
    console.error("Backend link-staff returned", res.status);
    return { allowed: true };
  }

  try {
    const body = await res.json();
    // Only a well-formed string is allowed to override the local identifier.
    if (body && typeof body.pseudonymizedId === "string") {
      return { allowed: true, pseudonymizedId: body.pseudonymizedId };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      "Backend link-staff returned an unreadable body:",
      errorMessage,
    );
  }
  return { allowed: true };
}

exports.onExecutePostLogin = async (event, api) => {
  // Never touch other applications that share this tenant.
  if (!isIdahoThClient(event)) {
    return;
  }

  const connectionName = (event.connection?.name || "").trim();

  // A Recidiviz address reaches the passwordless connection as either role.
  // The one asking for staff is this action's; every other login there is a
  // provider's and belongs to the provider action.
  const isPasswordlessStaffLogin = isRecidivizPasswordlessStaffLogin(event);

  if (
    PASSWORDLESS_CONNECTION_NAMES.has(connectionName) &&
    !isPasswordlessStaffLogin
  ) {
    return;
  }

  // Fail closed: anything that is not a known staff connection is denied here.
  if (
    !STAFF_CONNECTION_NAMES.has(connectionName) &&
    !isPasswordlessStaffLogin
  ) {
    api.access.deny(
      "This login method is not supported for Idaho Transitional Housing.",
    );
    return;
  }

  const email = normalizeEmail(getUserEmail(event));

  if (!email || !event.user.user_id) {
    api.access.deny("Staff account is missing required identity fields.");
    return;
  }

  // Signups are disabled on this connection and accounts are made by hand, so
  // this is the second line rather than the first.
  if (!isPasswordlessStaffLogin && !isKnownStaffEmail(email)) {
    api.access.deny(NOT_AUTHORIZED_MESSAGE);
    return;
  }

  // Which question grants depends on who issued the address. On the staff
  // database connection this tenant did, so the domain stands in for a roster
  // it does not have; on the passwordless connection the person supplied it,
  // so only a provisioned row will do.
  const authorized = isPasswordlessStaffLogin
    ? await isRecidivizStaffProvisioned(event, email)
    : !email.endsWith(RECIDIVIZ_STAFF_EMAIL_SUFFIX) ||
      (await isRecidivizStaffAuthorized(event, email));

  if (!authorized) {
    api.access.deny(NOT_AUTHORIZED_MESSAGE);
    return;
  }

  // Pin the role before any claim is stamped, so a renewal — which carries no
  // authorize request and therefore no role parameter — resolves to the same
  // one rather than falling through to the provider path.
  if (isPasswordlessStaffLogin) {
    persistRequestedRole(api, IDAHO_TH_ROLE.STAFF);
  }

  let pseudonymizedId = generatePseudonymizedId(STATE_CODE, email);
  if (!pseudonymizedId) {
    api.access.deny("Staff account is missing required identity fields.");
    return;
  }
  api.user.setAppMetadata("pseudonymizedId", pseudonymizedId);

  // Nothing to link on this path. The row is what authorized the login a few
  // lines above, so it already exists, and the Admin Panel wrote it with this
  // same derivation — link-staff would look it up by the identifier we are
  // holding and update it to the values it already has. The Intercom contact
  // it would also sync is resolved by the digest on first send when absent, so
  // skipping costs nothing there either.
  if (!isPasswordlessStaffLogin) {
    const link = await linkStaffIdentity(event, api, {
      email,
      auth0Sub: event.user.user_id,
      pseudonymizedId,
    });
    if (!link.allowed) {
      return;
    }

    if (link.pseudonymizedId && link.pseudonymizedId !== pseudonymizedId) {
      pseudonymizedId = link.pseudonymizedId;
      api.user.setAppMetadata("pseudonymizedId", pseudonymizedId);
    }
  }

  const appMetadata = {
    stateCode: STATE_CODE,
    role: ROLE_STAFF,
    pseudonymizedId,
  };

  api.accessToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
  api.idToken.setCustomClaim(`${NAMESPACE}/app_metadata`, appMetadata);
};
