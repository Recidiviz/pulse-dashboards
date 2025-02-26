// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { UserRecord, UserUpdateRecord } from "../../FirestoreStore";
import {
  mockLocations,
  mockOfficer,
  mockSupervisionOfficers,
  mockSupervisor,
} from "../__fixtures__";
import { SearchStore } from "../SearchStore";
import { staffNameComparator } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";

let searchStore: SearchStore;
let workflowsStore: any;

const officers = [
  // two officers supervised by mockSupervisor, one supervised by someone else, plus the mockSupervisor
  {
    id: "XX_SUPERVISED_OFFICER2",
    stateCode: "US_XX",
    givenNames: "TestSupervisedOfficer2",
    surname: "AlphabeticallyFirst",
    supervisorExternalId: mockSupervisor.info.id,
    pseudonymizedId: "p002",
    recordType: "supervisionStaff",
  },
  {
    id: "XX_SUPERVISED_OFFICER1",
    stateCode: "US_XX",
    givenNames: "TestSupervisedOfficer1",
    surname: "AlphabeticallySecond",
    supervisorExternalId: mockSupervisor.info.id,
    pseudonymizedId: "p001",
    recordType: "supervisionStaff",
  },
  {
    id: "XX_SUPERVISED_OFFICER3",
    stateCode: "US_XX",
    givenNames: "TestSupervisedOfficer3",
    surname: "SupervisedBySomeoneElse",
    supervisorExternalId: "XX_SUPERVISOR_OTHER",
    pseudonymizedId: "p003",
    recordType: "supervisionStaff",
  },
  {
    ...mockSupervisor.info,
  },
];

const supervisedStaff = officers.filter(
  (o) => o.supervisorExternalId === mockSupervisor.info.id,
);

const mockUpdatedSelectedSearchIds = vi.fn();

beforeEach(() => {
  workflowsStore = observable({
    user: {
      ...mockOfficer,
      updates: {},
    },
    rootStore: {
      currentTenantId: "US_ND",
      firestoreStore: {
        updateSelectedSearchIds: mockUpdatedSelectedSearchIds,
      },
    },
    featureVariants: { workflowsSupervisorSearch: false },
    systemConfigFor: vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    })),
    activeSystemConfig: {
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    },
    activeSystem: "SUPERVISION",
    availableOfficers: [...mockSupervisionOfficers].sort(staffNameComparator),
    availableLocations: mockLocations,
  });
  searchStore = new SearchStore(workflowsStore as unknown as WorkflowsStore);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("searchTitleOverride", () => {
  test("when system == ALL returns the default title", () => {
    expect(searchStore.searchTitleOverride("ALL", "default")).toEqual(
      "default",
    );
  });

  test("when there is a searchTypeOverride it returns corresponding searchTitle", () => {
    workflowsStore.systemConfigFor = vi.fn((system) => ({
      search: [
        {
          searchType: "OFFICER",
          searchTitle: "officer title",
          searchField: "any",
        },
        {
          searchType: "LOCATION",
          searchTitle: "location title",
          searchField: "any",
        },
      ],
    }));
    searchStore.setSearchTypeOverride("LOCATION");
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "location title",
    );
  });

  test("when there is only one corresponding searchConfigs and no searchTypeOverride, it returns the search title", () => {
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "officer",
    );
  });

  test("when there are more than one corresponding searchConfigs and no searchTypeOverride, it returns the default", () => {
    workflowsStore.systemConfigFor = vi.fn((system) => ({
      search: [
        {
          searchType: "OFFICER",
          searchTitle: "officer title",
          searchField: "any",
        },
        {
          searchType: "LOCATION",
          searchTitle: "location title",
          searchField: "any",
        },
      ],
    }));
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "default",
    );
  });

  test("it applies the callbackFn", () => {
    const callback = (value: string) => {
      return [
        "case manager",
        "officer",
        "agent",
        "supervision officer",
      ].includes(value)
        ? "replacement value"
        : value;
    };
    expect(
      searchStore.searchTitleOverride("SUPERVISION", "default", callback),
    ).toEqual("replacement value");
  });
});

