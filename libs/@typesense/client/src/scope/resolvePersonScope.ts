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

// Resolves the person-doc (clients/residents) visibility scope for a
// (user, tenant, system) tuple, by morphing a resolved CaseloadScope onto
// person-doc fields. This deliberately does not re-derive any of the
// state-baseline/supervisor-expansion rules in resolveCaseloadScope/stateScopes —
// it only translates the already-resolved staff scope, field by field:
//
//   CaseloadScope piece                          PersonScope grant
//   ---------------------------------------   -------------------------------
//   base: unrestricted                        unrestricted (short-circuits)
//   base: byDistricts([...])                  byField(district, [...])       — same ids, no enumeration
//   base: byEmail(email)                      byField(officerId, [staffExternalId]) — identity swap
//   base: none                                (no own grant)
//   expandToSupervisedStaff                   byField(officerId, [...supervisedStaffExternalIds])
//
// The two officerId translations above are the only places this resolver
// needs information beyond what resolveCaseloadScope already has (see
// ResolvePersonScopeInput.staffExternalId / supervisedStaffExternalIds).
import { resolveCaseloadScope } from "./resolveCaseloadScope";
import type {
  PersonGrant,
  PersonScope,
  ResolveCrossSystemPersonScopeInput,
  ResolvePersonScopeInput,
} from "./types";

export function resolvePersonScope(
  input: ResolvePersonScopeInput,
): PersonScope {
  const staffScope = resolveCaseloadScope(input);
  const { base, expandToSupervisedStaff } = staffScope;

  if (base.kind === "unrestricted") {
    return { grants: [{ kind: "unrestricted" }] };
  }

  const grants: PersonGrant[] = [];

  switch (base.kind) {
    case "byDistricts":
      grants.push({
        kind: "byField",
        field: "district",
        ids: base.districts,
      });
      break;
    case "byEmail":
      grants.push({
        kind: "byField",
        field: "officerId",
        ids: input.staffExternalId ? [input.staffExternalId] : [],
      });
      break;
    case "none":
      // No own grant — the supervisor expansion (if any) becomes the whole
      // scope, same as CaseloadScope's `none` handling.
      break;
  }

  if (expandToSupervisedStaff) {
    grants.push({
      kind: "byField",
      field: "officerId",
      ids: input.supervisedStaffExternalIds ?? [],
    });
  }

  return { grants };
}

// Resolves person scopes for both SUPERVISION (clients) and INCARCERATION
// (residents) in one pass. Use for leadership users where `currentSystem` is
// "ALL". Caller feeds the result into `toCrossSystemPersonTypesenseFilter`.
export function resolveCrossSystemPersonScopes(
  input: ResolveCrossSystemPersonScopeInput,
): { supervision: PersonScope; incarceration: PersonScope } {
  return {
    supervision: resolvePersonScope({ ...input, system: "SUPERVISION" }),
    incarceration: resolvePersonScope({ ...input, system: "INCARCERATION" }),
  };
}
