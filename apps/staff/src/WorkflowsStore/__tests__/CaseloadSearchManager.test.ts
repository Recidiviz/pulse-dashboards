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
} from "../CaseloadSearchManager";
import { SearchStore } from "../SearchStore";
import { PlannedTypesenseSearch } from "../types";
import { staffNameComparator } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";

let searchStore: SearchStore;
let workflowsStore: any;
let manager: CaseloadSearchManager;

beforeEach(() => {
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
    expect(plan[0].groupLabel).toBe("agents");
    expect(plan[0].descriptor).toMatchObject({
      collection: "supervisionStaff",
      q: "al",
      query_by: "givenNames,surname,email",
      filter_by: "stateCode:=`US_UT`",
    });
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

  test("group label uses justAppendS when config sets searchTitleIgnoreCase", () => {
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
    // justAppendS: true → simple "s" suffix, bypassing pluralize's irregulars
    expect(plan[0].groupLabel).toBe("staffs");
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
});

describe("composeSearchableGroups", () => {
  const staffPlan: PlannedTypesenseSearch = {
    descriptor: {},
    collection: "supervisionStaff",
    groupLabel: "officers",
  };
  const locationsPlan: PlannedTypesenseSearch = {
    descriptor: {},
    collection: "locations",
    groupLabel: "districts",
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
    };
    const unitPlan: PlannedTypesenseSearch = {
      descriptor: {},
      collection: "locations",
      groupLabel: "units",
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
    expect(manager.results[0].groupLabel).toBe("officers");
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
    expect(manager.searchableCache.get("OFF1")?.searchLabel).toBe(
      "Alice Smith",
    );

    // A later query for a different name must not evict the earlier entry.
    mockMultiSearch.mockResolvedValueOnce(staffResponse("OFF2", "Bob"));
    await manager.search("bob");
    expect(manager.searchableCache.get("OFF1")?.searchLabel).toBe(
      "Alice Smith",
    );
    expect(manager.searchableCache.get("OFF2")?.searchLabel).toBe("Bob Smith");
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
    expect(search.filter_by).toBe(
      "stateCode:=`US_ND` && staffExternalId:=[`OFF1`]",
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
      "stateCode:=`US_ND` && staffExternalId:=[`OFF2`]",
    );
  });
});