describe("availableSearchables", () => {
  test("for search by officer", async () => {
    const actual = searchStore.availableSearchables[0].searchables.map(
      (searchable) => {
        return {
          searchLabel: searchable.searchLabel,
          searchId: searchable.searchId,
        };
      },
    );

    expect(searchStore.availableSearchables).toBeArrayOfSize(1);
    expect(searchStore.availableSearchables[0].groupLabel).toBe("All Officers");
    expect(actual).toMatchInlineSnapshot(`
      [
        {
          "searchId": "XX_OFFICER2",
          "searchLabel": "TestOfficer AlphabeticallyFirst",
        },
        {
          "searchId": "XX_OFFICER1",
          "searchLabel": "TestOfficer AlphabeticallySecond",
        },
      ]
    `);
  });

  test("for search by officer when user has staff they supervise", async () => {
    workflowsStore.featureVariants.workflowsSupervisorSearch = {};
    workflowsStore.hasSupervisedStaffAndRequiredFeatureVariant = true;

    workflowsStore.staffSupervisedByCurrentUser = officers.filter(
      (o) => o.supervisorExternalId === mockSupervisor.info.id,
    );
    workflowsStore.availableOfficers = officers;

    expect(searchStore.availableSearchables).toBeArrayOfSize(2);
    expect(searchStore.availableSearchables[0].groupLabel).toBe("Your Team");
    expect(searchStore.availableSearchables[1].groupLabel).toBe("All Staff");

    const yourTeamSearchableIds =
      searchStore.availableSearchables[0].searchables.map(
        (officer) => officer.searchId,
      );
    const allStaffSearchableIds =
      searchStore.availableSearchables[1].searchables.map(
        (officer) => officer.searchId,
      );

    // alphabetically, Officer2 comes before Officer1
    expect(yourTeamSearchableIds).toEqual([
      "XX_SUPERVISED_OFFICER2",
      "XX_SUPERVISED_OFFICER1",
    ]);
    expect(allStaffSearchableIds).toEqual([
      "XX_SUPERVISED_OFFICER3",
      mockSupervisor.info.id,
    ]);
  });

  test("for search by location", async () => {
    workflowsStore.activeSystemConfig = {
      search: [{ searchType: "LOCATION", searchTitle: "facility" }],
    };
    const actual = searchStore.availableSearchables[0].searchables.map(
      (searchable) => {
        return {
          searchLabel: searchable.searchLabel,
          searchId: searchable.searchId,
        };
      },
    );
    expect(actual).toMatchInlineSnapshot(`
      [
        {
          "searchId": "FAC1",
          "searchLabel": "Facility 1",
        },
        {
          "searchId": "FAC2",
          "searchLabel": "Facility 2",
        },
      ]
    `);
  });

  test("when there are more than one search types", async () => {
    workflowsStore.activeSystemConfig = {
      search: [
        { searchType: "LOCATION", searchTitle: "facility" },
        { searchType: "OFFICER", searchTitle: "officer" },
      ],
    };
    // strip out actual data
    const actual = searchStore.availableSearchables.map((searchableGroup) => {
      return {
        groupLabel: searchableGroup.groupLabel,
        searchables: searchableGroup.searchables.map((searchable) => {
          const { searchLabel, searchId } = searchable;
          return { searchLabel, searchId };
        }),
      };
    });

    expect(actual).toMatchInlineSnapshot(`
      [
        {
          "groupLabel": "All Locations",
          "searchables": [
            {
              "searchId": "FAC1",
              "searchLabel": "Facility 1",
            },
            {
              "searchId": "FAC2",
              "searchLabel": "Facility 2",
            },
          ],
        },
        {
          "groupLabel": "All Officers",
          "searchables": [
            {
              "searchId": "XX_OFFICER2",
              "searchLabel": "TestOfficer AlphabeticallyFirst",
            },
            {
              "searchId": "XX_OFFICER1",
              "searchLabel": "TestOfficer AlphabeticallySecond",
            },
          ],
        },
      ]
    `);
  });
});

describe("searchType", () => {
  test("searchType when there is a single search config", async () => {
    workflowsStore.activeSystemConfig = {
      search: [{ searchType: "LOCATION" }],
    };
    expect(searchStore.searchType).toEqual("LOCATION");
  });

  test("searchType when there is are multiple searchConfigs", async () => {
    workflowsStore.activeSystemConfig = {
      search: [
        {
          searchType: "OFFICER",
        },
        { searchType: "LOCATION" },
      ],
    };
    expect(searchStore.searchType).toEqual("ALL");
  });

  test("searchType when activeSystem is ALL", async () => {
    workflowsStore.activeSystemConfig = {
      search: [
        {
          searchType: "OFFICER",
        },
      ],
    };
    workflowsStore.activeSystem = "ALL";
    expect(searchStore.searchType).toEqual("ALL");
  });

  test("searchType when there is a searchTypeOverride", async () => {
    workflowsStore.activeSystemConfig = {
      search: [
        {
          searchType: "OFFICER",
        },
      ],
    };
    searchStore.searchTypeOverride = "LOCATION";
    expect(searchStore.searchType).toEqual("LOCATION");
  });
});

