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

import { hydrationFailure } from "~hydration-utils";

import {
  BackfillSummary,
  CollectionSchema,
  CollectionSummary,
  TypesenseFetchError,
  TypesenseStore,
} from "../TypesenseStore";
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

const MOCK_SCHEMAS: Record<string, CollectionSchema> = {
  clients: {
    name: "clients",
    fields: [
      {
        name: "stateCode",
        type: "string",
        facet: true,
        optional: false,
        sort: false,
      },
      {
        name: "allEligibleOpportunities",
        type: "string[]",
        facet: true,
        optional: false,
        sort: false,
      },
      {
        name: "pseudonymizedId",
        type: "string",
        facet: false,
        optional: false,
        sort: false,
      },
    ],
    num_documents: 12_345,
    default_sorting_field: "",
    enable_nested_fields: false,
    created_at: 1_000_000,
  },
  residents: {
    name: "residents",
    fields: [
      {
        name: "stateCode",
        type: "string",
        facet: true,
        optional: false,
        sort: false,
      },
      {
        name: "allEligibleOpportunities",
        type: "string[]",
        facet: true,
        optional: false,
        sort: false,
      },
      {
        name: "pseudonymizedId",
        type: "string",
        facet: false,
        optional: false,
        sort: false,
      },
    ],
    num_documents: 5_678,
    default_sorting_field: "",
    enable_nested_fields: false,
    created_at: 2_000_000,
  },
  supervisionStaff: {
    name: "supervisionStaff",
    fields: [
      {
        name: "stateCode",
        type: "string",
        facet: true,
        optional: false,
        sort: false,
      },
      {
        name: "district",
        type: "string",
        facet: true,
        optional: true,
        sort: false,
      },
      {
        name: "supervisorExternalId",
        type: "string",
        facet: true,
        optional: true,
        sort: false,
      },
    ],
    num_documents: 342,
    default_sorting_field: "",
    enable_nested_fields: false,
    created_at: 3_000_000,
  },
};

/** Queues mock responses for a complete successful hydration. */
function mockFullHydrate(): void {
  fetchMock.mockResponseOnce(HEALTH_OK);
  fetchMock.mockResponseOnce(COLLECTIONS_OK);
  fetchMock.mockResponseOnce(JSON.stringify(MOCK_SCHEMAS));
}

