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

// Mints a scoped Typesense API key for the authenticated user's person
// (client/resident) search bar. The filter_by baked into the key is a
// PERSON-doc scope, derived per-user from the shared UserScopeContext and
// compiled via resolvePersonScope in ~@typesense/client/scope.

import type { Request, Response } from "express";

import {
  type PersonScope,
  resolveCrossSystemPersonScopes,
  resolvePersonScope,
  type SingleWorkflowsSystem,
  toCrossSystemPersonTypesenseFilter,
  toPersonTypesenseFilter,
} from "~@typesense/client";
import type { SystemId } from "~datatypes";

import {
  mintScopedKeyHandler,
  type ScopeAndFilter,
} from "./mintScopedKeyHandler";
import type { UserScopeContext } from "./userScopeContext";

// Compiles the person-visibility scope (person-doc field names) into a
// Typesense filter_by clause.
function resolvePersonScopeAndFilter(
  currentTenantId: string,
  system: SystemId,
  ctx: UserScopeContext,
): ScopeAndFilter {
  if (ctx.isRecidivizUser) {
    const scope: PersonScope = { grants: [{ kind: "unrestricted" }] };
    return {
      scope,
      filterBy: toPersonTypesenseFilter(scope, { stateCode: currentTenantId }),
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
    staffExternalId: ctx.userId,
    supervisedStaffExternalIds: ctx.supervisedStaffExternalIds,
  };

  if (system === "ALL") {
    const scope = resolveCrossSystemPersonScopes(resolverInput);
    return {
      scope,
      filterBy: toCrossSystemPersonTypesenseFilter(scope, currentTenantId),
      debugSystem: system,
    };
  }

  const singleSystem: SingleWorkflowsSystem = system;
  const scope = resolvePersonScope({ ...resolverInput, system: singleSystem });
  return {
    scope,
    filterBy: toPersonTypesenseFilter(scope, { stateCode: currentTenantId }),
    debugSystem: system,
  };
}

/**
 * POST /api/:stateCode/workflows/person-scoped-key
 *
 * Mints a scoped Typesense API key for the authenticated user's person
 * (client/resident) search, filtered to their person-visibility scope per
 * the shared resolver in ~@typesense/client/scope.
 *
 * Body: { system: "SUPERVISION" | "INCARCERATION" | "ALL" }
 * Returns: { scopedKey: string, expiresAt: ISO8601, typesenseHost: string }
 */
export async function mintPersonScopedKey(req: Request, res: Response) {
  return mintScopedKeyHandler(req, res, resolvePersonScopeAndFilter);
}
