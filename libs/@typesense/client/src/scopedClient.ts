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
// On first use, mints a scoped key from staff-server. Caches the key
// and the underlying Typesense client. Re-mints near expiry. Concurrent mint
// requests share a single in-flight promise.

import type {
  MultiSearchRequestsSchema,
  MultiSearchResponse,
} from "typesense/lib/Typesense/MultiSearch";

import { createTypesenseClient } from "./client";

interface ScopedKeyMintResponse {
  scopedKey: string;
  expiresAt: string;
  typesenseHost: string;
}

export interface CreateScopedTypesenseClientConfig {
  // Full URL of the mint endpoint (e.g. `${VITE_API_URL}/workflows/typesense-scoped-key`)
  mintEndpoint: string;
  // Builds the request body sent to the mint endpoint each time we re-mint.
  // Most importantly returns `currentTenantId`. Re-evaluated on every mint.
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
}

// Default document schema generic for results — callers can refine per-call
// if they want stricter typing. `Record<string, any>` is what the Typesense
// JS client uses for unstructured hits.
type AnyDoc = Record<string, unknown>;

export interface ScopedTypesenseClient {
  multiSearch<T extends Record<string, unknown> = AnyDoc>(
    requests: MultiSearchRequestsSchema,
  ): Promise<MultiSearchResponse<T[]>>;
  // Exposed for tests + debugging. Resolves to the current valid scoped key,
  // minting/refreshing as needed.
  getScopedKey(): Promise<string>;
  // Invalidates the cached key + client. Next request re-mints.
  reset(): void;
}

export function createScopedTypesenseClient(
  config: CreateScopedTypesenseClientConfig,
): ScopedTypesenseClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const refreshBufferMs = (config.refreshBufferSeconds ?? 300) * 1000;

  let currentKey: string | undefined;
  let currentExpiresAtMs: number | undefined;
  // Host is sourced from the mint response — BE owns the cluster URL. Stays
  // undefined until the first mint resolves.
  let currentHost: string | undefined;
  let inflightMint: Promise<string> | undefined;
  let cachedTypesenseClient:
    | ReturnType<typeof createTypesenseClient>
    | undefined;

  async function mintKey(): Promise<string> {
    const [authHeader, mintBody] = await Promise.all([
      Promise.resolve(config.getAuthHeader()),
      Promise.resolve(config.getMintRequestBody()),
    ]);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const response = await fetchImpl(config.mintEndpoint, {
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
    currentKey = data.scopedKey;
    currentExpiresAtMs = new Date(data.expiresAt).getTime();
    currentHost = data.typesenseHost;
    // Invalidate the cached Typesense client so the next getClient() rebuilds
    // it with the new apiKey + host.
    cachedTypesenseClient = undefined;
    return data.scopedKey;
  }

  async function getScopedKey(): Promise<string> {
    const now = Date.now();
    if (
      currentKey &&
      currentExpiresAtMs &&
      currentExpiresAtMs - now > refreshBufferMs
    ) {
      return currentKey;
    }

    if (inflightMint) return inflightMint;

    inflightMint = mintKey().finally(() => {
      inflightMint = undefined;
    });
    return inflightMint;
  }

  async function getTypesenseClient() {
    const key = await getScopedKey();
    if (!currentHost) {
      throw new Error(
        "Typesense host missing from mint response — BE should include `typesenseHost` in the /workflows/typesense-scoped-key payload",
      );
    }
    if (!cachedTypesenseClient) {
      cachedTypesenseClient = createTypesenseClient({
        host: currentHost,
        apiKey: key,
      });
    }
    return cachedTypesenseClient;
  }

  return {
    async multiSearch(requests) {
      const client = await getTypesenseClient();
      return client.multiSearch.perform(requests);
    },
    getScopedKey,
    reset() {
      currentKey = undefined;
      currentExpiresAtMs = undefined;
      currentHost = undefined;
      cachedTypesenseClient = undefined;
      inflightMint = undefined;
    },
  };
}
