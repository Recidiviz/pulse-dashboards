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

import { type Client as TypesenseClient, Errors } from "typesense";

import { createLocalTypesenseClient } from "~@typesense/client";

import { isOfflineMode } from "../../utils/isOfflineMode";

export const SCOPED_KEY_TTL_SECONDS = 3600;

// Offline only. Typesense returns a key's `value` exactly once, at creation
// (`GET /keys` exposes only `value_prefix`), so a generated key can't be looked
// up on a later boot — pinning the value is what makes provisioning idempotent.
// Not a secret: offline's admin bootstrap key is the hardcoded "xyz" in
// libs/@typesense/tools/docker-compose.yaml.
export const OFFLINE_PARENT_KEY = "offline-scoped-key-parent";

let typesenseClient: TypesenseClient | null = null;
export function getTypesenseClient(): TypesenseClient {
  if (!typesenseClient) {
    typesenseClient = createLocalTypesenseClient();
  }
  return typesenseClient;
}

/**
 * Resolves the search-only parent key that every scoped-key mint handler
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
 *     admin bootstrap key ("xyz") to talk to local Typesense, and we provision
 *     `OFFLINE_PARENT_KEY` as a search-only sub-key of it.
 */
async function resolveSearchOnlyParentKey(): Promise<string> {
  if (isOfflineMode()) {
    const admin = getTypesenseClient();
    try {
      await admin.keys().create({
        actions: ["documents:search"],
        collections: ["*"],
        description: "scoped-key-parent (auto-provisioned for offline dev)",
        value: OFFLINE_PARENT_KEY,
      });
    } catch (err) {
      // 409 — already provisioned, the steady state after the first boot.
      // Anything else (Typesense not up yet) propagates so callers can retry.
      if (!(err instanceof Errors.ObjectAlreadyExists)) throw err;
    }
    return OFFLINE_PARENT_KEY;
  }

  const key = process.env["TYPESENSE_API_SEARCH_KEY"];
  if (!key) {
    throw new Error(
      "TYPESENSE_API_SEARCH_KEY is not set — cannot mint scoped Typesense keys",
    );
  }
  return key;
}

let searchOnlyParentKey: Promise<string> | null = null;

/**
 * Concurrent callers share one in-flight resolution.
 *
 * A failure drops the memo rather than caching the rejection, which offline
 * mode needs: `nx offline staff` starts this server and the Typesense container
 * in parallel, so boot-time resolution often loses the race. Without the retry
 * the process would serve 500s until restarted.
 */
export function ensureSearchOnlyParentKey(): Promise<string> {
  if (!searchOnlyParentKey) {
    searchOnlyParentKey = resolveSearchOnlyParentKey().catch((err) => {
      searchOnlyParentKey = null;
      throw err;
    });
  }
  return searchOnlyParentKey;
}

/**
 * Warms the parent key at boot. Fired-and-forgotten from index.js AFTER
 * `server.listen(...)`: a failure isn't terminal, since the mint endpoints
 * retry via `ensureSearchOnlyParentKey` — and this server also serves the
 * Pathways/Lantern/Workflows routes, which shouldn't be blocked by it.
 */
export async function initTypesenseScopedKeys(): Promise<void> {
  searchOnlyParentKey = null;
  await ensureSearchOnlyParentKey();
}
