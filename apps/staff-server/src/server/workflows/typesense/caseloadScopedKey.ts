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

// Mints a scoped Typesense API key for the authenticated user's caseload
// search bar. The filter_by baked into the key is a STAFF-side scope,
// derived per-user from the shared UserScopeContext and compiled via
// resolveCaseloadScope in ~@typesense/client/scope.

import type { Request, Response } from "express";

import {
  type CaseloadScope,
  resolveCaseloadScope,
  resolveCrossSystemCaseloadScopes,
  type SingleWorkflowsSystem,
  toCaseloadTypesenseFilter,
  toCrossSystemCaseloadTypesenseFilter,
} from "~@typesense/client";
import type { SystemId } from "~datatypes";

import {
  mintScopedKeyHandler,
  type ScopeAndFilter,
} from "./mintScopedKeyHandler";
import type { UserScopeContext } from "./userScopeContext";

// Compiles the caseload-visibility scope (staff-side field names) into a
// Typesense filter_by clause.
function resolveCaseloadScopeAndFilter(
  currentTenantId: string,
  system: SystemId,
  ctx: UserScopeContext,
): ScopeAndFilter {
  if (ctx.isRecidivizUser) {
    const scope: CaseloadScope = { base: { kind: "unrestricted" } };
    return {
      scope,
      filterBy: toCaseloadTypesenseFilter(scope, {
        stateCode: currentTenantId,
      }),
      debugSystem: "ADMIN",
    };
  }

  const activeFeatureVariants = {
    supervisionUnrestrictedSearch: Boolean(
      ctx.featureVariants["supervisionUnrestrictedSearch"],
    ),
    workflowsSupervisorSearch: Boolean(
      ctx.featureVariants["workflowsSupervisorSearch"],
    ),
  };

  // If the user has no staff record (e.g., a supervisor who isn't an officer
  // themselves), they still get a scope — derived from email + isSupervisor
  // + FVs. The state-baseline resolver handles the no-district case by
  // falling back to byEmail or `none`; supervisor expansion then layers in
  // the supervisorExternalId match.
  const resolverInput = {
    stateCode: currentTenantId,
    user: {
      id: ctx.userId,
      email: ctx.userEmail,
      district: ctx.district,
      overrideDistrictIds: ctx.overrideDistrictIds,
      roleSubtype: ctx.roleSubtype,
      hasCaseload: ctx.hasCaseload,
    },
    activeFeatureVariants,
    isSupervisor: ctx.isSupervisor,
  };

  if (system === "ALL") {
    // Leadership / cross-system users: resolve per-system scopes (rules can
    // differ per system — e.g. US_MI is district-scoped for SUPERVISION but
    // unrestricted for INCARCERATION) and compile into one filter_by with
    // `system` as the discriminator.
    const scope = resolveCrossSystemCaseloadScopes(resolverInput);
    return {
      scope,
      filterBy: toCrossSystemCaseloadTypesenseFilter(scope, currentTenantId),
      debugSystem: system,
    };
  }

  const singleSystem: SingleWorkflowsSystem = system;
  const scope = resolveCaseloadScope({
    ...resolverInput,
    system: singleSystem,
  });
  return {
    scope,
    filterBy: toCaseloadTypesenseFilter(scope, { stateCode: currentTenantId }),
    debugSystem: system,
  };
}

/**
 * POST /api/:stateCode/workflows/caseload-scoped-key
 *
 * Mints a scoped Typesense API key for the authenticated user's caseload
 * search, filtered to their staff-visibility scope per the shared resolver
 * in ~@typesense/client/scope.
 *
 * Body: { system: "SUPERVISION" | "INCARCERATION" | "ALL" }
 * Returns: { scopedKey: string, expiresAt: ISO8601, typesenseHost: string }
 */
export async function mintCaseloadScopedKey(req: Request, res: Response) {
  return mintScopedKeyHandler(req, res, resolveCaseloadScopeAndFilter);
}