describe("selectedSearchIds", () => {
  describe("for non-supervisors", () => {
    test("defaults to stored value", async () => {
      const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

      workflowsStore.user = {
        ...mockOfficer,
        updates: {
          ...(mockOfficer.updates as UserUpdateRecord),
          selectedSearchIds: mockStoredOfficers,
        },
      };

      expect(searchStore.selectedSearchIds).toEqual(mockStoredOfficers);
    });

    test("caseload syncs with stored value changes", async () => {
      const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

      workflowsStore.user.updates = {
        stateCode: mockOfficer.info.stateCode,
        selectedSearchIds: mockStoredOfficers,
      };

      expect(searchStore.selectedSearchIds).toEqual(mockStoredOfficers);
    });

    test("uses selectedSearchIdsForImpersonation for impersonated user", async () => {
      workflowsStore.user = {
        updates: {
          stateCode: mockOfficer.info.stateCode,
          selectedSearchIds: ["OTHER_OFFICER"],
        },
      };
      workflowsStore.rootStore.isImpersonating = true;
      searchStore.selectedSearchIdsForImpersonation = ["OFFICER2"];

      expect(searchStore.selectedSearchIds).toEqual(["OFFICER2"]);
    });
  });

  describe("for supervisors with no caseload", () => {
    beforeEach(async () => {
      workflowsStore.featureVariants = { workflowsSupervisorSearch: {} };
      workflowsStore.user = {
        ...mockSupervisor,
        info: { ...(mockSupervisor.info as UserRecord), hasCaseload: false },
      };
      workflowsStore.staffSupervisedByCurrentUser = supervisedStaff;
    });

    test("defaults to no selected search if user has no supervised staff", async () => {
      workflowsStore.staffSupervisedByCurrentUser = [];
      // no supervised people are populated
      expect(searchStore.selectedSearchIds).toEqual([]);
    });

    test("defaults to current user's supervised staff", async () => {
      workflowsStore.staffSupervisedByCurrentUser = supervisedStaff;
      expect(searchStore.selectedSearchIds).toEqual(
        supervisedStaff.map((s) => s.id),
      );
    });

    test("defaults to selectedSearchIdsForSupervisorsWithStaff if present", async () => {
      const searchIds = ["ID1", "ID2"];
      searchStore.selectedSearchIdsForSupervisorsWithStaff = searchIds;
      expect(searchStore.selectedSearchIds).toEqual(searchIds);
    });
  });

  describe("for supervisors with a caseload", () => {
    beforeEach(async () => {
      workflowsStore.featureVariants = { workflowsSupervisorSearch: {} };
      workflowsStore.user = {
        ...mockSupervisor,
        info: { ...(mockSupervisor.info as UserRecord), hasCaseload: true },
      };
      workflowsStore.staffSupervisedByCurrentUser = supervisedStaff;
    });

    test("includes current user", async () => {
      expect(searchStore.selectedSearchIds).toEqual([
        mockSupervisor.info.id,
        ...supervisedStaff.map((s) => s.id),
      ]);
    });

    test("defaults to selectedSearchIdsForSupervisorsWithStaff if present", async () => {
      const searchIds = ["ID1", "ID2"];
      searchStore.selectedSearchIdsForSupervisorsWithStaff = searchIds;
      expect(searchStore.selectedSearchIds).toEqual(searchIds);
    });
  });

  describe("updateSelectedSearch", () => {
    beforeEach(async () => {
      workflowsStore.featureVariants = { workflowsSupervisorSearch: {} };
      workflowsStore.user = {
        ...mockSupervisor,
        info: { ...(mockSupervisor.info as UserRecord), hasCaseload: true },
      };
      workflowsStore.staffSupervisedByCurrentUser = supervisedStaff;
    });

    test("selectedSearchIds reflects updated list after user makes new search updates", async () => {
      // user selects themselves
      searchStore.updateSelectedSearch([searchStore.selectedSearchIds[0]]);

      expect(mockUpdatedSelectedSearchIds).toHaveBeenCalledWith(
        mockSupervisor.info.email,
        "US_ND",
        [searchStore.selectedSearchIds[0]],
      );
      expect(searchStore.selectedSearchIds).toEqual([
        searchStore.selectedSearchIds[0],
      ]);

      // user selects another officer
      searchStore.updateSelectedSearch([
        ...searchStore.selectedSearchIds,
        "ID2",
      ]);

      expect(mockUpdatedSelectedSearchIds).toHaveBeenCalledWith(
        mockSupervisor.info.email,
        "US_ND",
        [searchStore.selectedSearchIds[0], "ID2"],
      );
      expect(searchStore.selectedSearchIds).toEqual([
        searchStore.selectedSearchIds[0],
        "ID2",
      ]);
    });
  });
});
