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
 * Shared helpers for the Idaho TH Auth0 Actions in this tenant.
 *
 * Deploy as an Action Module named `idaho-th-action-helpers` (Actions →
 * Modules), then `require("actions:idaho-th-action-helpers")` from each
 * action. Both actions must be bound to the published version of this module;
 * see DEPLOYMENT.md.
 *
 * Counterpart to the production module at
 * libs/atmos/components/terraform/auth0-staff/modules/recidiviz-action-helpers.js,
 * which terraform publishes into the shared staff tenant. Two deliberate
 * differences, because this tenant is Idaho TH only and is applied by hand:
 *
 * - Secrets are read from the `event` passed in, not from the module-scoped
 *   `actions.secrets` the production module uses. The actions here already
 *   carry IDAHO_TH_CLIENT_ID / BACKEND_API_URL / BACKEND_WEBHOOK_SECRET, so
 *   taking `event` keeps one secrets surface rather than adding a second on
 *   the module.
 * - No roster/Admin Panel helpers. This tenant has no roster to read, so
 *   every identifier is derived here instead.
 *
 * No npm dependencies: everything below is node's own `crypto`, so the module
 * can be created in the console without configuring any.
 */

const { createHash, createHmac, randomUUID } = require("crypto");

const IDAHO_TH_WEBHOOK_TIMEOUT_MS = 5000;

/**
 * An email across the common places an SSO provider might put it.
 */
function getUserEmail(event) {
  const { email, emailaddress, emailAddress } = event.user;
  return email ?? emailaddress ?? emailAddress;
}

/**
 * Canonical form of an email used as a linking key. The backend independently
 * re-normalizes and matches case-insensitively, so this only has to be stable.
 */
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

/** Must match USER_ROLE in libs/@idaho-th/shared/src/constants/auth.ts. */
const IDAHO_TH_ROLE = { STAFF: "staff", PROVIDER: "provider" };

/**
 * Must match AUTH0_CONNECTION.PASSWORDLESS_EMAIL in
 * libs/@idaho-th/shared/src/constants/auth.ts.
 */
const IDAHO_TH_PROVIDER_CONNECTION_NAMES = new Set(["email"]);

function isIdahoThProviderConnection(event) {
  return IDAHO_TH_PROVIDER_CONNECTION_NAMES.has(
    (event.connection?.name || "").trim(),
  );
}

const RECIDIVIZ_STAFF_EMAIL_SUFFIX = "@recidiviz.org";

/**
 * Query parameter the login page puts on /authorize to say which role this
 * session is for. Must match the key the client sends.
 */
const ROLE_QUERY_PARAM = "idaho_th_role";

/**
 * Key the chosen role is stored under, so a renewal can recover it. Metadata
 * keys may only contain letters, numbers, underscores or hyphens.
 */
const ROLE_METADATA_KEY = "idahoThRole";

function isRecidivizStaffEmail(email) {
  return normalizeEmail(email).endsWith(RECIDIVIZ_STAFF_EMAIL_SUFFIX);
}

function asKnownRole(value) {
  return value === IDAHO_TH_ROLE.STAFF || value === IDAHO_TH_ROLE.PROVIDER
    ? value
    : undefined;
}

/**
 * The role this session is for, or undefined when nothing said.
 *
 * Both roles reach this tenant on the same passwordless connection for a
 * Recidiviz address, so the connection cannot tell them apart and the choice
 * has to be carried. It is read from three places in order of how current they
 * are: the authorize request on an interactive login, then refresh token
 * metadata, then session metadata.
 *
 * The fallbacks are not optional. `event.request.query` carries the parameter
 * only on the interactive login; every later token issuance for the same
 * session is a renewal with no authorize request behind it, and a role read
 * only from the query would be absent there — logging the person out on their
 * next page reload, or worse, silently re-deciding their role.
 *
 * Returning undefined is a valid answer and callers must treat it as "not
 * staff": an unreadable or absent choice has to land on the provider path,
 * which is gated by a provisioned row, rather than on the staff path.
 */
function getRequestedRole(event) {
  return (
    asKnownRole(event.request?.query?.[ROLE_QUERY_PARAM]) ??
    asKnownRole(event.refresh_token?.metadata?.[ROLE_METADATA_KEY]) ??
    asKnownRole(event.session?.metadata?.[ROLE_METADATA_KEY])
  );
}

