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

import { observable } from "mobx";

import {
  mockLocations,
  mockOfficer,
  mockSupervisionOfficers,
} from "../__fixtures__";
import {
  buildTypesenseSearchPlan,
  CaseloadSearchManager,
  composeSearchableGroups,
  resetSearchPlanCache,
} from "../CaseloadSearchManager";
import { SearchStore } from "../SearchStore";
import { PlannedTypesenseSearch } from "../types";
import { staffNameComparator } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";

let searchStore: SearchStore;
let workflowsStore: any;
let manager: CaseloadSearchManager;

beforeEach(() => {
  resetSearchPlanCache();

  workflowsStore = observable({
    user: {
      ...mockOfficer,
      updates: {},
    },
    rootStore: {
      currentTenantId: "US_ND",
      userStore: {
        getToken: vi.fn(),
      },
      firestoreStore: {
        updateSelectedSearchIds: vi.fn(),
      },
      analyticsStore: {
        trackCaseloadSearch: vi.fn(),
      },
    },
    featureVariants: { typesenseCaseloadSearch: {} },
    systemConfigFor: vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    })),
    activeSystemConfig: {
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    },
    activeSystem: "SUPERVISION",
    availableOfficers: [...mockSupervisionOfficers].sort(staffNameComparator),
    availableLocations: mockLocations,
    // Real getter always returns an array; default it so reads of
    // selectedSearchIds (which walks the supervisor chain) don't hit undefined.
    staffSupervisedByCurrentUser: [],
  });
  searchStore = new SearchStore(workflowsStore as unknown as WorkflowsStore);
  manager = searchStore.caseloadSearchManager;
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("buildTypesenseSearchPlan", () => {
  // Minimal mock — only reads systemConfigFor + featureVariants
  function makeMockWorkflowsStore(
    systemConfigs: Partial<
      Record<"SUPERVISION" | "INCARCERATION", { search: any[] }>
    >,
    featureVariants: Record<string, unknown> = {},
  ) {
    return {
      systemConfigFor: (system: "SUPERVISION" | "INCARCERATION") =>
        systemConfigs[system] ?? { search: [] },
      featureVariants,
    } as unknown as WorkflowsStore;
  }

  test("returns empty plan when no search configs are wired for Typesense", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [
          // CASELOAD has no entry in collectionsBySearchType — skipped.
          { searchType: "CASELOAD", searchTitle: "caseload" },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan(
      "alice",
      "US_TN",
      "SUPERVISION",
      store,
    );
    expect(plan).toEqual([]);
  });

  test("skips entries whose restrictedToFeatureVariant is off for this user", () => {
    const store = makeMockWorkflowsStore(
      {
        SUPERVISION: {
          search: [
            {
              searchType: "OFFICER",
              searchTitle: "officer",
              restrictedToFeatureVariant: "someGatedFV",
            },
          ],
        },
      },
      {}, // no FVs on
    );

    const plan = buildTypesenseSearchPlan(
      "alice",
      "US_TN",
      "SUPERVISION",
      store,
    );
    expect(plan).toEqual([]);
  });

  test("includes entries whose restrictedToFeatureVariant IS on", () => {
    const store = makeMockWorkflowsStore(
      {
        SUPERVISION: {
          search: [
            {
              searchType: "OFFICER",
              searchTitle: "officer",
              restrictedToFeatureVariant: "someGatedFV",
            },
          ],
        },
      },
      { someGatedFV: {} }, // truthy → active
    );

    const plan = buildTypesenseSearchPlan(
      "alice",
      "US_TN",
      "SUPERVISION",
      store,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].collection).toBe("supervisionStaff");
  });

  test("staff search: collection, query_by, group label", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [{ searchType: "OFFICER", searchTitle: "agent" }],
      },
    });

    const plan = buildTypesenseSearchPlan("al", "US_UT", "SUPERVISION", store);
    expect(plan).toHaveLength(1);
    expect(plan[0].collection).toBe("supervisionStaff");
    expect(plan[0].groupLabel).toBe("agent");
    expect(plan[0].descriptor).toMatchObject({
      collection: "supervisionStaff",
      q: "al",
      query_by: "givenNames,surname,email",
      filter_by: "stateCode:=`US_UT` && hasCaseload:=true",
    });
  });

  test("supervision staff search excludes officers without a caseload", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [{ searchType: "OFFICER", searchTitle: "agent" }],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_UT", "SUPERVISION", store);
    expect(plan[0].descriptor.filter_by).toBe(
      "stateCode:=`US_UT` && hasCaseload:=true",
    );
  });

  test("incarceration staff search omits the hasCaseload clause", () => {
    const store = makeMockWorkflowsStore({
      INCARCERATION: {
        search: [
          { searchType: "INCARCERATION_OFFICER", searchTitle: "case manager" },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_MI", "INCARCERATION", store);
    // The field isn't on the incarcerationStaff collection at all, so filtering
    // on it would be a Typesense error rather than an empty result set.
    expect(plan[0].descriptor.filter_by).toBe("stateCode:=`US_MI`");
  });

  test("location search: idType filter appended to filter_by, query_by is name", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [{ searchType: "DISTRICT", searchTitle: "District" }],
      },
    });

    const plan = buildTypesenseSearchPlan(
      "dist",
      "US_ID",
      "SUPERVISION",
      store,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].collection).toBe("locations");
    expect(plan[0].descriptor).toMatchObject({
      collection: "locations",
      q: "dist",
      query_by: "name",
      filter_by: "stateCode:=`US_ID` && idType:=`districtId`",
    });
  });

  test("ALL mode fans out to both systems in SUPR-then-INC order", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [{ searchType: "OFFICER", searchTitle: "officer" }],
      },
      INCARCERATION: {
        search: [
          { searchType: "INCARCERATION_OFFICER", searchTitle: "case manager" },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_MI", "ALL", store);
    expect(plan.map((p) => p.collection)).toEqual([
      "supervisionStaff",
      "incarcerationStaff",
    ]);
  });

  test("single-system mode only queries that system's config", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [{ searchType: "OFFICER", searchTitle: "officer" }],
      },
      INCARCERATION: {
        search: [
          { searchType: "INCARCERATION_OFFICER", searchTitle: "case manager" },
        ],
      },
    });

    const suprPlan = buildTypesenseSearchPlan(
      "*",
      "US_MI",
      "SUPERVISION",
      store,
    );
    expect(suprPlan.map((p) => p.collection)).toEqual(["supervisionStaff"]);

    const incPlan = buildTypesenseSearchPlan(
      "*",
      "US_MI",
      "INCARCERATION",
      store,
    );
    expect(incPlan.map((p) => p.collection)).toEqual(["incarcerationStaff"]);
  });

  test("maps each location searchType to its idType", () => {
    const store = makeMockWorkflowsStore({
      INCARCERATION: {
        search: [
          { searchType: "FACILITY", searchTitle: "facility" },
          { searchType: "FACILITY_UNIT", searchTitle: "unit" },
          { searchType: "US_ID_CRC_FACILITY", searchTitle: "crc" },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_ID", "INCARCERATION", store);
    expect(plan.map((p) => p.descriptor.filter_by)).toEqual([
      "stateCode:=`US_ID` && idType:=`facilityId`",
      "stateCode:=`US_ID` && idType:=`facilityUnitId`",
      "stateCode:=`US_ID` && idType:=`crcFacilityId`",
    ]);
  });

  test("group label is the unmodified searchTitle", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [
          {
            searchType: "OFFICER",
            searchTitle: "staff",
            searchTitleIgnoreCase: true,
          },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_XX", "SUPERVISION", store);
    expect(plan[0].groupLabel).toBe("staff");
  });

  test("preserves tenant-config order of search entries within a system", () => {
    const store = makeMockWorkflowsStore({
      SUPERVISION: {
        search: [
          { searchType: "DISTRICT", searchTitle: "district" },
          { searchType: "OFFICER", searchTitle: "officer" },
        ],
      },
    });

    const plan = buildTypesenseSearchPlan("*", "US_ID", "SUPERVISION", store);
    expect(plan.map((p) => p.collection)).toEqual([
      "locations",
      "supervisionStaff",
    ]);
  });

  describe("memoization", () => {
    // Mirrors the real systemConfigFor: reads a static config and filters it by
    // restrictedToFeatureVariant. A cache hit means it isn't called at all.
    function makeStore(activeVariants: string[]) {
      const staticSearch = [
        { searchType: "OFFICER", searchTitle: "officer" },
        {
          searchType: "DISTRICT",
          searchTitle: "district",
          restrictedToFeatureVariant: "usIdDistrictSearch",
        },
      ];
      const featureVariants = Object.fromEntries(
        activeVariants.map((name) => [name, {}]),
      );
      return {
        systemConfigFor: vi.fn(() => ({
          search: staticSearch.filter(
            (sc) =>
              !sc.restrictedToFeatureVariant ||
              sc.restrictedToFeatureVariant in featureVariants,
          ),
        })),
        featureVariants,
      } as unknown as WorkflowsStore;
    }

    test("reuses the cached plan across different queries", () => {
      const store = makeStore([]);
      buildTypesenseSearchPlan("a", "US_ID", "SUPERVISION", store);
      vi.mocked(store.systemConfigFor).mockClear();

      buildTypesenseSearchPlan("bb", "US_ID", "SUPERVISION", store);
      buildTypesenseSearchPlan("ccc", "US_ID", "SUPERVISION", store);
      expect(store.systemConfigFor).not.toHaveBeenCalled();
    });

    test("stamps q per call without sharing descriptors", () => {
      const store = makeStore([]);
      const a = buildTypesenseSearchPlan(
        "alice",
        "US_ID",
        "SUPERVISION",
        store,
      );
      const b = buildTypesenseSearchPlan("bob", "US_ID", "SUPERVISION", store);

      expect(a[0].descriptor.q).toBe("alice");
      expect(b[0].descriptor.q).toBe("bob");
      expect(a[0].descriptor).not.toBe(b[0].descriptor);
    });

    test("a feature variant flip rediscovers the newly enabled searchType", () => {
      expect(
        buildTypesenseSearchPlan(
          "*",
          "US_ID",
          "SUPERVISION",
          makeStore([]),
        ).map((p) => p.searchType),
      ).toEqual(["OFFICER"]);

      // The gated entry is filtered out upstream, so the only way this surfaces
      // is if the variant change invalidated the cached plan.
      expect(
        buildTypesenseSearchPlan(
          "*",
          "US_ID",
          "SUPERVISION",
          makeStore(["usIdDistrictSearch"]),
        ).map((p) => p.searchType),
      ).toEqual(["OFFICER", "DISTRICT"]);
    });

    // Unrelated variants invalidate too — deliberate, since variants change
    // rarely and the rebuild is cheap.
    test("an unrelated variant change rebuilds an equivalent plan", () => {
      const before = buildTypesenseSearchPlan(
        "*",
        "US_ID",
        "SUPERVISION",
        makeStore(["somethingElse"]),
      );
      const after = buildTypesenseSearchPlan(
        "*",
        "US_ID",
        "SUPERVISION",
        makeStore(["somethingElse", "andAnother"]),
      );
      expect(after.map((p) => p.searchType)).toEqual(
        before.map((p) => p.searchType),
      );
    });

    test("rebuilds on tenant and active-system changes", () => {
      const store = makeStore([]);

      const tn = buildTypesenseSearchPlan("*", "US_TN", "SUPERVISION", store);
      const ca = buildTypesenseSearchPlan("*", "US_CA", "SUPERVISION", store);
      expect(tn[0].descriptor.filter_by).toContain("US_TN");
      expect(ca[0].descriptor.filter_by).toContain("US_CA");

      const sup = buildTypesenseSearchPlan("*", "US_TN", "SUPERVISION", store);
      const all = buildTypesenseSearchPlan("*", "US_TN", "ALL", store);
      expect(all.length).toBeGreaterThan(sup.length);
    });
  });
});

describe("composeSearchableGroups", () => {
  const staffPlan: PlannedTypesenseSearch = {
    descriptor: {},
    collection: "supervisionStaff",
    groupLabel: "officers",
    searchType: "OFFICER",
  };
  const locationsPlan: PlannedTypesenseSearch = {
    descriptor: {},
    collection: "locations",
    groupLabel: "districts",
    searchType: "DISTRICT",
  };

  test("returns empty array when all results are empty", () => {
    const groups = composeSearchableGroups(
      [{ hits: [] }, { hits: [] }],
      [locationsPlan, staffPlan],
    );
    expect(groups).toEqual([]);
  });

  test("puts locations before staff regardless of plan order", () => {
    const staffHit = {
      hits: [
        {
          document: {
            staffExternalId: "OFF1",
            givenNames: "A",
            surname: "B",
            stateCode: "US_XX",
            pseudonymizedId: "p1",
          },
        },
      ],
    };
    const locationHit = {
      hits: [
        {
          document: {
            locationId: "DIST1",
            name: "D1",
            stateCode: "US_XX",
            idType: "districtId",
            system: "SUPERVISION",
          },
        },
      ],
    };

    // Note: plan puts staff first, but composer puts locations first.
    const groups = composeSearchableGroups(
      [staffHit, locationHit],
      [staffPlan, locationsPlan],
    );
    expect(groups.map((g) => g.groupLabel)).toEqual(["districts", "officers"]);
  });

  test("skips result slots whose hits array is empty", () => {
    const populatedStaff = {
      hits: [
        {
          document: {
            staffExternalId: "OFF1",
            givenNames: "A",
            surname: "B",
            stateCode: "US_XX",
            pseudonymizedId: "p1",
          },
        },
      ],
    };

    const groups = composeSearchableGroups(
      [{ hits: [] }, populatedStaff],
      [locationsPlan, staffPlan],
    );
    expect(groups.map((g) => g.groupLabel)).toEqual(["officers"]);
  });

  test("staff hits get recordType stamped from the plan's collection", () => {
    const incHit = {
      hits: [
        {
          document: {
            staffExternalId: "INC1",
            givenNames: "A",
            surname: "B",
            stateCode: "US_XX",
            pseudonymizedId: "p1",
          },
        },
      ],
    };
    const groups = composeSearchableGroups(
      [incHit],
      [
        {
          descriptor: {},
          collection: "incarcerationStaff",
          groupLabel: "case managers",
          searchType: "INCARCERATION_OFFICER",
        },
      ],
    );
    // Officer.record.recordType is the stamped value.
    const officer = groups[0].searchables[0] as any;
    expect(officer.record.recordType).toBe("incarcerationStaff");
  });

  test("preserves multiple groups of the same kind in plan order", () => {
    const facHit = {
      hits: [
        {
          document: {
            locationId: "F1",
            name: "F",
            stateCode: "US_XX",
            idType: "facilityId",
            system: "INCARCERATION",
          },
        },
      ],
    };
    const unitHit = {
      hits: [
        {
          document: {
            locationId: "U1",
            name: "U",
            stateCode: "US_XX",
            idType: "facilityUnitId",
            system: "INCARCERATION",
          },
        },
      ],
    };
    const facPlan: PlannedTypesenseSearch = {
      descriptor: {},
      collection: "locations",
      groupLabel: "facilities",
      searchType: "FACILITY",
    };
    const unitPlan: PlannedTypesenseSearch = {
      descriptor: {},
      collection: "locations",
      groupLabel: "units",
      searchType: "FACILITY_UNIT",
    };

    const groups = composeSearchableGroups(
      [facHit, unitHit],
      [facPlan, unitPlan],
    );
    expect(groups.map((g) => g.groupLabel)).toEqual(["facilities", "units"]);
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

  test("populates results from composed groups", async () => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
    mockMultiSearch.mockResolvedValueOnce({
      results: [
        {
          hits: [
            {
              document: {
                staffExternalId: "OFF1",
                givenNames: "Alice",
                surname: "Smith",
                stateCode: "US_ND",
                pseudonymizedId: "p1",
              },
            },
          ],
        },
      ],
    });

    await manager.search("alice");
    expect(manager.results).toHaveLength(1);
    expect(manager.results[0].groupLabel).toBe("officer");
  });

  test("toggles searchPending around the request", async () => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
    // Resolve on our schedule so we can observe the intermediate flag.
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
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
    mockMultiSearch.mockRejectedValueOnce(new Error("network down"));

    await manager.search("alice");
    expect(manager.results).toEqual([]);
    expect(manager.searchPending).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "Typesense search failed:",
      expect.any(Error),
    );
  });

  test("skips multiSearch entirely when the plan is empty", async () => {
    // CASELOAD isn't wired for Typesense — plan will be empty.
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "CASELOAD", searchTitle: "caseload" }],
    }));
    // Only a mock can swap the config without touching tenant/system/variants,
    // so the plan cached at construction needs clearing.
    resetSearchPlanCache();

    await manager.search("alice");
    expect(mockMultiSearch).not.toHaveBeenCalled();
    expect(manager.results).toEqual([]);
  });

  test("trims the query and substitutes '*' for an empty string", async () => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));

    await manager.search("  alice   ");
    expect((mockMultiSearch.mock.calls[0][0] as any).searches[0].q).toBe(
      "alice",
    );

    await manager.search("");
    expect((mockMultiSearch.mock.calls[1][0] as any).searches[0].q).toBe("*");
  });
});

