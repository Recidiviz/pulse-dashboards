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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TypesenseStore } from "../TypesenseStore";
import UserStore from "../UserStore";

const getToken = vi.fn().mockResolvedValue("test-token");
const mockUserStore = { getToken } as unknown as UserStore;

describe("TypesenseStore", () => {
  let store: TypesenseStore;

  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "http://test-api");
    getToken.mockResolvedValue("test-token");
    store = new TypesenseStore(mockUserStore);
  });

  afterEach(() => {
    fetchMock.resetMocks();
    vi.clearAllMocks();
  });

  test("starts in pending state", () => {
    expect(store.health.status).toBe("pending");
    expect(store.health.isFetching).toBe(false);
    expect(store.health.checkedAt).toBeUndefined();
    expect(store.health.error).toBeUndefined();
  });

  test("transitions to success and records checkedAt on a healthy response", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ ok: true, host: "https://test.com" }),
    );

    await store.fetchHealth();

    expect(store.health.status).toBe("success");
    expect(store.health.error).toBeUndefined();
    expect(store.health.isFetching).toBe(false);
    expect(store.health.checkedAt).toBeInstanceOf(Date);
    expect(store.health.host).toBe("https://test.com");
  });

  test("leaves host undefined when the response omits it", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));

    await store.fetchHealth();

    expect(store.health.status).toBe("success");
    expect(store.health.host).toBeUndefined();
  });

  test("sends the Bearer token in the Authorization header", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));

    await store.fetchHealth();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-api/api/typesense/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  test("falls back to an empty bearer token when getToken returns undefined", async () => {
    getToken.mockResolvedValue(undefined);
    fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));

    await store.fetchHealth();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer " }),
      }),
    );
  });

  test("transitions to error and surfaces the server message on a non-2xx response", async () => {
    const errorResponse = [
      JSON.stringify({ status: 503, errors: ["Typesense reported unhealthy"] }),
      { status: 503 },
    ] as const;
    fetchMock.mockResponseOnce(...errorResponse);

    await store.fetchHealth();

    expect(store.health.status).toBe("error");
    expect(store.health.error?.message).toBe("Typesense reported unhealthy");
    expect(store.health.isFetching).toBe(false);
    expect(store.health.checkedAt).toBeInstanceOf(Date);
  });

  test("surfaces the not-configured server message", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 500,
        errors: ["TYPESENSE_HOST is not configured for this environment"],
      }),
      { status: 500 },
    );

    await store.fetchHealth();

    expect(store.health.status).toBe("error");
    expect(store.health.error?.message).toBe(
      "TYPESENSE_HOST is not configured for this environment",
    );
  });

  test("does not start a second concurrent fetch when one is already in flight", async () => {
    fetchMock.mockResponse(JSON.stringify({ ok: true }));

    const first = store.fetchHealth();
    const second = store.fetchHealth(); // should be a no-op
    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("refresh triggers a new fetchHealth call", async () => {
    fetchMock.mockResponse(JSON.stringify({ ok: true }));

    await store.fetchHealth();
    store.refreshHealth();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