// Number of fetch calls in a single successful hydration:
//   health + collections + schemas (batch)
const HYDRATE_CALL_COUNT = 3;

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
    expect(store.collectionsSchema).toBeUndefined();
  });

  describe("hydrate()", () => {
    test("transitions to loading while in flight", () => {
      mockFullHydrate();

      void store.hydrate();

      expect(store.hydrationState.status).toBe("loading");
    });

    test("transitions to hydrated and populates all fields on success", async () => {
      mockFullHydrate();

      await store.hydrate();

      expect(store.hydrationState.status).toBe("hydrated");
      expect(store.host).toBe("https://typesense.test");
      expect(store.checkedAt).toBeInstanceOf(Date);
      expect(store.collectionsSummary).toEqual(MOCK_COLLECTIONS);
      expect(store.collectionsSchema).toBeDefined();
    });

    test("stores undefined host when the health response omits it", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      for (const { name } of MOCK_COLLECTIONS) {
        fetchMock.mockResponseOnce(JSON.stringify(MOCK_SCHEMAS[name]));
      }

      await store.hydrate();

      expect(store.hydrationState.status).toBe("hydrated");
      expect(store.host).toBeUndefined();
    });

    test("sends the Bearer token in the Authorization header", async () => {
      mockFullHydrate();

      await store.hydrate();

      for (const url of [
        "http://test-api/api/typesense/health",
        "http://test-api/api/typesense/collections",
        "http://test-api/api/typesense/schemas",
      ]) {
        expect(fetchMock).toHaveBeenCalledWith(
          url,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer test-token",
            }),
          }),
        );
      }
    });

    test("falls back to an empty bearer token when getToken returns undefined", async () => {
      getToken.mockResolvedValue(undefined);
      mockFullHydrate();

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

    test("surfaces the server message on an unhealthy health response", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["Typesense reported unhealthy"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const error = hydrationFailure(store);
      expect(error).toBeInstanceOf(TypesenseFetchError);
      expect(error?.message).toBe("Typesense reported unhealthy");
      expect((error as TypesenseFetchError).status).toBe(503);
      expect((error as TypesenseFetchError).endpoint).toBe("GET /health");
    });

    test("surfaces the server message on an unconfigured (500) health response", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          errors: ["TYPESENSE_HOST is not configured for this environment"],
        }),
        { status: 500 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const error = hydrationFailure(store) as TypesenseFetchError;
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

    test("surfaces the server message when collections fetch fails", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["collections unavailable"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const error = hydrationFailure(store);
      expect(error?.message).toBe("collections unavailable");
      expect((error as TypesenseFetchError).endpoint).toBe("GET /collections");
      expect(store.collectionsSummary).toBeUndefined();
    });

    test("does not start a second hydration when one is already in flight", async () => {
      mockFullHydrate();

      const first = store.hydrate();
      const second = store.hydrate();
      await Promise.all([first, second]);

      expect(fetchMock).toHaveBeenCalledTimes(HYDRATE_CALL_COUNT);
    });

    test("is a no-op when already hydrated", async () => {
      mockFullHydrate();

      await store.hydrate();
      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledTimes(HYDRATE_CALL_COUNT);
    });
  });

  describe("refresh()", () => {
    test("resets all data and hydration state synchronously", async () => {
      mockFullHydrate();
      await store.hydrate();

      mockFullHydrate();
      store.refresh();

      expect(store.host).toBeUndefined();
      expect(store.checkedAt).toBeUndefined();
      expect(store.collectionsSummary).toBeUndefined();
      expect(store.collectionsSchema).toBeUndefined();
      expect(store.hydrationState.status).toBe("loading");
    });

    test("triggers a new hydration after resetting", async () => {
      mockFullHydrate();
      await store.hydrate();

      mockFullHydrate();
      store.refresh();

      await vi.waitFor(() =>
        expect(store.hydrationState.status).toBe("hydrated"),
      );
      expect(fetchMock).toHaveBeenCalledTimes(HYDRATE_CALL_COUNT * 2);
    });

    test("does not call the backfill endpoint", async () => {
      mockFullHydrate();
      await store.hydrate();

      mockFullHydrate();
      store.refresh();

      await vi.waitFor(() =>
        expect(store.hydrationState.status).toBe("hydrated"),
      );
      expect(fetchMock).not.toHaveBeenCalledWith(
        "http://test-api/api/typesense/backfill",
        expect.anything(),
      );
    });
  });

  describe("collections summary", () => {
    test("populates collectionsSummary with all entries from the response", async () => {
      mockFullHydrate();

      await store.hydrate();

      expect(store.collectionsSummary).toHaveLength(3);
      expect(store.collectionsSummary).toEqual(MOCK_COLLECTIONS);
    });

    test("fetches from /api/typesense/collections", async () => {
      mockFullHydrate();

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

  describe("collections schema", () => {
    test("populates collectionsSchema with an entry for each collection", async () => {
      mockFullHydrate();

      await store.hydrate();

      expect(store.collectionsSchema).toEqual(MOCK_SCHEMAS);
    });

    test("fetches all schemas from /api/typesense/schemas in a single request", async () => {
      mockFullHydrate();

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/schemas",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledTimes(HYDRATE_CALL_COUNT);
    });

    test("sends the Bearer token for the schemas request", async () => {
      mockFullHydrate();

      await store.hydrate();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/schemas",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    test("surfaces the server message when the schemas request returns an error", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(COLLECTIONS_OK);
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["schemas unavailable"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.hydrationState.status).toBe("failed");
      const error = hydrationFailure(store) as TypesenseFetchError;
      expect(error.message).toBe("schemas unavailable");
      expect(error.status).toBe(503);
      expect(error.endpoint).toBe("GET /schemas");
      expect(store.collectionsSchema).toBeUndefined();
    });

    test("remains undefined when collections summary fails", async () => {
      fetchMock.mockResponseOnce(HEALTH_OK);
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["collections unavailable"] }),
        { status: 503 },
      );

      await store.hydrate();

      expect(store.collectionsSchema).toBeUndefined();
    });

    test("remains undefined when health fails", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: ["unhealthy"] }), {
        status: 503,
      });

      await store.hydrate();

      expect(store.collectionsSchema).toBeUndefined();
    });
  });

  describe("triggerBackfill()", () => {
    const MOCK_SUMMARY: BackfillSummary = {
      durationMs: 4_200,
      collections: [
        { name: "clients", pages: 3, imported: 12_345, failed: 0, deleted: 2 },
        { name: "residents", pages: 2, imported: 5_670, failed: 8, deleted: 0 },
      ],
      totals: { imported: 18_015, failed: 8, deleted: 2 },
    };

    test("records a successful outcome on the store", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      await store.triggerBackfill();

      expect(store.backfillInProgress).toBe(false);
      expect(store.lastBackfillOutcome).toMatchObject({
        status: "success",
        result: MOCK_SUMMARY,
        completedAt: expect.any(Date),
      });
    });

    test("POSTs to /api/typesense/backfill with the Bearer token", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      await store.triggerBackfill();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/backfill",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    test("POSTs an empty body when no collections are given", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      await store.triggerBackfill();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/backfill",
        expect.objectContaining({ body: JSON.stringify({}) }),
      );
    });

    test("forwards a collections filter in the request body", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      await store.triggerBackfill(["clients", "residents"]);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api/api/typesense/backfill",
        expect.objectContaining({
          body: JSON.stringify({ collections: ["clients", "residents"] }),
        }),
      );
    });

    test("does not mutate store hydration state", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      await store.triggerBackfill();

      expect(store.hydrationState.status).toBe("needs hydration");
    });

    test("sets backfillInProgress and backfillStartedAt before the fetch resolves", () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_SUMMARY));

      const promise = store.triggerBackfill();

      expect(store.backfillInProgress).toBe(true);
      expect(store.backfillStartedAt).toBeInstanceOf(Date);

      return promise;
    });

    test("records a TypesenseFetchError outcome on failure, without rejecting", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ errors: ["backfill already in progress"] }),
        { status: 409 },
      );

      await expect(store.triggerBackfill()).resolves.toBeUndefined();

      expect(store.backfillInProgress).toBe(false);
      expect(store.lastBackfillOutcome?.status).toBe("error");
      expect(
        store.lastBackfillOutcome?.status === "error" &&
          store.lastBackfillOutcome.error,
      ).toBeInstanceOf(TypesenseFetchError);
      expect(
        store.lastBackfillOutcome?.status === "error" &&
          store.lastBackfillOutcome.error,
      ).toMatchObject({
        message: "backfill already in progress",
        status: 409,
        endpoint: "POST /backfill",
      });
    });

    test("falls back to an HTTP status message when the response has no errors array", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}), { status: 500 });

      await store.triggerBackfill();

      expect(
        store.lastBackfillOutcome?.status === "error" &&
          store.lastBackfillOutcome.error,
      ).toMatchObject({
        message: "HTTP 500",
        status: 500,
      });
    });

    test("is a no-op when a backfill is already in progress", async () => {
      fetchMock.mockResponseOnce(async () => {
        // While the first call is still in flight, fire a second one — it
        // should return immediately without issuing another fetch.
        await store.triggerBackfill();
        return JSON.stringify(MOCK_SUMMARY);
      });

      await store.triggerBackfill();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
