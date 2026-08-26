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
// scoped-key endpoints. The scoping itself comes from the ScopedKeyMinter
// subclass each endpoint supplies.

import type { Request, Response } from "express";

import { isOfflineMode } from "../../utils/isOfflineMode";
import {
  ensureSearchOnlyParentKey,
  getTypesenseClient,
  SCOPED_KEY_TTL_SECONDS,
} from "./init";
import type { ScopeAndFiltersResolver, UserScopeContext } from "./types";
import {
  resolveRequestAppMetadata,
  resolveUserScopeContext,
} from "./userScopeContext";
import {
  authorizedSystems,
  invalidSystemMessage,
  isValidSystem,
  narrowToAuthorized,
} from "./utils";

export async function mintScopedKeyHandler(
  req: Request,
  res: Response,
  createMinter: (
    currentTenantId: string,
    ctx: UserScopeContext,
  ) => ScopeAndFiltersResolver,
) {
  const currentTenantId = req.params["stateCode"]?.toUpperCase();
  const { system: requestedSystem } = req.body ?? {};
  if (!isValidSystem(requestedSystem)) {
    return res.status(400).json({ error: invalidSystemMessage() });
  }

  // `system` is client-supplied, and the per-state rules make some systems
  // broader than others — US_TN INCARCERATION is unrestricted, for one. Without
  // this check a supervision-only user could POST `system: "INCARCERATION"` and
  // mint a key for a system they have no route permission for.
  const system = narrowToAuthorized(
    requestedSystem,
    authorizedSystems(resolveRequestAppMetadata(req)),
  );
  if (!system) {
    return res.status(403).json({
      error: `User is not authorized to access system: ${requestedSystem}`,
    });
  }

  const ctx = await resolveUserScopeContext(req, currentTenantId);
  if (!ctx) {
    return res.status(422).json({ error: "User has no externalId" });
  }

  let parentKey: string;
  try {
    parentKey = await ensureSearchOnlyParentKey();
  } catch (err) {
    // The memo was dropped, so the next request retries.
    return res.status(500).json({
      error: `Typesense scoped-key parent unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // The narrowed system, not the requested one: an ALL request from a
  // single-system user mints only for the system they may search.
  const { scope, filtersByCollection, debugSystem } = createMinter(
    currentTenantId,
    ctx,
  ).resolve(system);

  const expiresAt = Math.floor(Date.now() / 1000) + SCOPED_KEY_TTL_SECONDS;
  // generateScopedSearchKey is a local HMAC over the parent key, so minting one
  // key per collection costs no extra round trips. They share an expiry, which
  // keeps the client's refresh logic a single deadline.
  const typesenseKeys = getTypesenseClient().keys();
  const keys = Object.fromEntries(
    Object.entries(filtersByCollection).map(([collection, filterBy]) => [
      collection,
      typesenseKeys.generateScopedSearchKey(parentKey, {
        filter_by: filterBy,
        expires_at: expiresAt,
      }),
    ]),
  );

  return res.json({
    keys,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    typesenseHost: process.env["TYPESENSE_HOST"] || "http://localhost:8108",
    ...(isOfflineMode() && {
      _debug: { filtersByCollection, scope, system: debugSystem },
    }),
  });
}
