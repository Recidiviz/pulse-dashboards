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
// resolveStaffScope in ~@typesense/client/scope.

import type { Request, Response } from "express";

import {
  resolveCrossSystemStaffScopes,
  resolveStaffScope,
  type SingleWorkflowsSystem,
  type StaffScope,
  toCrossSystemTypesenseFilter,
  toTypesenseFilter,
} from "~@typesense/client";
import type { SystemId } from "~datatypes";

import { isOfflineMode } from "../../utils/isOfflineMode";
import {
  getSearchOnlyParentKey,
  getTypesenseClient,
  SCOPED_KEY_TTL_SECONDS,
} from "./init";
import {
  resolveUserScopeContext,
  type UserScopeContext,
} from "./userScopeContext";

const VALID_SYSTEMS = [
  "SUPERVISION",
  "INCARCERATION",
  "ALL",
] as const satisfies readonly SystemId[];

function isValidSystem(value: unknown): value is SystemId {
  return (
    typeof value === "string" &&
    (VALID_SYSTEMS as readonly string[]).includes(value)
  );
}

interface ScopeAndFilter {
  scope: StaffScope | { supervision: StaffScope; incarceration: StaffScope };
  filterBy: string;
  debugSystem: SystemId | "ADMIN";
}

// Compiles the caseload-visibility scope (staff-side field names) into a
// Typesense filter_by clause.
function resolveCaseloadScopeAndFilter(
  currentTenantId: string,
  system: SystemId,
  ctx: UserScopeContext,
): ScopeAndFilter {
  if (ctx.isRecidivizUser) {
    const scope: StaffScope = { base: { kind: "unrestricted" } };
    return {
      scope,
      filterBy: toTypesenseFilter(scope, { stateCode: currentTenantId }),
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
    const scope = resolveCrossSystemStaffScopes(resolverInput);
    return {
      scope,
      filterBy: toCrossSystemTypesenseFilter(scope, currentTenantId),
      debugSystem: system,
    };
  }

  const singleSystem: SingleWorkflowsSystem = system;
  const scope = resolveStaffScope({ ...resolverInput, system: singleSystem });
  return {
    scope,
    filterBy: toTypesenseFilter(scope, { stateCode: currentTenantId }),
    debugSystem: system,
  };
}

/**
 * POST /workflows/caseload-scoped-key
 *
 * Mints a scoped Typesense API key for the authenticated user's caseload
 * search, filtered to their staff-visibility scope per the shared resolver
 * in ~@typesense/client/scope.
 *
 * Body: { currentTenantId: string, system: "SUPERVISION" | "INCARCERATION" | "ALL" }
 * Returns: { scopedKey: string, expiresAt: ISO8601, typesenseHost: string }
 */
export async function mintCaseloadScopedKey(req: Request, res: Response) {
  const { currentTenantId, system: requestedSystem } = req.body ?? {};
  if (!currentTenantId) {
    return res.status(400).json({ error: "currentTenantId is required" });
  }
  if (!isValidSystem(requestedSystem)) {
    return res.status(400).json({
      error: `system must be one of ${VALID_SYSTEMS.join(", ")}`,
    });
  }

  const ctx = await resolveUserScopeContext(req, currentTenantId);
  if (!ctx) {
    return res.status(422).json({ error: "User has no externalId" });
  }

  const parentKey = getSearchOnlyParentKey();
  if (!parentKey) {
    // Server didn't call initTypesenseScopedKeys() before serving — a
    // bootstrap wiring bug, not a runtime condition. Surface as 500 with a
    // clear message.
    return res.status(500).json({
      error: "Typesense scoped-key parent not initialized on server startup",
    });
  }

  const { scope, filterBy, debugSystem } = resolveCaseloadScopeAndFilter(
    currentTenantId,
    requestedSystem,
    ctx,
  );

  const expiresAt = Math.floor(Date.now() / 1000) + SCOPED_KEY_TTL_SECONDS;
  const scopedKey = getTypesenseClient()
    .keys()
    .generateScopedSearchKey(parentKey, {
      filter_by: filterBy,
      expires_at: expiresAt,
    });

  return res.json({
    scopedKey,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    typesenseHost: process.env["TYPESENSE_HOST"] || "http://localhost:8108",
    ...(isOfflineMode() && {
      _debug: { filterBy, scope, system: debugSystem },
    }),
  });
}
