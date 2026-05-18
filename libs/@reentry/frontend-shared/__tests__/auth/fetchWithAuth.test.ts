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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWithAuth } from "../../src/auth/fetchWithAuth";
import { globalAuthStore } from "../../src/auth/globalAuthStore";

// vi.mock is hoisted before imports, so the factory runs before fetchWithAuth
// loads globalAuthStore — this gives us full control over the singleton.
vi.mock("../../src/auth/globalAuthStore", () => ({
  globalAuthStore: {
    getCachedToken: vi.fn(),
    getTokenFromAuth0Cache: vi.fn(),
  },
}));

const mockGetCachedToken = vi.mocked(globalAuthStore.getCachedToken);
const mockGetTokenFromAuth0Cache = vi.mocked(
  globalAuthStore.getTokenFromAuth0Cache,
);

function makeResponse(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response;
}

// Simulate localStorage for the node test environment which has no window/DOM.
function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe("fetchWithAuth", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let localStorage: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    mockFetch = vi.fn();
    localStorage = makeLocalStorageMock();

    vi.stubGlobal("fetch", mockFetch);
    // Stub window so the `typeof window !== "undefined"` guard in fetchWithAuth
    // resolves to true, enabling localStorage reads.
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("localStorage", localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("injects Authorization header when a token is available", async () => {
    mockGetCachedToken.mockResolvedValue("tok-abc");
    mockFetch.mockResolvedValue(makeResponse(200));

    await fetchWithAuth("http://api/test");

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["Authorization"]).toBe("Bearer tok-abc");
  });

  it("omits Authorization header when no token is available", async () => {
    mockGetCachedToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeResponse(200));

    await fetchWithAuth("http://api/test");

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("injects X-Impersonated-Email when impersonation is active", async () => {
    mockGetCachedToken.mockResolvedValue("tok-abc");
    localStorage.setItem("impersonated_email", "agent@example.com");
    mockFetch.mockResolvedValue(makeResponse(200));

    await fetchWithAuth("http://api/test");

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["X-Impersonated-Email"]).toBe("agent@example.com");
  });

  it("omits X-Impersonated-Email when not impersonating", async () => {
    mockGetCachedToken.mockResolvedValue("tok-abc");
    mockFetch.mockResolvedValue(makeResponse(200));

    await fetchWithAuth("http://api/test");

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["X-Impersonated-Email"]).toBeUndefined();
  });

  it("preserves caller-supplied headers alongside auth headers", async () => {
    mockGetCachedToken.mockResolvedValue("tok-abc");
    mockFetch.mockResolvedValue(makeResponse(200));

    await fetchWithAuth("http://api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Authorization"]).toBe("Bearer tok-abc");
  });

  it("retries once on 401 using a fresh token", async () => {
    mockGetCachedToken.mockResolvedValue("tok-stale");
    mockGetTokenFromAuth0Cache.mockResolvedValue("tok-fresh");
    mockFetch
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(200));

    const result = await fetchWithAuth("http://api/test");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const retryHeaders = mockFetch.mock.calls[1][1].headers as Record<
      string,
      string
    >;
    expect(retryHeaders["Authorization"]).toBe("Bearer tok-fresh");
    expect(result.status).toBe(200);
  });

  it("returns the 401 response without retrying when no fresh token is available", async () => {
    mockGetCachedToken.mockResolvedValue("tok-stale");
    mockGetTokenFromAuth0Cache.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeResponse(401));

    const result = await fetchWithAuth("http://api/test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(401);
  });
});
