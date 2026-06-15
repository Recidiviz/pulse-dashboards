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

// Per-state baseline scopes. Mirrors the per-state filter functions in
// apps/staff/src/WorkflowsStore/utils.ts.

import type { BaseScope, ResolveScopeInput, ResolveScopeUser } from "./types";

// US_MI auth-system stores district "10" but location records are "10 - WEST",
// "10 - CENTRAL", etc. Hardcoded for now; should be data-driven against the
// locations collection eventually.
const US_MI_DISTRICT_10_EXPANSION = [
  "10 - WEST",
  "10 - CENTRAL",
  "10 - NORTHEAST",
  "10 - NORTHWEST",
];

function districtBase(user: ResolveScopeUser): BaseScope {
  if (user.overrideDistrictIds && user.overrideDistrictIds.length > 0) {
    return { kind: "byDistricts", districts: user.overrideDistrictIds };
  }
  if (user.district) {
    return { kind: "byDistricts", districts: [user.district] };
  }
  // No district + no override. If the user has no caseload, they have no own
  // scope — return `none` so the supervisor expansion (if any) becomes the
  // entire filter. Otherwise restrict to own caseload via email.
  if (user.hasCaseload === false) {
    return { kind: "none" };
  }
  return { kind: "byEmail", email: user.email };
}

function usMiDistrictBase(user: ResolveScopeUser): BaseScope {
  // District-10 prefix expansion: only when no override is set.
  if (
    (!user.overrideDistrictIds || user.overrideDistrictIds.length === 0) &&
    user.district?.includes("10")
  ) {
    return { kind: "byDistricts", districts: US_MI_DISTRICT_10_EXPANSION };
  }
  return districtBase(user);
}

function usCaRoleSubtypeBase(user: ResolveScopeUser): BaseScope {
  // Parole Agent supervisors → unrestricted within state+system.
  if (user.roleSubtype === "SUPERVISION_OFFICER_SUPERVISOR") {
    return { kind: "unrestricted" };
  }

  // Parole Agents (officers) OR no-district fallback → own caseload (email).
  // If the user has no caseload, return `none` (same reasoning as districtBase).
  const noDistrict =
    !user.district &&
    (!user.overrideDistrictIds || user.overrideDistrictIds.length === 0);
  if (user.roleSubtype === "SUPERVISION_OFFICER" || noDistrict) {
    if (user.hasCaseload === false) {
      return { kind: "none" };
    }
    return { kind: "byEmail", email: user.email };
  }

  // Otherwise district-scoped.
  return districtBase(user);
}

export function resolveStateBase(input: ResolveScopeInput): BaseScope {
  const { stateCode, system, user } = input;

  switch (stateCode) {
    case "US_TN":
      return system === "SUPERVISION"
        ? districtBase(user)
        : { kind: "unrestricted" };

    case "US_ID":
      return system === "SUPERVISION"
        ? districtBase(user)
        : { kind: "unrestricted" };

    case "US_MI":
      return system === "SUPERVISION"
        ? usMiDistrictBase(user)
        : { kind: "unrestricted" };

    case "US_CA":
      return system === "SUPERVISION"
        ? usCaRoleSubtypeBase(user)
        : { kind: "unrestricted" };

    default:
      return { kind: "unrestricted" };
  }
}
