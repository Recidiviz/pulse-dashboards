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

import { usNeGoodTimeRestorationFixtures } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { OpportunitySearchManager } from "../OpportunitySearchManager";

// Hoisted because importing `RootStore` below constructs a store tree at module
// scope, which reaches this mock before a plain `const` would be initialised.
const { multiSearch, reset } = vi.hoisted(() => ({
  multiSearch: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("~@typesense/client", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createScopedTypesenseClient: () => ({ multiSearch, reset }),
}));

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

/**
 * The slice of the store tree the manager reads. Built by hand rather than from
 * the real stores so a test can state a scope in three lines.
 */
function makeSearchStore({
  selectedSearchIds = ["OFFICER_1"],
  types = { usTnLSU: { systemType: "SUPERVISION" } } as Record<
    string,
    Record<string, unknown>
  >,
  isTypesenseHomepageEnabled = true,
  rootStore = {
    currentTenantId: "US_TN",
    userStore: { getToken: undefined },
  } as unknown as RootStore,
} = {}) {
  return {
    isTypesenseHomepageEnabled,
    selectedSearchIds,
    workflowsStore: {
      activeSystem: "ALL",
      opportunityTypes: Object.keys(types),
      opportunityConfigurationStore: { opportunities: types },
      systemConfigFor: () => ({ search: [{ searchField: ["officerId"] }] }),
      rootStore,
    },
  } as never;
}

/**
 * A RootStore whose opportunity configs are loaded, which `tabTitle()` needs.
 * The census labels every bucket by asking a real opportunity for its tab.
 */
function configuredRootStore(): RootStore {
  const root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  return root;
}

/** A hit built from the REAL fixture, so the real schema and class both run. */
function goodTimeHit(overrides: Record<string, unknown> = {}) {
  return {
    ...usNeGoodTimeRestorationFixtures.fullyEligible.input,
    id: "us_ne_RES001_usNeGoodTimeRestoration",
    opportunityType: "usNeGoodTimeRestoration",
    residentDocId: "us_ne_RES001",
    residents: {
      displayId: "RES001",
      personName: { givenNames: "Christopher", surname: "Davis" },
      pseudonymizedId: "anonres001-ne",
    },
    ...overrides,
  };
}

/** `found` counts GROUPS on a grouped search; each group carries its own size. */
function censusResult(
  groups: Array<{ document: Record<string, unknown>; count: number }>,
  foundGroups = groups.length,
) {
  return {
    found: foundGroups,
    grouped_hits: groups.map(({ document, count }) => ({
      group_key: [],
      found: count,
      hits: [{ document }],
    })),
  };
}

/** The store shape the census path needs: real configs, incarceration type. */
function censusStore(rootStore: RootStore) {
  return makeSearchStore({
    types: { usNeGoodTimeRestoration: { systemType: "INCARCERATION" } },
    rootStore,
  });
}

function actedOnResult(
  docs: Array<Record<string, unknown>> = [],
  found = docs.length,
) {
  return { found, hits: docs.map((document) => ({ document })) };
}

describe("the plan", () => {
  test("is empty when nothing is selected", () => {
    const manager = new OpportunitySearchManager(
      makeSearchStore({ selectedSearchIds: [] }),
    );

    expect(manager.plan).toEqual([]);
  });

  test("builds per system, because the search fields differ between them", () => {
    const manager = new OpportunitySearchManager(
      makeSearchStore({
        types: {
          usTnLSU: { systemType: "SUPERVISION" },
          usNeGoodTime: { systemType: "INCARCERATION" },
        },
      }),
    );

    const collections = manager.plan.map((p) => p.personCollection);

    expect(collections).toContain("clients");
    expect(collections).toContain("residents");
    // One acted-on search per system, not one overall.
    expect(manager.plan.filter((p) => p.kind === "actedOn")).toHaveLength(2);
  });
});

describe("search", () => {
  let errors: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    multiSearch.mockReset();
    reset.mockReset();
    // The failure paths log deliberately. Captured so a real error is not lost
    // in expected noise, and so the logging itself can be asserted.
    errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errors.mockRestore();
  });

  test("labels each census bucket with the REAL tabTitle()", async () => {
    // THE mechanism. No tab rule lives in the query layer: the count comes
    // from the group, the NAME comes from an opportunity built out of the
    // group's own exemplar.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 14 }]),
        actedOnResult(),
      ],
    });

    await manager.search();

    expect(manager.countsByType["usNeGoodTimeRestoration"]).toEqual({
      "Eligible Now": 14,
    });
    expect(manager.lastError).toBeUndefined();
  });

  test("moves an acted-on record out of the bucket that counted it", async () => {
    // The census exemplar carries no overlay, so its bucket counted this
    // denied record as untouched. Subtracting it is what keeps the total
    // right while the record renders on its real tab.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 10 }]),
        actedOnResult([
          goodTimeHit({
            opportunityUpdates: { denial: { reasons: ["TEST"] } },
          }),
        ]),
      ],
    });

    await manager.search();

    const counts = manager.countsByType["usNeGoodTimeRestoration"];
    expect(counts?.["Eligible Now"]).toBe(9);
    // The total is unchanged: a record moved, it did not vanish.
    expect(Object.values(counts ?? {}).reduce((a, b) => a + b, 0)).toBe(10);
  });

  test("ignores an acted-on record the census never counted", async () => {
    // The ACTED ON shape carries no eligibility filter, so it returns
    // the census skipped. Subtracting one would push a bucket below zero.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 3 }]),
        actedOnResult([
          goodTimeHit({
            id: "us_ne_RES009_usNeGoodTimeRestoration",
            isEligible: false,
            isAlmostEligible: false,
            opportunityUpdates: { denial: { reasons: ["TEST"] } },
          }),
        ]),
      ],
    });

    await manager.search();

    expect(manager.countsByType["usNeGoodTimeRestoration"]).toEqual({
      "Eligible Now": 3,
    });
    expect(manager.unreconstructableTypes).toEqual([]);
  });

  test("throws rather than count a census that overflowed its page", async () => {
    // `found` counts GROUPS here. An overflow drops whole buckets, which reads
    // as a tab that simply is not there rather than as an error.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 5 }], 400),
        actedOnResult(),
      ],
    });

    await manager.search();

    expect(manager.lastError).toMatch(/census needs pagination/);
    expect(manager.countsByType).toEqual({});
    expect(errors).toHaveBeenCalled();
  });

  test("throws rather than subtract an under-fetched acted-on set", async () => {
    // Every record the ACTED ON shape did not return stays in the untouched
    // left, silently.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 500 }]),
        actedOnResult([], 300),
      ],
    });

    await manager.search();

    expect(manager.lastError).toMatch(/acted-on set needs pagination/);
    expect(manager.countsByType).toEqual({});
    expect(errors).toHaveBeenCalled();
  });

  test("clears the counts when a search is rejected", async () => {
    // Stale counts from the previous selection are worse than none — they look
    // like an answer.
    const manager = new OpportunitySearchManager(makeSearchStore());
    multiSearch.mockResolvedValue({
      results: [{ error: "bad filter" }, censusResult([]), actedOnResult()],
    });

    await manager.search();

    expect(manager.lastError).toMatch(/rejected/);
    expect(manager.countsByType).toEqual({});
    expect(manager.records).toEqual([]);
    expect(errors).toHaveBeenCalled();
  });

  test("clears counts a PREVIOUS search populated", async () => {
    // The assertions above start from an empty manager, so they cannot tell
    // "cleared" from "never set". This one populates first, so the clearing is
    // the only thing that can make it pass.
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    multiSearch.mockResolvedValueOnce({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 12 }]),
        actedOnResult(),
      ],
    });
    await manager.search();
    expect(manager.countsByType["usNeGoodTimeRestoration"]).toEqual({
      "Eligible Now": 12,
    });

    multiSearch.mockResolvedValueOnce({
      results: [{ error: "bad filter" }, censusResult([]), actedOnResult()],
    });
    await manager.search();

    expect(manager.countsByType).toEqual({});
    expect(manager.records).toEqual([]);
  });

  test("ignores a response that arrives after a newer search started", async () => {
    const root = configuredRootStore();
    const manager = new OpportunitySearchManager(censusStore(root));
    let releaseFirst: (value: unknown) => void = () => undefined;
    multiSearch
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        results: [
          { found: 0, hits: [] },
          censusResult([{ document: goodTimeHit(), count: 7 }]),
          actedOnResult(),
        ],
      });

    const first = manager.search();
    await manager.search();
    releaseFirst({
      results: [
        { found: 0, hits: [] },
        censusResult([{ document: goodTimeHit(), count: 999 }]),
        actedOnResult(),
      ],
    });
    await first;

    // The second search's numbers, not the first's late reply.
    expect(manager.countsByType["usNeGoodTimeRestoration"]).toEqual({
      "Eligible Now": 7,
    });
  });

  test("clears rather than searches when the selection empties", async () => {
    const manager = new OpportunitySearchManager(
      makeSearchStore({ selectedSearchIds: [] }),
    );

    await manager.search();

    expect(multiSearch).not.toHaveBeenCalled();
    expect(manager.countsByType).toEqual({});
  });
});

