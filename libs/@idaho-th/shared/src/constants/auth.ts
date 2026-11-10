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

export const AUTH0_NAMESPACE = "https://idaho_th.recidiviz.org" as const;

export const APP_METADATA_KEY = `${AUTH0_NAMESPACE}/app_metadata` as const;

export type IdahoThAppMetadata = {
  stateCode?: string;
  role?: string;
  pseudonymizedId?: string;
};

/**
 * Carries the `HousingProvider` id a provider request is acting as.
 *
 * An assertion, not a grant: the server re-checks it against the caller's
 * assignments on every request. It lives in a header rather than a URL, a query
 * parameter or browser storage so it never leaks into history, referrers or
 * analytics.
 */
export const IDAHO_TH_ACTIVE_PROVIDER_HEADER =
  "x-idaho-th-provider-id" as const;

/**
 * Message on the FORBIDDEN error a provider-scoped request gets when no active
 * organization can be resolved. The client matches it exactly to clear the
 * stored organization and route to the selection screen, so every other
 * forbidden error keeps the ordinary toast.
 *
 * Deliberately not UNAUTHORIZED: the host app wires that code to logout.
 */
export const HOUSING_PROVIDER_REQUIRED_MESSAGE =
  "Housing provider required" as const;

/**
 * Message on the FORBIDDEN error a provider-scoped request gets when the
 * organization it names is not one the caller is assigned to. The client
 * matches it exactly to clear the stored organization, route to the selection
 * screen and tell the user why.
 */
export const HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE =
  "You do not have access to the requested housing provider" as const;

export const USER_ROLE = {
  STAFF: "staff",
  PROVIDER: "provider",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const AUTH0_CONNECTION = {
  PASSWORDLESS_EMAIL: "email",
  STAFF_DATABASE: "Username-Password-Authentication",
  IDOC_SSO: "IDOC-AD-Connection",
} as const;

export const RECIDIVIZ_STAFF_EMAIL_DOMAIN = "recidiviz.org";

export const IDOC_STAFF_EMAIL_DOMAIN = "idoc.idaho.gov";

export const IDOC_STAFF_EMAIL_DOMAINS = [
  IDOC_STAFF_EMAIL_DOMAIN,
  "iddoc.onmicrosoft.com",
] as const;

export function isIdocStaffEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return IDOC_STAFF_EMAIL_DOMAINS.some((domain) =>
    normalized.endsWith(`@${domain}`),
  );
}

export function isRecidivizStaffEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${RECIDIVIZ_STAFF_EMAIL_DOMAIN}`);
}

export const SIGN_IN_FLOW = {
  STAFF_SSO: "staff-sso",
  STAFF_DATABASE: "staff-database",
  // A Recidiviz address that picked "Case Manager", signing in with an emailed
  // one-time code. Shares the provider connection; idaho_th_role tells the
  // post-login Actions which of them owns the login.
  RECIDIVIZ_STAFF_PASSWORDLESS: "recidiviz-staff-passwordless",
  PROVIDER: "provider",
} as const;

export type SignInFlow = (typeof SIGN_IN_FLOW)[keyof typeof SIGN_IN_FLOW];

export function parseStaffEmailAllowlist(raw?: string): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

/**
 * Whether this address is on the list of Recidiviz staff granted Idaho TH.
 *
 * Requires BOTH an exact list match AND the @recidiviz.org domain, so a
 * mis-set secret cannot hand staff access to an arbitrary domain.
 *
 * Read through isRecidivizStaffAuthorized, which is what both the sign-in
 * router and the Action's /internal/check-staff-authorized call consult.
 */
export function isAllowlistedRecidivizStaffEmail(
  email: string,
  allowlist: readonly string[],
): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    isRecidivizStaffEmail(normalized) &&
    allowlist.some((entry) => entry === normalized)
  );
}

// Pentest/QA fixture domain, staging only.
const TEST_EMAIL_DOMAIN = "recidiviz-test.org";

// User-type segment in pentester-<user-type>-<n>@recidiviz-test.org that maps to staff.
const TEST_STAFF_USER_TYPES = new Set(["housing-case-manager"]);

function isTestStaffEmail(normalizedEmail: string): boolean {
  const suffix = `@${TEST_EMAIL_DOMAIN}`;
  if (!normalizedEmail.endsWith(suffix)) return false;

  const localPart = normalizedEmail.slice(0, -suffix.length);
  const match = /^pentester-(.+)-\d+$/.exec(localPart);
  return match !== null && TEST_STAFF_USER_TYPES.has(match[1]);
}

// isStaging defaults to false; @recidiviz.org and the pentest fixture pattern
// are staging-only. In production, named Recidiviz staff reach the staff flow
// through isRecidivizStaffAuthorized, which requires an allowlist entry.
export function isStaffEmail(email: string, isStaging = false): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    isIdocStaffEmail(normalized) ||
    (isStaging && isRecidivizStaffEmail(normalized)) ||
    (isStaging && isTestStaffEmail(normalized))
  );
}

const CONNECTION_BY_FLOW: Record<SignInFlow, string> = {
  [SIGN_IN_FLOW.STAFF_SSO]: AUTH0_CONNECTION.IDOC_SSO,
  [SIGN_IN_FLOW.STAFF_DATABASE]: AUTH0_CONNECTION.STAFF_DATABASE,
  [SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS]:
    AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
  [SIGN_IN_FLOW.PROVIDER]: AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
};

/**
 * Only production has the IDOC connection: staging is a separate Auth0 tenant
 * without it, and local dev points at neither. The sign-in router already
 * decides this; this is the second line of defence, not the first.
 */
const NON_PRODUCTION_CONNECTION_BY_FLOW: Record<SignInFlow, string> = {
  ...CONNECTION_BY_FLOW,
  [SIGN_IN_FLOW.STAFF_SSO]: AUTH0_CONNECTION.STAFF_DATABASE,
};

export function getAuth0ConnectionForFlow(
  flow: SignInFlow,
  isProduction = false,
): string {
  return (
    isProduction ? CONNECTION_BY_FLOW : NON_PRODUCTION_CONNECTION_BY_FLOW
  )[flow];
}

/**
 * /authorize parameter the post-login Actions read to tell a Recidiviz staff
 * login from a provider login on the shared passwordless connection. Must
 * match ROLE_QUERY_PARAM in the Actions' idaho-th-action-helpers module.
 */
export const AUTH0_ROLE_QUERY_PARAM = "idaho_th_role";

/**
 * The role to send as AUTH0_ROLE_QUERY_PARAM, for the flows on the passwordless
 * connection. The other connections decide the role on their own.
 */
export function getAuth0RoleForFlow(flow: SignInFlow): UserRole | undefined {
  switch (flow) {
    case SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS:
      return USER_ROLE.STAFF;
    case SIGN_IN_FLOW.PROVIDER:
      return USER_ROLE.PROVIDER;
    default:
      return undefined;
  }
}
