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

// Compiles a resolved StaffScope into a Typesense filter_by string.
//
// Typesense `filter_by` syntax:
//   field:=value                — exact match
//   field:=[v1, v2, v3]         — match any-of
//   clause1 && clause2          — AND
//   clause1 || clause2          — OR
//   ( ... )                     — grouping for precedence
//   `value with spaces`         — backtick-quoted string for values with special chars

import type { BaseScope, SingleWorkflowsSystem, StaffScope } from "./types";

function quote(value: string): string {
  // Backtick-wrap to handle values with spaces, dashes, or other special chars.
  // Escape any backticks in the value itself.
  return `\`${value.replaceAll("`", "\\`")}\``;
}

// A clause that never matches any document. Used when the user has `none`
// as their base scope and no supervisor expansion to widen it.
const NEVER_MATCH_CLAUSE = "id:=`__no_match__`";

function compileBase(base: BaseScope): string | null {
  switch (base.kind) {
    case "unrestricted":
      return null;
    case "none":
      return NEVER_MATCH_CLAUSE;
    case "byEmail":
      return `email:=${quote(base.email)}`;
    case "byDistricts": {
      const list = base.districts.map(quote).join(", ");
      return `district:=[${list}]`;
    }
  }
}

// Returns just the user-scope predicate (base + optional supervisor expansion),
// without any stateCode or system discriminators. Returns null if unrestricted.
// Callers wrap with stateCode (and optional system) for the final filter_by.
export function compileUserScopePredicate(scope: StaffScope): string | null {
  const baseClause = compileBase(scope.base);

  if (!scope.expandToSupervisedStaff) return baseClause;

  const { userId } = scope.expandToSupervisedStaff;
  // `supervisorExternalId` is a single string; `supervisorExternalIds` is a
  // (string|null)[] — using the bracketed-list form `:=[userId]` makes the
  // array-membership intent explicit (matches if any element equals userId).
  const supervisorClause = `supervisorExternalId:=${quote(userId)} || supervisorExternalIds:=[${quote(userId)}]`;

  // Invariant from resolveStaffScope: expandToSupervisedStaff is never attached
  // to an unrestricted base (the resolver skips the expansion in that case
  // since it would be silently redundant).

  // If base is `none`, the supervisor expansion IS the entire predicate
  // (no email/district fallback to OR against).
  if (scope.base.kind === "none") return supervisorClause;

  return `(${baseClause}) || ${supervisorClause}`;
}

export interface ToTypesenseFilterClauses {
  stateCode: string;
  // Optional. Include for collections that carry a `system` field
  // (e.g. Phase 2's unified `opportunities` collection). Phase 1's per-system
  // collections (supervisionStaff/incarcerationStaff/etc.) don't need it.
  system?: SingleWorkflowsSystem;
}

export function toTypesenseFilter(
  scope: StaffScope,
  options: ToTypesenseFilterClauses,
): string {
  const stateClause = `stateCode:=${quote(options.stateCode)}`;
  const systemClause = options.system
    ? `system:=${quote(options.system)}`
    : null;
  const userClause = compileUserScopePredicate(scope);

  const clauses = [stateClause];
  if (systemClause !== null) clauses.push(systemClause);
  if (userClause !== null) {
    // Wrap the user clause in parens to preserve OR precedence under the
    // outer AND with stateCode / system.
    clauses.push(`(${userClause})`);
  }
  return clauses.join(" && ");
}

// Combines per-system scopes into a single cross-system filter_by. Use when a
// user has access to both SUPERVISION and INCARCERATION and a single scoped key
// must cover both.
export function toCrossSystemTypesenseFilter(
  scopes: {
    supervision?: StaffScope;
    incarceration?: StaffScope;
  },
  stateCode: string,
): string {
  const stateClause = `stateCode:=${quote(stateCode)}`;

  const perSystemClauses: string[] = [];
  if (scopes.supervision) {
    const user = compileUserScopePredicate(scopes.supervision);
    perSystemClauses.push(
      user === null
        ? `system:=${quote("SUPERVISION")}`
        : `(system:=${quote("SUPERVISION")} && (${user}))`,
    );
  }
  if (scopes.incarceration) {
    const user = compileUserScopePredicate(scopes.incarceration);
    perSystemClauses.push(
      user === null
        ? `system:=${quote("INCARCERATION")}`
        : `(system:=${quote("INCARCERATION")} && (${user}))`,
    );
  }

  if (perSystemClauses.length === 0) return stateClause;
  if (perSystemClauses.length === 1) {
    return `${stateClause} && ${perSystemClauses[0]}`;
  }
  return `${stateClause} && (${perSystemClauses.join(" || ")})`;
}
