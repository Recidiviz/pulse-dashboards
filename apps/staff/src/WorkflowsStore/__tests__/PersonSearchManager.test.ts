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

import * as Sentry from "@sentry/react";
import { observable } from "mobx";

import {
  buildPersonSearchPlan,
  composePersonSearchResults,
  PersonSearchManager,
} from "../PersonSearchManager";
import { SearchStore } from "../SearchStore";
import { PlannedPersonSearch } from "../types";
import { WorkflowsStore } from "../WorkflowsStore";

vi.mock("@sentry/react");

let searchStore: SearchStore;
let workflowsStore: any;
let manager: PersonSearchManager;

beforeEach(() => {
  workflowsStore = observable({
    rootStore: {
      currentTenantId: "US_ND",
      userStore: {
        isRecidivizUser: false,
        getToken: vi.fn(),
      },
      firestoreStore: {
        updateSelectedSearchIds: vi.fn(),
      },
      analyticsStore: {
        trackCaseloadSearch: vi.fn(),
      },
    },
    featureVariants: {},
    activeSystem: "SUPERVISION",
  });
  searchStore = new SearchStore(workflowsStore as unknown as WorkflowsStore);
  manager = searchStore.personSearchManager;
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("buildPersonSearchPlan", () => {
  test("always includes clients + residents", () => {
    const plan = buildPersonSearchPlan("alice", "US_TN", false);
    expect(plan.map((p) => p.collection)).toEqual(["clients", "residents"]);
  });

  test("clients/residents descriptors: query_by, filter_by", () => {
    const plan = buildPersonSearchPlan("al", "US_UT", false);
    expect(plan[0].descriptor).toMatchObject({
      collection: "clients",
      q: "al",
      query_by: "personName.givenNames,personName.surname,personExternalId",
      filter_by: "stateCode:=`US_UT`",
      infix: "always",
      num_typos: 2,
    });
    expect(plan[1].descriptor).toMatchObject({
      collection: "residents",
      q: "al",
      query_by: "personName.givenNames,personName.surname,personExternalId",
      filter_by: "stateCode:=`US_UT`",
    });
  });

  test("omits clientUpdatesV2 when caller is not unrestricted", () => {
    const plan = buildPersonSearchPlan("alice", "US_TN", false);
    expect(plan.map((p) => p.collection)).not.toContain("clientUpdatesV2");
  });

  test("includes clientUpdatesV2 when caller is unrestricted", () => {
    const plan = buildPersonSearchPlan("alice", "US_TN", true);
    expect(plan.map((p) => p.collection)).toEqual([
      "clients",
      "residents",
      "clientUpdatesV2",
    ]);
    expect(plan[2].descriptor).toMatchObject({
      collection: "clientUpdatesV2",
      q: "alice",
      query_by: "preferredName",
      filter_by: "stateCode:=`US_TN`",
    });
  });
});

describe("composePersonSearchResults", () => {
  const clientsPlan: PlannedPersonSearch = {
    descriptor: {},
    collection: "clients",
  };
  const residentsPlan: PlannedPersonSearch = {
    descriptor: {},
    collection: "residents",
  };
  const clientUpdatesPlan: PlannedPersonSearch = {
    descriptor: {},
    collection: "clientUpdatesV2",
  };

  test("returns empty array when all results are empty", () => {
    const results = composePersonSearchResults(
      [{ hits: [] }, { hits: [] }],
      [clientsPlan, residentsPlan],
    );
    expect(results).toEqual([]);
  });

  test("composes a client hit with personType CLIENT", () => {
    const clientHit = {
      hits: [
        {
          document: {
            id: "US_XX_c1",
            personExternalId: "c1",
            pseudonymizedId: "p1",
            personName: { givenNames: "Alice", surname: "Smith" },
          },
        },
      ],
    };

    const results = composePersonSearchResults(
      [clientHit, { hits: [] }],
      [clientsPlan, residentsPlan],
    );
    expect(results).toEqual([
      {
        personType: "CLIENT",
        personExternalId: "c1",
        pseudonymizedId: "p1",
        givenNames: "Alice",
        surname: "Smith",
        preferredName: undefined,
      },
    ]);
  });

  test("composes a resident hit with personType RESIDENT", () => {
    const residentHit = {
      hits: [
        {
          document: {
            id: "US_XX_r1",
            personExternalId: "r1",
            pseudonymizedId: "p1",
            personName: { givenNames: "Bob", surname: "Jones" },
          },
        },
      ],
    };

    const results = composePersonSearchResults(
      [{ hits: [] }, residentHit],
      [clientsPlan, residentsPlan],
    );
    expect(results).toEqual([
      {
        personType: "RESIDENT",
        personExternalId: "r1",
        pseudonymizedId: "p1",
        givenNames: "Bob",
        surname: "Jones",
        preferredName: undefined,
      },
    ]);
  });

  test("merges preferredName onto the matching client/resident hit by id", () => {
    const clientHit = {
      hits: [
        {
          document: {
            id: "US_XX_c1",
            personExternalId: "c1",
            pseudonymizedId: "p1",
            personName: { givenNames: "Alice", surname: "Smith" },
          },
        },
      ],
    };
    const clientUpdatesHit = {
      hits: [{ document: { id: "US_XX_c1", preferredName: "Ali" } }],
    };

    const results = composePersonSearchResults(
      [clientHit, { hits: [] }, clientUpdatesHit],
      [clientsPlan, residentsPlan, clientUpdatesPlan],
    );
    expect(results[0].preferredName).toBe("Ali");
  });

  test("drops a clientUpdatesV2 hit with no matching client/resident hit", () => {
    const clientUpdatesHit = {
      hits: [{ document: { id: "US_XX_c1", preferredName: "Alice" } }],
    };

    const results = composePersonSearchResults(
      [{ hits: [] }, { hits: [] }, clientUpdatesHit],
      [clientsPlan, residentsPlan, clientUpdatesPlan],
    );
    expect(results).toEqual([]);
  });

  test("no-op when clientUpdatesV2 wasn't in the plan at all", () => {
    const clientHit = {
      hits: [
        {
          document: {
            id: "US_XX_c1",
            personExternalId: "c1",
            pseudonymizedId: "p1",
            personName: { givenNames: "Alice", surname: "Smith" },
          },
        },
      ],
    };

    const results = composePersonSearchResults(
      [clientHit, { hits: [] }],
      [clientsPlan, residentsPlan],
    );
    expect(results[0].preferredName).toBeUndefined();
  });

  describe("with a cache", () => {
    const clientHit = {
      hits: [
        {
          document: {
            id: "US_XX_c1",
            personExternalId: "c1",
            pseudonymizedId: "p1",
            personName: { givenNames: "Alice", surname: "Smith" },
          },
        },
      ],
    };

    test("reuses the cached object for a pseudonymizedId seen before", () => {
      const cache = new Map();

      const first = composePersonSearchResults(
        [clientHit, { hits: [] }],
        [clientsPlan, residentsPlan],
        cache,
      );
      const second = composePersonSearchResults(
        [clientHit, { hits: [] }],
        [clientsPlan, residentsPlan],
        cache,
      );

      expect(second[0]).toBe(first[0]);
    });

    test("serves the stale cached object even if the underlying hit changed", () => {
      const cache = new Map();

      const first = composePersonSearchResults(
        [clientHit, { hits: [] }],
        [clientsPlan, residentsPlan],
        cache,
      );

      const updatedHit = {
        hits: [
          {
            document: {
              ...clientHit.hits[0].document,
              personName: { givenNames: "Alicia", surname: "Smith" },
            },
          },
        ],
      };
      const second = composePersonSearchResults(
        [updatedHit, { hits: [] }],
        [clientsPlan, residentsPlan],
        cache,
      );

      expect(second[0]).toBe(first[0]);
      expect(second[0].givenNames).toBe("Alice");
    });

    test("without a cache, a new object is built every call", () => {
      const first = composePersonSearchResults(
        [clientHit, { hits: [] }],
        [clientsPlan, residentsPlan],
      );
      const second = composePersonSearchResults(
        [clientHit, { hits: [] }],
        [clientsPlan, residentsPlan],
      );

      expect(second[0]).not.toBe(first[0]);
      expect(second[0]).toEqual(first[0]);
    });
  });
});

describe("search", () => {
  let mockMultiSearch: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockMultiSearch = vi.fn().mockResolvedValue({ results: [] });
    manager.typesenseClient = {
      multiSearch: mockMultiSearch,
      reset: vi.fn(),
      getScopedKey: vi.fn(),
    } as any;
    errorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("populates results from composed hits", async () => {
    mockMultiSearch.mockResolvedValueOnce({
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_c1",
                personExternalId: "c1",
                pseudonymizedId: "p1",
                personName: { givenNames: "Alice", surname: "Smith" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    });

    await manager.search("alice");
    expect(manager.results).toHaveLength(1);
    expect(manager.results[0].personType).toBe("CLIENT");
  });

  test("toggles searchPending around the request", async () => {
    let resolveMultiSearch!: (v: any) => void;
    mockMultiSearch.mockReturnValueOnce(
      new Promise((res) => {
        resolveMultiSearch = res;
      }),
    );

    const promise = manager.search("alice");
    expect(manager.searchPending).toBe(true);

    resolveMultiSearch({ results: [] });
    await promise;
    expect(manager.searchPending).toBe(false);
  });

  test("swallows multiSearch errors: clears results, logs, resets pending", async () => {
    const error = new Error("network down");
    mockMultiSearch.mockRejectedValueOnce(error);

    await manager.search("alice");
    expect(manager.results).toEqual([]);
    expect(manager.searchPending).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "Typesense person search failed:",
      expect.any(Error),
    );
    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(error);
  });

  test("trims the query", async () => {
    await manager.search("  alice   ");
    expect((mockMultiSearch.mock.calls[0][0] as any).searches[0].q).toBe(
      "alice",
    );
  });

  test("does not include clientUpdatesV2 in the plan for a non-Recidiviz user", async () => {
    await manager.search("alice");
    const searches = (mockMultiSearch.mock.calls[0][0] as any).searches;
    expect(searches).toHaveLength(2);
  });

  test("includes clientUpdatesV2 in the plan for a Recidiviz user", async () => {
    workflowsStore.rootStore.userStore.isRecidivizUser = true;

    await manager.search("alice");
    const searches = (mockMultiSearch.mock.calls[0][0] as any).searches;
    expect(searches).toHaveLength(3);
    expect(searches[2].collection).toBe("clientUpdatesV2");
  });

  test("stale responses are dropped: only the latest search's results are committed", async () => {
    let resolveFirst!: (v: any) => void;
    mockMultiSearch.mockReturnValueOnce(
      new Promise((res) => {
        resolveFirst = res;
      }),
    );

    const firstSearch = manager.search("alice");

    mockMultiSearch.mockResolvedValueOnce({
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_b1",
                personExternalId: "b1",
                pseudonymizedId: "p2",
                personName: { givenNames: "Bob", surname: "Jones" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    });
    const secondSearch = manager.search("bob");
    await secondSearch;

    expect(manager.results).toHaveLength(1);
    expect(manager.results[0].personExternalId).toBe("b1");

    // The first (stale) request resolves after the second — its results must
    // not clobber the newer ones, and it must not flip searchPending back on.
    resolveFirst({
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_a1",
                personExternalId: "a1",
                pseudonymizedId: "p1",
                personName: { givenNames: "Alice", surname: "Smith" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    });
    await firstSearch;

    expect(manager.results).toHaveLength(1);
    expect(manager.results[0].personExternalId).toBe("b1");
    expect(manager.searchPending).toBe(false);
  });

  test("reuses the same result object across searches for a person seen before", async () => {
    const aliceHit = {
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_c1",
                personExternalId: "c1",
                pseudonymizedId: "p1",
                personName: { givenNames: "Alice", surname: "Smith" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    };

    mockMultiSearch.mockResolvedValueOnce(aliceHit);
    await manager.search("alice");
    const firstResult = manager.results[0];

    mockMultiSearch.mockResolvedValueOnce({
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_b1",
                personExternalId: "b1",
                pseudonymizedId: "p2",
                personName: { givenNames: "Bob", surname: "Jones" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    });
    await manager.search("bob");

    mockMultiSearch.mockResolvedValueOnce(aliceHit);
    await manager.search("alice");

    expect(manager.results[0]).toBe(firstResult);
  });

  test("invalidates the cache on tenant change", async () => {
    const aliceHit = {
      results: [
        {
          hits: [
            {
              document: {
                id: "US_ND_c1",
                personExternalId: "c1",
                pseudonymizedId: "p1",
                personName: { givenNames: "Alice", surname: "Smith" },
              },
            },
          ],
        },
        { hits: [] },
      ],
    };

    mockMultiSearch.mockResolvedValueOnce(aliceHit);
    await manager.search("alice");
    const firstResult = manager.results[0];

    workflowsStore.rootStore.currentTenantId = "US_TN";

    mockMultiSearch.mockResolvedValueOnce(aliceHit);
    await manager.search("alice");

    expect(manager.results[0]).not.toBe(firstResult);
    expect(manager.results[0]).toEqual(firstResult);
  });
});

describe("handleSearchInput", () => {
  test("no-ops on an empty query: doesn't set searchInput or trigger a search", () => {
    manager.handleSearchInput("");
    expect(manager.searchInput).toBe("");
    expect(manager.searchPending).toBe(false);
  });

  test("sets searchInput on a non-empty query", () => {
    manager.handleSearchInput("alice");
    expect(manager.searchInput).toBe("alice");
  });
});
