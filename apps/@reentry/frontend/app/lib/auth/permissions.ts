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

import type { UserAppMetadata } from "./types";

export function hasCPAPermission(
  userAppMetadata: UserAppMetadata | undefined,
): boolean {
  return userAppMetadata?.routes?.["cpa"] === true;
}

// Internal domains for access control
// In production/staging, only Recidiviz domains are allowed
// In dev/demo/local, Monadical is also allowed for development purposes
const RECIDIVIZ_DOMAINS = ["@recidiviz.org", "@recidiviz-test.org"];
const DEV_DOMAINS = ["@monadical.com"];

function getInternalDomains(): string[] {
  const env = process.env["NEXT_PUBLIC_ENVIRONMENT"];
  if (env === "staging" || env === "prod" || env === "production") {
    return RECIDIVIZ_DOMAINS;
  }
  return [...RECIDIVIZ_DOMAINS, ...DEV_DOMAINS];
}

export function isInternalUser(email: string | undefined | null): boolean {
  if (!email) return false;
  // When impersonating, treat the caller as a non-internal user
  // so that all dev controls are hidden
  if (
    typeof window !== "undefined" &&
    !!localStorage.getItem("impersonated_email")
  ) {
    return false;
  }
  const domains = getInternalDomains();
  return domains.some((domain) => email.endsWith(domain));
}
