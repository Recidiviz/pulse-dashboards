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

// Shared bootstrap and infrastructure for every Typesense scoped-key mint
// endpoint on this server. All mint handlers (caseload, and future person)
// derive their scoped keys from the same SEARCH-only parent key managed here.

import type { Client as TypesenseClient } from "typesense";

import { createLocalTypesenseClient } from "~@typesense/client";

import { isOfflineMode } from "../../utils/isOfflineMode";

export const SCOPED_KEY_TTL_SECONDS = 3600;

let typesenseClient: TypesenseClient | null = null;
export function getTypesenseClient(): TypesenseClient {
  if (!typesenseClient) {
    typesenseClient = createLocalTypesenseClient();
  }
  return typesenseClient;
}

let searchOnlyParentKey: string | null = null;
export function getSearchOnlyParentKey(): string | null {
  return searchOnlyParentKey;
}

/**
 * Prepares the search-only parent key that every scoped-key mint handler
 * derives from.
 *
 * `generateScopedSearchKey` only enforces scope when the parent is a SEARCH-only
 * key (an admin-derived scope is silently ignored by Typesense), so this
 * function makes sure such a key is available:
 *
 *   - dev / staging / production: `TYPESENSE_API_SEARCH_KEY` is already the
 *     search-only key, pre-provisioned in
 *     libs/@typesense/client/env.<env>.enc.yaml and surfaced here via the
 *     SOPS plugin's `additional-sops-env-files`.
 *   - offline: no `TYPESENSE_API_SEARCH_KEY` env is set; the client uses the
 *     admin bootstrap key ("xyz") to talk to local Typesense, and we mint a
 *     fresh search-only sub-key from it. Orphan keys pile up in the offline
 *     cluster across restarts — fine for offline dev.
 *
 * Fired-and-forgotten from index.js AFTER `server.listen(...)`. Failure here
 * doesn't block the rest of the server — the mint endpoints return 500s with
 * a clear message until this resolves. This is a deliberate pre-prod stance
 * while Typesense-backed search is behind a flag; before it ships, flip
 * index.js to await this and exit on failure so a misconfigured env is caught
 * at boot rather than at first search.
 */
export async function initTypesenseScopedKeys(): Promise<void> {
  if (isOfflineMode()) {
    const admin = getTypesenseClient();
    const created = await admin.keys().create({
      actions: ["documents:search"],
      collections: ["*"],
      description: "scoped-key-parent (auto-created for offline dev)",
    });
    if (!created.value) {
      throw new Error(
        "Typesense did not return a value on key create — cannot derive scoped keys",
      );
    }
    searchOnlyParentKey = created.value;
    return;
  }

  const key = process.env["TYPESENSE_API_SEARCH_KEY"];
  if (!key) {
    throw new Error(
      "TYPESENSE_API_SEARCH_KEY is not set — cannot mint scoped Typesense keys",
    );
  }
  searchOnlyParentKey = key;
}