// Helper: build a multi_search response with one staff hit.
function staffResponse(staffExternalId: string, givenNames: string) {
  return {
    results: [
      {
        hits: [
          {
            document: {
              staffExternalId,
              givenNames,
              surname: "Smith",
              stateCode: "US_ND",
              pseudonymizedId: `p-${staffExternalId}`,
            },
          },
        ],
      },
    ],
  };
}

describe("searchable cache + resolveSelectedSearchables", () => {
  let mockMultiSearch: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
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

  test("search accumulates every returned searchable into the cache", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    expect(manager.searchableCache.get("OFF1")?.searchable.searchLabel).toBe(
      "Alice Smith",
    );

    // A later query for a different name must not evict the earlier entry.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF2", "Bob"));
    await manager.search("bob");
    expect(manager.searchableCache.get("OFF1")?.searchable.searchLabel).toBe(
      "Alice Smith",
    );
    expect(manager.searchableCache.get("OFF2")?.searchable.searchLabel).toBe(
      "Bob Smith",
    );
  });

  test("resolveSelectedSearchables resolves from the cache after the item drops out of results", async () => {
    // Type-for and select OFF1 — it lands in results and thus the cache.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");

    // Input clears -> a fresh seed query reseeds results without OFF1.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF2", "Bob"));
    await manager.search("");
    expect(
      manager.results.flatMap((g) => g.searchables).map((s) => s.searchId),
    ).not.toContain("OFF1");

    // Pill still resolves from the cache.
    const resolved = manager.resolveSelectedSearchables(["OFF1"]);
    expect(resolved.map((s) => s.searchId)).toEqual(["OFF1"]);
  });

  test("resolveSelectedSearchables skips ids with no cached searchable", () => {
    expect(manager.resolveSelectedSearchables(["UNKNOWN"])).toEqual([]);
  });

  test("resolveSelectedSearchables drops selections from another system", async () => {
    // Answers per system like the real one, so switching pages changes
    // activeSystem rather than the config function.
    workflowsStore.systemConfigFor = vi.fn((system: string) =>
      system === "INCARCERATION"
        ? {
            search: [
              {
                searchType: "INCARCERATION_OFFICER",
                searchTitle: "case manager",
              },
            ],
          }
        : { search: [{ searchType: "OFFICER", searchTitle: "officer" }] },
    );

    // A supervision officer is selected while on a SUPERVISION page.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    expect(manager.resolveSelectedSearchables(["OFF1"])).toHaveLength(1);

    // The user navigates to an incarceration page. The cache still holds the
    // supervision officer, but it must not resolve here.
    workflowsStore.activeSystem = "INCARCERATION";
    expect(manager.resolveSelectedSearchables(["OFF1"])).toEqual([]);

    // Navigating back restores it — the ids themselves were never cleared.
    workflowsStore.activeSystem = "SUPERVISION";
    expect(
      manager.resolveSelectedSearchables(["OFF1"]).map((s) => s.searchId),
    ).toEqual(["OFF1"]);
  });

  test("resolveSelectedSearchables keeps both systems' selections in ALL mode", async () => {
    workflowsStore.activeSystem = "ALL";
    workflowsStore.systemConfigFor = vi.fn((system: string) =>
      system === "INCARCERATION"
        ? {
            search: [
              {
                searchType: "INCARCERATION_OFFICER",
                searchTitle: "case manager",
              },
            ],
          }
        : { search: [{ searchType: "OFFICER", searchTitle: "officer" }] },
    );

    mockMultiSearch.mockResolvedValueOnce({
      results: [
        staffResponse("OFF1", "Alice").results[0],
        staffResponse("INC1", "Bob").results[0],
      ],
    });
    await manager.search("*");

    expect(
      manager
        .resolveSelectedSearchables(["OFF1", "INC1"])
        .map((s) => s.searchId),
    ).toEqual(["OFF1", "INC1"]);
  });

  test("resolveSelectedSearchables drops everything when there is no active system", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");

    workflowsStore.activeSystem = undefined;
    expect(manager.resolveSelectedSearchables(["OFF1"])).toEqual([]);
  });
});

