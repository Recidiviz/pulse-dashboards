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

import { resolveStateBase } from "./stateScopes";
import type {
  BaseScope,
  ResolveCrossSystemScopeInput,
  ResolveScopeInput,
  StaffScope,
} from "./types";

function applySupervisorExpansion(
  base: BaseScope,
  input: ResolveScopeInput,
): StaffScope {
  // Mirrors production: the supervisor-OR clause only fires when the base
  // scope adds a real constraint (StaffSubscription.ts only ORs the supervisor
  // clause inside its `if (staffFilter)` branch).
  const shouldExpand =
    Boolean(input.activeFeatureVariants.workflowsSupervisorSearch) &&
    input.isSupervisor &&
    base.kind !== "unrestricted";

  if (!shouldExpand) return { base };
  return { base, expandToSupervisedStaff: { userId: input.user.id } };
}

// Resolves the staff-visibility scope for a (user, tenant, system) tuple.
//
// Precedence (most permissive wins):
//   1. `supervisionUnrestrictedSearch` FV active → unrestricted
//   2. State baseline (per stateScopes.ts) → district / role / unrestricted
//   3. If `workflowsSupervisorSearch` FV active AND user supervises >= 1 staff
//      AND base is not unrestricted, OR-expand the base with the
//      supervisor-relationship clause.
//
// Per-user, the two opt-in FVs are effectively mutually exclusive (granted to
// different roles, not both to the same user). If both are set, the bypass
// wins and the supervisor clause is dropped — same as production.
export function resolveStaffScope(input: ResolveScopeInput): StaffScope {
  if (input.activeFeatureVariants.supervisionUnrestrictedSearch) {
    return { base: { kind: "unrestricted" } };
  }

  const base = resolveStateBase(input);
  return applySupervisorExpansion(base, input);
}

// Resolves staff scopes for both SUPERVISION and INCARCERATION in one pass.
// Use for leadership users where `currentSystem` is "ALL" — the per-system
// rules differ enough that a single StaffScope cannot capture the union
// (e.g. US_MI has district-scoped SUPR and unrestricted INC). Caller feeds
// the result into `toCrossSystemTypesenseFilter` to produce a single
// filter_by string covering both systems.
export function resolveCrossSystemStaffScopes(
  input: ResolveCrossSystemScopeInput,
): { supervision: StaffScope; incarceration: StaffScope } {
  return {
    supervision: resolveStaffScope({ ...input, system: "SUPERVISION" }),
    incarceration: resolveStaffScope({ ...input, system: "INCARCERATION" }),
  };
}