describe("the gate", () => {
  test("no search runs for a tenant that is not on the flag", async () => {
    multiSearch.mockReset();
    const manager = new OpportunitySearchManager(
      makeSearchStore({ isTypesenseHomepageEnabled: false }),
    );

    await manager.search();

    expect(multiSearch).not.toHaveBeenCalled();
    expect(manager.countsByType).toEqual({});
  });
});

describe("the alert rows", () => {
  /** A range facet result: `staleRangeFacet` names the bucket "stale". */
  function staleResult(count: number) {
    return {
      found: count,
      hits: [],
      facet_counts: [
        {
          field_name: "eligibleDateTimestamp",
          counts: [{ value: "stale", count }],
        },
      ],
    };
  }

  // The thresholds live on the CONFIG — `plan` reads them from there, which is
  // also what decides whether the two searches are planned at all.
  const ALERTS = {
    types: {
      usNeGoodTimeRestoration: {
        systemType: "INCARCERATION",
        eligibleNotViewedDaysThreshold: 30,
        pendingOverdueDaysThreshold: 7,
      },
    },
  };

  test("sums the two stale halves, which are one COALESCE", async () => {
    // `staleUnviewed` and `staleViewed` split a clock whose halves live in
    // different collections, so no single facet expresses it. They add.
    const manager = new OpportunitySearchManager(
      makeSearchStore(ALERTS as never),
    );
    multiSearch.mockResolvedValue({
      results: [
        { found: 0, hits: [] },
        staleResult(4), // staleUnviewed
        staleResult(3), // staleViewed
        staleResult(2), // pendingOverdue
        censusResult([]),
        actedOnResult(),
      ],
    });

    await manager.search();

    expect(manager.alertsByType["usNeGoodTimeRestoration"]).toEqual({
      eligibleStale: 7,
      pendingOverdue: 2,
    });
  });

  test("a type with no thresholds gets no entry, not a zeroed one", async () => {
    // Its two searches are never planned, so an entry would be a fabrication.
    const manager = new OpportunitySearchManager(
      censusStore(configuredRootStore()),
    );
    multiSearch.mockResolvedValue({
      results: [{ found: 0, hits: [] }, censusResult([]), actedOnResult()],
    });

    await manager.search();

    expect(manager.alertsByType).toEqual({});
  });

  test("clears alerts a previous search populated", async () => {
    const manager = new OpportunitySearchManager(
      makeSearchStore(ALERTS as never),
    );
    multiSearch.mockResolvedValueOnce({
      results: [
        { found: 0, hits: [] },
        staleResult(4),
        staleResult(0),
        staleResult(1),
        censusResult([]),
        actedOnResult(),
      ],
    });
    await manager.search();
    expect(manager.alertsByType["usNeGoodTimeRestoration"]).toBeDefined();

    multiSearch.mockResolvedValueOnce({
      results: [{ error: "bad filter" }],
    });
    await manager.search();

    expect(manager.alertsByType).toEqual({});
  });
});