describe("tenant change", () => {
  let mockMultiSearch: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
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

  test("wipes cache, results and input when currentTenantId changes", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    expect(manager.resolveSelectedSearchables(["OFF1"])).toHaveLength(1);
    expect(manager.results).toHaveLength(1);
    expect(manager.searchInput).toBe("alice");

    workflowsStore.rootStore.currentTenantId = "US_TN";

    // The previous state's officer must not survive as a selected pill.
    expect(manager.searchableCache.size).toBe(0);
    expect(manager.resolveSelectedSearchables(["OFF1"])).toEqual([]);
    expect(manager.searchInput).toBe("");
  });

  test("re-keys and reseeds the dropdown for the new tenant", async () => {
    mockMultiSearch.mockClear();
    workflowsStore.rootStore.currentTenantId = "US_TN";

    // Scoped key is invalidated (its filter_by is baked per tenant)...
    expect(manager.typesenseClient.reset).toHaveBeenCalled();
    // ...and a seed query goes out scoped to the new state.
    const search = (mockMultiSearch.mock.calls[0][0] as any).searches[0];
    expect(search.q).toBe("*");
    expect(search.filter_by).toBe("stateCode:=`US_TN` && hasCaseload:=true");
  });

  test("a system change does NOT wipe the cache", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");

    workflowsStore.activeSystem = "ALL";

    // Still cached — only the active-system filter decides what resolves, so
    // navigating back restores the pill.
    expect(manager.searchableCache.has("OFF1")).toBe(true);
  });

  test("drops an in-flight search response that lands after a tenant change", async () => {
    let resolveMultiSearch!: (v: any) => void;
    mockMultiSearch.mockReturnValueOnce(
      new Promise((res) => {
        resolveMultiSearch = res;
      }),
    );

    const promise = manager.search("alice");
    workflowsStore.rootStore.currentTenantId = "US_TN";
    resolveMultiSearch(staffResponse("OFF1", "Alice"));
    await promise;

    expect(manager.searchableCache.has("OFF1")).toBe(false);
    expect(manager.results).toEqual([]);
  });

  test("drops an in-flight cache warm-up that lands after a tenant change", async () => {
    let resolveMultiSearch!: (v: any) => void;
    mockMultiSearch.mockReturnValueOnce(
      new Promise((res) => {
        resolveMultiSearch = res;
      }),
    );

    const promise = manager.warmSelectedSearchablesCache(["OFF1"]);
    workflowsStore.rootStore.currentTenantId = "US_TN";
    resolveMultiSearch(staffResponse("OFF1", "Alice"));
    await promise;

    expect(manager.searchableCache.has("OFF1")).toBe(false);
  });
});

