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

import {
  BROWSER_SEARCHABLE_COLLECTIONS,
  createLocalTypesenseClient,
} from "~@typesense/client";

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
 *   - local `nx dev`: `TYPESENSE_API_SEARCH_KEY` comes from
 *     libs/@typesense/client/env.staging.enc.yaml, pulled in by the SOPS
 *     plugin's `additional-sops-env-files` on that target.
 *   - deployed staging / staging-demo / production: the same variable, but from
 *     that environment's OWN gae-*.enc.yaml. Those are separate copies of one
 *     value and nothing in the deploy keeps them in step, so a key that is
 *     correct for local dev is not thereby correct once deployed.
 *     TODO(OBT-55038): inject this at deploy time from a single secret, and
 *     drop the per-environment copies.
 *   - offline: no `TYPESENSE_API_SEARCH_KEY` env is set; the client uses the
 *     admin bootstrap key ("xyz") to talk to local Typesense, and we provision
 *     `OFFLINE_PARENT_KEY` as a search-only sub-key of it.
 *
 * A mismatch surfaces only at runtime, as every minted scoped key coming back
 * `Forbidden - a valid x-typesense-api-key header must be sent` — a message
 * that names neither the key nor the file. Typesense keys are also immutable,
 * so widening `BROWSER_SEARCHABLE_COLLECTIONS` means re-minting this key and
 * updating every copy. See libs/@typesense/client/README.md.
 */

/**
 * Typesense keys are immutable, so a stale one is deleted and remade. Offline
 * only: a dev cluster holds no real data.
 */
async function rescopeOfflineParentKeyIfStale(
  admin: TypesenseClient,
): Promise<void> {
  const want = [...BROWSER_SEARCHABLE_COLLECTIONS].sort();
  const prefix = OFFLINE_PARENT_KEY.slice(0, 4);

  const { keys } = await admin.keys().retrieve();
  const existing = keys.find((key) => key.value_prefix === prefix);
  if (!existing) return;

  const scope = [...(existing.collections ?? [])].sort();
  if (scope.length === want.length && scope.every((c, i) => c === want[i])) {
    return;
  }

  console.warn(
    `[typesense] offline parent key ${existing.id} is scoped to [${scope.join(", ")}] — rebuilding as [${want.join(", ")}]`,
  );
  await admin.keys(existing.id).delete();
  await admin.keys().create({
    actions: ["documents:search"],
    collections: [...BROWSER_SEARCHABLE_COLLECTIONS],
    description: "scoped-key-parent (auto-provisioned for offline dev)",
    value: OFFLINE_PARENT_KEY,
  });
}

async function resolveSearchOnlyParentKey(): Promise<string> {
  if (isOfflineMode()) {
    const admin = getTypesenseClient();
    try {
      await admin.keys().create({
        actions: ["documents:search"],
        // NOT ["*"] — a scoped key reaches anything its parent covers, so the
        // parent is the collection boundary.
        collections: [...BROWSER_SEARCHABLE_COLLECTIONS],
        description: "scoped-key-parent (auto-provisioned for offline dev)",
        value: OFFLINE_PARENT_KEY,
      });
    } catch (err) {
      // 409 — already provisioned, the steady state after the first boot.
      // Anything else (Typesense not up yet) propagates so callers can retry.
      if (!(err instanceof Errors.ObjectAlreadyExists)) throw err;
      await rescopeOfflineParentKeyIfStale(admin);
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