describe("hydration state", () => {
  test("starts needing hydration, so the Hydrator asks for the first search", () => {
    const manager = new OpportunitySearchManager(makeSearchStore());

    expect(manager.hydrationState).toEqual({ status: "needs hydration" });
  });

  test("reports loading WHILE the request is in flight", async () => {
    // The flash this exists to prevent: without it the page reports hydrated
    // with `countsByType` still {}, and renders "no opportunities".
    const manager = new OpportunitySearchManager(makeSearchStore());
    let release: (value: unknown) => void = () => undefined;
    multiSearch.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    const pending = manager.search();
    expect(manager.hydrationState).toEqual({ status: "loading" });
    expect(manager.countsByType).toEqual({});

    release({ results: [{ found: 0, hits: [] }] });
    await pending;

    expect(manager.hydrationState).toEqual({ status: "hydrated" });
  });

  test("returns to loading on a RE-search, not just the first", async () => {
    // The selection-change path. The Hydrator settled long ago, so this is
    // what brings the loader back instead of blanking the cards to zero.
    const manager = new OpportunitySearchManager(makeSearchStore());
    multiSearch.mockResolvedValue({ results: [{ found: 0, hits: [] }] });
    await manager.search();
    expect(manager.hydrationState).toEqual({ status: "hydrated" });

    let release: (value: unknown) => void = () => undefined;
    multiSearch.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    const pending = manager.search();
    expect(manager.hydrationState).toEqual({ status: "loading" });

    release({ results: [{ found: 0, hits: [] }] });
    await pending;
    expect(manager.hydrationState).toEqual({ status: "hydrated" });
  });

  test("a failed search reports failed rather than empty counts", async () => {
    const manager = new OpportunitySearchManager(makeSearchStore());
    multiSearch.mockRejectedValue(new Error("typesense exploded"));

    await manager.search();

    expect(manager.hydrationState.status).toBe("failed");
  });

  test("an empty selection is hydrated, not pending", async () => {
    // Nothing selected is an answer. Left at "needs hydration" the Hydrator
    // would re-ask forever.
    const manager = new OpportunitySearchManager(
      makeSearchStore({ selectedSearchIds: [] }),
    );

    await manager.search();

    expect(manager.hydrationState).toEqual({ status: "hydrated" });
  });

  test("a failure does not outlive the search that caused it", async () => {
    // `lastError` is cleared at the TOP of `search()` rather than alongside
    // `searchPending`, because the gate and empty-plan returns never reach
    // that block and would carry a stale "failed" into a fresh search.
    const manager = new OpportunitySearchManager(makeSearchStore());
    multiSearch.mockRejectedValue(new Error("typesense exploded"));
    await manager.search();
    expect(manager.hydrationState.status).toBe("failed");

    multiSearch.mockResolvedValue({ results: [{ found: 0, hits: [] }] });
    await manager.search();

    expect(manager.hydrationState).toEqual({ status: "hydrated" });
    expect(manager.lastError).toBeUndefined();
  });

  test("a tenant off the gate is hydrated, not stuck", async () => {
    // It never searches, so anything composing it would hang.
    const manager = new OpportunitySearchManager(
      makeSearchStore({ isTypesenseHomepageEnabled: false }),
    );

    await manager.search();

    expect(manager.hydrationState).toEqual({ status: "hydrated" });
  });
});