describe("warmSelectedSearchablesCache", () => {
  let mockMultiSearch: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    }));
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

  test("fetches uncached ids by their collection's id field and caches them", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));

    await manager.warmSelectedSearchablesCache(["OFF1"]);

    const search = (mockMultiSearch.mock.calls[0][0] as any).searches[0];
    // The plan's hasCaseload clause carries into the by-id refetch, matching
    // the Firestore path: selected pills resolve from availableOfficers, which
    // is itself restricted to officers with a caseload.
    expect(search.filter_by).toBe(
      "stateCode:=`US_ND` && hasCaseload:=true && staffExternalId:=[`OFF1`]",
    );
    expect(manager.resolveSelectedSearchables(["OFF1"])).toHaveLength(1);
  });

  test("no-ops without a network call when every id is already cached", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    mockMultiSearch.mockClear();

    await manager.warmSelectedSearchablesCache(["OFF1"]);
    expect(mockMultiSearch).not.toHaveBeenCalled();
  });

  test("only fetches the ids that aren't cached yet", async () => {
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    mockMultiSearch.mockClear();
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF2", "Bob"));

    await manager.warmSelectedSearchablesCache(["OFF1", "OFF2"]);

    const search = (mockMultiSearch.mock.calls[0][0] as any).searches[0];
    expect(search.filter_by).toBe(
      "stateCode:=`US_ND` && hasCaseload:=true && staffExternalId:=[`OFF2`]",
    );
  });

  test("re-fetches ids cached under a different system", async () => {
    // Cached while SUPERVISION was active.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF1", "Alice"));
    await manager.search("alice");
    mockMultiSearch.mockClear();

    // On an incarceration page the cached entry no longer resolves, so the
    // warm-up asks this system's collection for it (and gets nothing back).
    workflowsStore.systemConfigFor = vi.fn(() => ({
      search: [
        { searchType: "INCARCERATION_OFFICER", searchTitle: "case manager" },
      ],
    }));
    workflowsStore.activeSystem = "INCARCERATION";
    // Discard the seed search the system-change reaction kicks off.
    mockMultiSearch.mockClear();
    mockMultiSearch.mockResolvedValueOnce({ results: [{ hits: [] }] });

    await manager.warmSelectedSearchablesCache(["OFF1"]);

    const search = (mockMultiSearch.mock.calls[0][0] as any).searches[0];
    expect(search.collection).toBe("incarcerationStaff");
    expect(manager.resolveSelectedSearchables(["OFF1"])).toEqual([]);
  });
});
