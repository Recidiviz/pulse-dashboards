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

import { CollectionSummary, TypesenseStore } from "../TypesenseStore";
import UserStore from "../UserStore";

const getToken = vi.fn().mockResolvedValue("test-token");
const mockUserStore = { getToken } as unknown as UserStore;

const HEALTH_OK = JSON.stringify({ ok: true, host: "https://typesense.test" });

const MOCK_COLLECTIONS: CollectionSummary[] = [
  {
    name: "clients",
    numDocuments: 12_345,
    numFields: 8,
    createdAt: 1_000_000,
  },
  {
    name: "residents",
    numDocuments: 5_678,
    numFields: 10,
    createdAt: 2_000_000,
  },
  {
    name: "supervisionStaff",
    numDocuments: 342,
    numFields: 7,
    createdAt: 3_000_000,
  },
];
const COLLECTIONS_OK = JSON.stringify(MOCK_COLLECTIONS);

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

  test("starts in needs-hydration state with no data", () => {
    expect(store.hydrationState.status).toBe("needs hydration");
    expect(store.host).toBeUndefined();
    expect(store.checkedAt).toBeUndefined();
    expect(store.collectionsSummary).toBeUndefined();
  });

  describe("hydrate()", () => {
    test("transitions to loading while in flight", () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      void store.hydrate();

      expect(store.hydrationState.status).toBe("loading");
    });

    test("transitions to hydrated and populates all fields on success", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(store.hydrationState.status).toBe("hydrated");
      expect(store.host).toBe("https://typesense.test");
      expect(store.checkedAt).toBeInstanceOf(Date);
      expect(store.collectionsSummary).toEqual(MOCK_COLLECTIONS);
    });

    test("stores undefined host when the health response omits it", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(store.hydrationState.status).toBe("hydrated");
      expect(store.host).toBeUndefined();
    });

    test("sends the Bearer token in the Authorization header", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/health",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/collections",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    test("falls back to an empty bearer token when getToken returns undefined", async () => {
      getToken.mockResolvedValue(undefined);
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer " }),
        }),
      );
    });

    test("stamps checkedAt even when the health check fails", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["Typesense reported unhealthy"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      expect(store.checkedAt).toBeInstanceOf(Date);
    });

    test("transitions to failed and surfaces the server message on an unhealthy health response", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["Typesense reported unhealthy"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const { error } = store.hydrationState as {
        status: "failed";
        error: Error & { status: number };
      };
      expect(error.message).toBe("Typesense reported unhealthy");
      expect(error.status).toBe(503);
    });

    test("transitions to failed on an unconfigured (500) health response", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          errors: ["TYPESENSE_HOST is not configured for this environment"],
        }),
        { status: 500 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const { error } = store.hydrationState as {
        status: "failed";
        error: Error & { status: number };
      };
      expect(error.message).toBe(
        "TYPESENSE_HOST is not configured for this environment",
      );
      expect(error.status).toBe(500);
    });

    test("does not fetch collections when health fails", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["Typesense reported unhealthy"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(store.collectionsSummary).toBeUndefined();
    });

    test("transitions to failed and surfaces the server message when collections fetch fails", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["collections unavailable"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const { error } = store.hydrationState as {
        status: "failed";
        error: Error;
      };
      expect(error.message).toBe("collections unavailable");
      expect(store.collectionsSummary).toBeUndefined();
    });

    test("does not start a second hydration when one is already in flight", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      const first = store.hydrate();
      const second = store.hydrate();
      await Promise.all([first, second]);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("is a no-op when already hydrated", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();
      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("refresh()", () => {
    test("resets all data and hydration state synchronously", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      await store.hydrate();

      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      store.refresh();

      expect(store.host).toBeUndefined();
      expect(store.checkedAt).toBeUndefined();
      expect(store.collectionsSummary).toBeUndefined();
      expect(store.hydrationState.status).toBe("loading");
    });

    test("triggers a new hydration after resetting", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      await store.hydrate();

      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      store.refresh();

      await vi.waitFor(() =>
        expect(store.hydrationState.status).toBe("hydrated"),
      );
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  describe("collections summary", () => {
    test("populates collectionsSummary with all entries from the response", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(store.collectionsSummary).toHaveLength(3);
      expect(store.collectionsSummary).toEqual(MOCK_COLLECTIONS);
    });

    test("fetches from /api/typesense/collections", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/collections",
        expect.any(Object),
      );
    });

    test("remains undefined when health fails", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: ["unhealthy"] }), {
        status: 503,
      });

      await store.hydrate();

      expect(store.collectionsSummary).toBeUndefined();
    });
  });
});
