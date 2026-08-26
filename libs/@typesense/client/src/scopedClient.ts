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

// Browser-side Typesense client that hides scoped-key lifecycle from callers.
// On first use, mints scoped keys from staff-server. Caches them and the
// underlying Typesense client. Re-mints near expiry. Concurrent mint requests
// share a single in-flight promise.
//
// staff-server mints one key per collection, because a key's filter_by is
// validated against whichever collection it is used on and each collection
// declares a different subset of the fields a scope can name. Callers do not
// have to think about that: they issue one multi_search as before, and this
// client stamps each search with its own collection's key via Typesense's
// per-search `x-typesense-api-key`.

import type {
  MultiSearchRequestsSchema,
  MultiSearchResponse,
} from "typesense/lib/Typesense/MultiSearch";

import { createTypesenseClient } from "./client";

type ScopedKeyMintResponse = {
  // Collection name -> scoped key. All share one expiry.
  keys: Record<string, string>;
  expiresAt: string;
  typesenseHost: string;
};

export type CreateScopedTypesenseClientConfig = {
  // Builds the full URL of the mint endpoint (e.g.
  // `${VITE_API_URL}/api/${stateCode}/workflows/caseload-scoped-key`).
  // Re-evaluated on every mint so a tenant switch mints against the right
  // state-scoped route (the state is a path param, enforced server-side by
  // validateStateCode()).
  mintEndpoint: () => string;
  // Builds the request body sent to the mint endpoint each time we re-mint.
  getMintRequestBody: () =>
    | Record<string, unknown>
    | Promise<Record<string, unknown>>;
  // Returns the value for the Authorization header (typically "Bearer <auth0Token>").
  // Re-evaluated on every mint so a refreshed Auth0 token is picked up.
  // Returning null sends no Authorization header (e.g. offline mode).
  getAuthHeader: () => string | null | Promise<string | null>;
  // Override fetch for tests.
  fetchImpl?: typeof fetch;
  // How early to refresh the scoped key before it actually expires.
  // Default 5 minutes — gives the next query enough headroom to use the old key.
  refreshBufferSeconds?: number;
};

// Default document schema generic for results — callers can refine per-call
// if they want stricter typing. `Record<string, any>` is what the Typesense
// JS client uses for unstructured hits.
type AnyDoc = Record<string, unknown>;

export type ScopedTypesenseClient = {
  // Every search must name its `collection`, so this client can look up the key
  // scoped to it.
  multiSearch<T extends Record<string, unknown> = AnyDoc>(
    requests: MultiSearchRequestsSchema,
  ): Promise<MultiSearchResponse<T[]>>;
  // Exposed for tests + debugging. Resolves to the current valid scoped keys,
  // keyed by collection, minting/refreshing as needed.
  getScopedKeys(): Promise<Record<string, string>>;
  // Invalidates the cached keys + client. Next request re-mints.
  reset(): void;
};

export function createScopedTypesenseClient(
  config: CreateScopedTypesenseClientConfig,
): ScopedTypesenseClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const refreshBufferMs = (config.refreshBufferSeconds ?? 300) * 1000;

  let currentKeys: Record<string, string> | undefined;
  let currentExpiresAtMs: number | undefined;
  // Host is sourced from the mint response — BE owns the cluster URL. Stays
  // undefined until the first mint resolves.
  let currentHost: string | undefined;
  let inflightMint: Promise<Record<string, string>> | undefined;
  let cachedTypesenseClient:
    | ReturnType<typeof createTypesenseClient>
    | undefined;

  async function mintKeys(): Promise<Record<string, string>> {
    const [authHeader, mintBody] = await Promise.all([
      Promise.resolve(config.getAuthHeader()),
      Promise.resolve(config.getMintRequestBody()),
    ]);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const response = await fetchImpl(config.mintEndpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify(mintBody),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Typesense scoped-key mint failed: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    const data = (await response.json()) as ScopedKeyMintResponse;
    currentKeys = data.keys;
    currentExpiresAtMs = new Date(data.expiresAt).getTime();
    currentHost = data.typesenseHost;
    // Invalidate the cached Typesense client so the next getClient() rebuilds
    // it with the new apiKey + host.
    cachedTypesenseClient = undefined;
    return data.keys;
  }

  async function getScopedKeys(): Promise<Record<string, string>> {
    const now = Date.now();
    if (
      currentKeys &&
      currentExpiresAtMs &&
      currentExpiresAtMs - now > refreshBufferMs
    ) {
      return currentKeys;
    }

    if (inflightMint) return inflightMint;

    inflightMint = mintKeys().finally(() => {
      inflightMint = undefined;
    });
    return inflightMint;
  }

  async function getTypesenseClient(keys: Record<string, string>) {
    if (!currentHost) {
      throw new Error(
        "Typesense host missing from mint response — BE should include `typesenseHost` in the /workflows/typesense-scoped-key payload",
      );
    }
    if (!cachedTypesenseClient) {
      // Typesense still wants an api key on the request header itself. Any of
      // the minted keys satisfies that; the per-search keys stamped below are
      // what actually scope each result set, and a search's own key takes
      // precedence over the header for that search.
      const [headerKey] = Object.values(keys);
      cachedTypesenseClient = createTypesenseClient({
        host: currentHost,
        apiKey: headerKey,
      });
    }
    return cachedTypesenseClient;
  }

  return {
    async multiSearch(requests) {
      const keys = await getScopedKeys();
      const client = await getTypesenseClient(keys);

      const searches = requests.searches.map((search) => {
        const { collection } = search;
        const scopedKey = collection ? keys[collection] : undefined;
        if (!scopedKey) {
          // Fail closed. Falling back to the header key would run this search
          // under another collection's filter, which is a scope leak; running
          // it unscoped is worse.
          throw new Error(
            `No scoped Typesense key for collection "${collection ?? "(unnamed)"}". The mint endpoint returned keys for: ${Object.keys(keys).join(", ") || "(none)"}.`,
          );
        }
        return { ...search, "x-typesense-api-key": scopedKey };
      });

      return client.multiSearch.perform({ searches });
    },
    getScopedKeys,
    reset() {
      currentKeys = undefined;
      currentExpiresAtMs = undefined;
      currentHost = undefined;
      cachedTypesenseClient = undefined;
      inflightMint = undefined;
    },
  };
}