/**
 * Pins the role to this session so renewals resolve to the same one.
 *
 * Written to both stores because they cover different renewal paths: refresh
 * token metadata rides the refresh grant and is scoped to the one token, while
 * session metadata survives silent authentication but is shared by every tab
 * on the SSO session. Each is wrapped because neither API is available on
 * every Auth0 plan, and a login must not fail over a store that is not there —
 * it degrades to re-reading the query parameter, which is exactly today's
 * behaviour.
 */
function persistRequestedRole(api, role) {
  if (!asKnownRole(role)) return;

  try {
    api.refreshToken?.setMetadata?.(ROLE_METADATA_KEY, role);
  } catch (err) {
    console.warn(
      "Idaho TH could not pin role to refresh token metadata:",
      err instanceof Error ? err.message : String(err),
    );
  }

  try {
    api.session?.setMetadata?.(ROLE_METADATA_KEY, role);
  } catch (err) {
    console.warn(
      "Idaho TH could not pin role to session metadata:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * True when this login is a Recidiviz address asking for the staff role on the
 * passwordless connection — the one case the staff action owns there.
 *
 * Both actions call this and must agree: Auth0 runs every action in the
 * trigger and a deny from any one of them ends the login, so the action that
 * does not own a login has to return silently rather than deny it.
 */
function isRecidivizPasswordlessStaffLogin(event) {
  return (
    isIdahoThProviderConnection(event) &&
    isRecidivizStaffEmail(getUserEmail(event)) &&
    getRequestedRole(event) === IDAHO_TH_ROLE.STAFF
  );
}

/**
 * True when the login is for the Idaho TH application. Fails closed: if
 * IDAHO_TH_CLIENT_ID is unset we cannot confirm the app, so we do NOT act
 * (return false). The secret is required in every environment.
 */
function isIdahoThClient(event) {
  const configured = (event.secrets.IDAHO_TH_CLIENT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.includes(event.client?.client_id);
}

/**
 * The identifier every Idaho TH query is scoped by, derived from the address.
 *
 * Derived rather than minted so it is stable across logins and across the two
 * actions: the same person reaching the app as staff and as a provider
 * resolves to the same value without either action reading what the other
 * wrote to app_metadata. Matches the production derivation exactly — same
 * hash, same encoding, same length — so an identifier minted here is the one
 * production would mint for that address.
 *
 * Returns undefined for an address that normalizes to nothing, so callers
 * fail closed rather than hashing the empty string.
 */
function generatePseudonymizedId(stateCode, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return undefined;
  return createHash("sha256")
    .update(`${stateCode}${normalized}`)
    .digest("base64url")
    .slice(0, 16);
}

function joinBackendUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/**
 * Signed POST to one of the backend's /internal/* webhooks.
 *
 * Signs the exact bytes sent: the backend recomputes the HMAC over the raw
 * body, so a body that does not match its signature is rejected. The timestamp
 * bounds replay and the nonce makes each request single-use. `route` is both
 * the path and part of the signed payload, so a signature minted for one
 * webhook cannot be replayed against another.
 *
 * Throws when the secrets are missing or the request fails; each caller
 * decides whether its own webhook fails open or closed.
 */
async function callIdahoThSignedWebhook(event, route, payload) {
  const baseUrl = event.secrets.BACKEND_API_URL;
  const secret = event.secrets.BACKEND_WEBHOOK_SECRET;

  if (!baseUrl || !secret) {
    throw new Error(
      "Missing Auth0 Action secrets: BACKEND_API_URL and/or BACKEND_WEBHOOK_SECRET",
    );
  }

  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${route}.${timestamp}.${nonce}.${body}`)
    .digest("hex");

  return fetch(joinBackendUrl(baseUrl, route), {
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
  generatePseudonymizedId,
  getRequestedRole,
  getUserEmail,
  IDAHO_TH_ROLE,
  isIdahoThClient,
  isIdahoThProviderConnection,
  isRecidivizPasswordlessStaffLogin,
  isRecidivizStaffEmail,
  normalizeEmail,
  persistRequestedRole,
};
