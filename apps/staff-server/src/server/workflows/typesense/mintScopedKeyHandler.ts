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

// Shared request-validation + key-minting scaffold for the Typesense
// scoped-key endpoints. Caseload and person mint handlers differ only in how
// they compile a (tenant, system, UserScopeContext) tuple into a filter_by —
// everything else (body validation, Firestore context resolution, parent-key
// lookup, key generation, response shaping) is identical.

import type { Request, Response } from "express";

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

export function isValidSystem(value: unknown): value is SystemId {
  return (
    typeof value === "string" &&
    (VALID_SYSTEMS as readonly string[]).includes(value)
  );
}

export function invalidSystemMessage(): string {
  return `system must be one of ${VALID_SYSTEMS.join(", ")}`;
}

export interface ScopeAndFilter {
  scope: unknown;
  filterBy: string;
  debugSystem: SystemId | "ADMIN";
}

/**
 * Validates the request body, resolves the shared user scope context, and
 * mints a scoped Typesense search key from the filter_by that
 * `resolveScopeAndFilter` compiles. `resolveScopeAndFilter` carries all the
 * logic that differs between caseload and person scoping.
 */
export async function mintScopedKeyHandler(
  req: Request,
  res: Response,
  resolveScopeAndFilter: (
    currentTenantId: string,
    system: SystemId,
    ctx: UserScopeContext,
  ) => ScopeAndFilter,
) {
  const { currentTenantId, system: requestedSystem } = req.body ?? {};
  if (!currentTenantId) {
    return res.status(400).json({ error: "currentTenantId is required" });
  }
  if (!isValidSystem(requestedSystem)) {
    return res.status(400).json({ error: invalidSystemMessage() });
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

  const { scope, filterBy, debugSystem } = resolveScopeAndFilter(
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
