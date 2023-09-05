/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { add } from "date-fns";
import { difference } from "lodash";
import { computed, configure, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import FirestoreStore, {
  ClientRecord,
  CombinedUserRecord,
  MilestonesMessage,
  ResidentRecord,
  TextMessageStatus,
  UserUpdateRecord,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import { isDemoMode } from "../../utils/isDemoMode";
import type { WorkflowsStore } from "..";
import {
  ineligibleClient,
  lsuAlmostEligibleClient,
  milestonesClient,
  mockClients,
  mockLocations,
  mockOfficer,
  mockOfficer2,
  mockOfficers,
  mockResidents,
  mockSupervisor,
} from "../__fixtures__";
import { Client } from "../Client";
import {
  CompliantReportingOpportunity,
  LSUOpportunity,
  UsNdEarlyTerminationOpportunity,
} from "../Opportunity";
import { Resident } from "../Resident";
import { MilestonesMessageUpdateSubscription } from "../subscriptions/MilestonesMessageUpdateSubscription";
import { filterByUserDistrict } from "../utils";

jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");

  return {
    __esModule: true,
    ...originalModule,
    connectFirestoreEmulator: jest.fn(),
  };
});
const testStateCodes = [
  "US_ME",
  "US_BB",
  "US_MO",
  "US_TN",
  "US_XX",
  "US_YY",
] as const;

type testStateCode = typeof testStateCodes[number];
const stateConfigs: Record<testStateCode | "RECIDIVIZ", any> = {
  US_XX: {
    opportunityTypes: ["compliantReporting", "LSU"],
    workflowsSupportedSystems: ["SUPERVISION"],
    availableStateCodes: ["US_XX"],
  },
  US_YY: {
    workflowsSupportedSystems: ["SUPERVISION"],
    availableStateCodes: ["US_YY"],
  },
  US_TN: {
    opportunityTypes: [
      "compliantReporting",
      "supervisionLevelDowngrade",
      "usTnExpiration",
    ],
    workflowsSupportedSystems: ["SUPERVISION"],
    availableStateCodes: ["US_TN"],
  },
  US_BB: {
    workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
    workflowsGatedSystemsByFeatureVariant: {
      INCARCERATION: ["usIdCRC", "usIdExtendedCRC"],
    },
    availableStateCodes: ["US_BB"],
  },
  US_ME: {
    opportunityTypes: [],
    workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
    availableStateCodes: ["US_ME"],
  },
  US_MO: {
    opportunityTypes: ["usMoRestrictiveHousingStatusHearing"],
    workflowsSupportedSystems: ["INCARCERATION"],
    workflowsSystemConfigs: {
      INCARCERATION: {
        searchType: "LOCATION",
        searchField: "facilityId",
        searchTitleOverride: "location",
      },
    },
    availableStateCodes: ["US_MO"],
  },
  RECIDIVIZ: {
    availableStateCodes: ["US_ME", "US_BB", "US_MO", "US_TN", "US_XX", "US_YY"],
  },
};

jest.mock("../subscriptions");
jest.mock("../../tenants", () => ({
  __esModule: true,
  default: stateConfigs,
}));
jest.mock("../../utils/isDemoMode");

let rootStore: RootStore;
let workflowsStore: WorkflowsStore;
let testObserver: IDisposer;

function mockAuthedUser() {
  // mock successful authentication from Auth0
  runInAction(() => {
    rootStore.userStore.user = {
      email: mockOfficer.info.email,
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        stateCode: mockOfficer.info.stateCode,
        role: "leadership_role",
      },
    };
    rootStore.tenantStore.setCurrentTenantId(mockOfficer.info.stateCode as any);
  });
}

async function waitForHydration({
  info,
  updates,
}: CombinedUserRecord = mockOfficer): Promise<void> {
  workflowsStore.hydrate();

  // mock the results of active firestore subscriptions
  runInAction(() => {
    workflowsStore.userSubscription.data = [info];
    workflowsStore.userSubscription.isHydrated = true;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    // these subs will not be null because we called hydrate() above!
    workflowsStore.userUpdatesSubscription!.data = updates;
    workflowsStore.userUpdatesSubscription!.isHydrated = true;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  });

  await when(() => workflowsStore.isHydrated);
}

function populateClients(clients: ClientRecord[]): void {
  runInAction(() => {
    workflowsStore.clientsSubscription.data = clients;
    workflowsStore.clientsSubscription.isHydrated = true;
    workflowsStore.clientsSubscription.isLoading = false;
  });
}

function populateResidents(residents: ResidentRecord[]): void {
  runInAction(() => {
    workflowsStore.residentsSubscription.data = residents;
    workflowsStore.residentsSubscription.isHydrated = true;
    workflowsStore.residentsSubscription.isLoading = false;
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  // this lets us spy on observables, e.g. the tenant ID getter
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  jest.spyOn(AnalyticsStore.prototype, "trackCaseloadSearch");
  mockAuthedUser();
  workflowsStore = rootStore.workflowsStore;
  stateConfigs.US_XX.workflowsStaffFilterFn = filterByUserDistrict;

  runInAction(() => {
    workflowsStore.updateActiveSystem("SUPERVISION");
  });
});

afterEach(() => {
  configure({ safeDescriptors: true });
  window.localStorage.clear();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("hydration fails without authentication", () => {
  runInAction(() => {
    rootStore.userStore.user = undefined;
  });
  workflowsStore.hydrate();
  expect(workflowsStore.error).toEqual(expect.any(Error));
});

test("hydration creates subscriptions", () => {
  expect(workflowsStore.userUpdatesSubscription).toBeUndefined();

  workflowsStore.hydrate();

  expect(workflowsStore.userUpdatesSubscription).toBeDefined();
});

test("hydration triggers subscriptions", () => {
  workflowsStore.hydrate();

  expect(workflowsStore.userSubscription.hydrate).toHaveBeenCalled();
  expect(workflowsStore.userUpdatesSubscription?.hydrate).toHaveBeenCalled();
});

test("hydration reflects subscriptions", async () => {
  expect(workflowsStore.isHydrated).toBe(false);

  workflowsStore.hydrate();

  runInAction(() => {
    workflowsStore.userSubscription.isHydrated = true;
  });
  expect(workflowsStore.isHydrated).toBe(false);

  runInAction(() => {
    // @ts-expect-error
    workflowsStore.userSubscription.data = [{ stateCode: "US_XX" }];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.isHydrated = true;
  });

  expect(workflowsStore.isHydrated).toBe(true);
});

describe("hydration loading reflects subscriptions", () => {
  test.each([
    [undefined, undefined, undefined, undefined],
    [undefined, true, true, undefined],
    [undefined, false, true, undefined],
    [true, true, true, true],
    [true, false, true, true],
    [false, false, false, false],
  ])("%s + %s + %s = %s", (statusA, statusB, statusC, result) => {
    mockAuthedUser();
    workflowsStore.hydrate();

    runInAction(() => {
      workflowsStore.userSubscription.isLoading = statusA;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      workflowsStore.userUpdatesSubscription!.isLoading = statusB;
    });

    expect(workflowsStore.isLoading).toBe(result);
  });
});

test("hydration error reflects subscriptions", () => {
  mockAuthedUser();
  workflowsStore.hydrate();

  runInAction(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.error = new Error("TEST");
  });

  expect(workflowsStore.error).toEqual(expect.any(Error));
});

test("user data waits for hydration to be complete", () => {
  mockAuthedUser();
  workflowsStore.hydrate();

  expect(workflowsStore.user).toBeUndefined();
});

test("user data reflects subscriptions", async () => {
  await waitForHydration();

  expect(workflowsStore.user?.info).toEqual(mockOfficer.info);
});

test("caseload defaults to self", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.updateActiveSystem("SUPERVISION");
  });
  expect(workflowsStore.selectedSearchIds).toEqual([mockOfficer.info.id]);
  expect(rootStore.analyticsStore.trackCaseloadSearch).toHaveBeenCalledWith({
    searchCount: 1,
    isDefault: true,
    searchType: "OFFICER",
  });
});

test("caseload defaults to no selected search if the user has no saved search and the state is not search-by-officer", async () => {
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = "US_MO";
    workflowsStore.updateActiveSystem("INCARCERATION");
  });

  await waitForHydration();
  expect(workflowsStore.selectedSearchIds).toEqual([]);
});

test("caseload defaults to no selected search if user has no caseload and no saved search", async () => {
  await waitForHydration(mockSupervisor);

  expect(workflowsStore.selectedSearchIds).toEqual([]);
});

test("caseload defaults to stored value", async () => {
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

  await waitForHydration({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedSearchIds: mockStoredOfficers,
    },
  });

  expect(workflowsStore.selectedSearchIds).toEqual(mockStoredOfficers);
});

test("caseload defaults to stored value for states that are not search-by-officer", async () => {
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = "US_MO";
  });
  const mockStoredLocations = ["LOC1", "LOC3"];

  await waitForHydration({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedSearchIds: mockStoredLocations,
    },
  });

  expect(workflowsStore.selectedSearchIds).toEqual(mockStoredLocations);
});

test("default caseload does not override empty stored value", async () => {
  await waitForHydration({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedSearchIds: [],
    },
  });
  expect(workflowsStore.selectedSearchIds).toEqual([]);
});

test("caseload syncs with stored value changes", async () => {
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

  await waitForHydration();

  runInAction(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rootStore.workflowsStore.userUpdatesSubscription!.data = {
      stateCode: mockOfficer.info.stateCode,
      selectedSearchIds: mockStoredOfficers,
    };
  });

  expect(workflowsStore.selectedSearchIds).toEqual(mockStoredOfficers);
});

test("officers from subscription", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.officersSubscription.data = mockOfficers;
  });
  expect(workflowsStore.availableOfficers).toEqual(mockOfficers);
});

test("locations from subscription", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.locationsSubscription.data = mockLocations;
  });
  expect(workflowsStore.availableLocations).toEqual(mockLocations);
});

test("available searchables for search by officer", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.updateActiveSystem("SUPERVISION");
    workflowsStore.officersSubscription.data = mockOfficers;
    workflowsStore.locationsSubscription.data = mockLocations;
  });

  const actual = workflowsStore.availableSearchables.map((searchable) => {
    return {
      searchLabel: searchable.searchLabel,
      searchId: searchable.searchId,
    };
  });
  const expected = [
    {
      searchLabel: "Foo Fakename",
      searchId: "OFFICER2",
    },
    {
      searchLabel: "Bar Realname",
      searchId: "OFFICER3",
    },
  ];

  expect(actual).toEqual(expected);
});

test("available searchables for search by location", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.updateActiveSystem("INCARCERATION");
    rootStore.tenantStore.currentTenantId = "US_MO";
    workflowsStore.officersSubscription.data = mockOfficers;
    workflowsStore.locationsSubscription.data = mockLocations;
  });

  const actual = workflowsStore.availableSearchables.map((searchable) => {
    return {
      searchLabel: searchable.searchLabel,
      searchId: searchable.searchId,
    };
  });
  const expected = [
    {
      searchLabel: "Facility 1",
      searchId: "FAC1",
    },
    {
      searchLabel: "Facility 2",
      searchId: "FAC2",
    },
  ];

  expect(actual).toEqual(expected);
});

test("update clients from subscription", async () => {
  await waitForHydration();

  populateClients(mockClients);
  expect(workflowsStore.justiceInvolvedPersons).toEqual({
    [mockClients[0].pseudonymizedId]: expect.any(Client),
    [mockClients[1].pseudonymizedId]: expect.any(Client),
    [mockClients[2].pseudonymizedId]: expect.any(Client),
  });
  mockClients.forEach(({ pseudonymizedId }) => {
    expect(
      workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId
    ).toBe(pseudonymizedId);
  });
});

describe("caseloadSubscription", () => {
  describe("when activeSystem is 'ALL'", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("ALL");
    });
    it("updates justiceInvolvedPersons from both resident and client subscriptions", async () => {
      await waitForHydration();

      populateClients(mockClients);
      populateResidents(mockResidents);

      expect(workflowsStore.justiceInvolvedPersons).toEqual({
        [mockClients[0].pseudonymizedId]: expect.any(Client),
        [mockClients[1].pseudonymizedId]: expect.any(Client),
        [mockClients[2].pseudonymizedId]: expect.any(Client),
        [mockResidents[0].pseudonymizedId]: expect.any(Resident),
      });
      [...mockClients, ...mockResidents].forEach(({ pseudonymizedId }) => {
        expect(
          workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId
        ).toBe(pseudonymizedId);
      });
    });
  });
  describe("when activeSystem is 'INCARCERATION'", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("INCARCERATION");
    });
    it("updates justiceInvolvedPersons to residents", async () => {
      await waitForHydration();

      populateClients(mockClients);
      populateResidents(mockResidents);

      expect(workflowsStore.justiceInvolvedPersons).toEqual({
        [mockResidents[0].pseudonymizedId]: expect.any(Resident),
      });

      mockResidents.forEach(({ pseudonymizedId }) => {
        expect(
          workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId
        ).toBe(pseudonymizedId);
      });
    });
  });
  describe("when activeSystem is 'SUPERVISION'", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
    });
    it("updates justiceInvolvedPersons to clients", async () => {
      await waitForHydration();

      populateClients(mockClients);
      populateResidents(mockResidents);

      expect(workflowsStore.justiceInvolvedPersons).toEqual({
        [mockClients[0].pseudonymizedId]: expect.any(Client),
        [mockClients[1].pseudonymizedId]: expect.any(Client),
        [mockClients[2].pseudonymizedId]: expect.any(Client),
      });
      mockClients.forEach(({ pseudonymizedId }) => {
        expect(
          workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId
        ).toBe(pseudonymizedId);
      });
    });
  });
});

test("districtsFilteredBy reflects user data", async () => {
  await waitForHydration();
  expect(workflowsStore.districtsFilteredBy).toStrictEqual([
    mockOfficer.info.district,
  ]);
});

test("tenants without workflowsStaffFilterFn search all districts", async () => {
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = "US_YY" as any;
  });

  await waitForHydration();

  expect(workflowsStore.districtsFilteredBy).toBeUndefined();
});

test("setting overrideDistrictIds in UserUpdates overrides user district", async () => {
  const myOfficer = { ...mockOfficer };
  myOfficer.updates = {
    stateCode: "US_XX",
    overrideDistrictIds: ["D1", "D77"],
  };
  await waitForHydration(myOfficer);

  expect(workflowsStore.districtsFilteredBy).toStrictEqual(["D1", "D77"]);
});

test("setting overrideDistrictIds in UserUpdates overrides undefined workflowsStaffFilterFn", async () => {
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = "US_YY" as any;
  });

  const myOfficer = { ...mockOfficer };
  myOfficer.updates = {
    stateCode: "US_XX",
    overrideDistrictIds: ["D1", "D77"],
  };
  await waitForHydration(myOfficer);

  expect(workflowsStore.districtsFilteredBy).toStrictEqual(["D1", "D77"]);
});

test("no client selected", async () => {
  await waitForHydration();

  runInAction(() => {
    (workflowsStore.user as any).updates = { selectedSearchIds: ["OFFICER1"] };
  });

  // simulate a UI displaying CR data
  testObserver = keepAlive(
    computed(() => workflowsStore.eligibleOpportunities.compliantReporting)
  );

  expect(workflowsStore.selectedClient).toBeUndefined();
});

test("select existing client", async () => {
  populateClients(mockClients);

  const idToSelect = ineligibleClient.pseudonymizedId;

  await workflowsStore.updateSelectedPerson(idToSelect);

  // simulate a UI displaying client data
  testObserver = keepAlive(computed(() => workflowsStore.selectedClient));

  expect(workflowsStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

test("select unfetched client", async () => {
  await waitForHydration();

  const idToSelect = "unknownId";

  jest.spyOn(FirestoreStore.prototype, "getClient").mockResolvedValue({
    ...ineligibleClient,
    pseudonymizedId: idToSelect,
  });

  await workflowsStore.updateSelectedPerson(idToSelect);

  await when(() => workflowsStore.selectedClient !== undefined);

  expect(rootStore.firestoreStore.getClient).toHaveBeenCalledWith(
    idToSelect,
    ineligibleClient.stateCode
  );
  expect(workflowsStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

describe("opportunitiesLoaded", () => {
  test("opportunitiesLoaded is true when clients are loaded and there are no clients", async () => {
    // officer2 has no clients
    await waitForHydration(mockOfficer2);
    populateClients([]);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting"])
    ).toBeTrue();
  });

  test("opportunitiesLoaded is false when clients are loading and we have not subscribed to clients", async () => {
    await waitForHydration(mockSupervisor);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting"])
    ).toBeFalse();
  });

  test("opportunitiesLoaded is false when clients are loading", async () => {
    await waitForHydration();
    populateClients(mockClients);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting"])
    ).toBeFalse();
  });

  test("opportunitiesLoaded is false when not all provided opportunities are hydrated", async () => {
    const compliantReportingIsHydratedMock = jest.spyOn(
      CompliantReportingOpportunity.prototype,
      "isHydrated",
      "get"
    );
    const lsuIsHydratedMock = jest.spyOn(
      LSUOpportunity.prototype,
      "isHydrated",
      "get"
    );
    await waitForHydration();
    populateClients(mockClients);

    compliantReportingIsHydratedMock.mockReturnValue(true);
    lsuIsHydratedMock.mockReturnValue(false);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting", "LSU"])
    ).toBeFalse();
  });

  test("opportunitiesLoaded is true when opportunities are hydrated", async () => {
    const isLoadingMock = jest.spyOn(
      CompliantReportingOpportunity.prototype,
      "isLoading",
      "get"
    );
    await waitForHydration();
    populateClients(mockClients);

    isLoadingMock.mockReturnValue(false);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting"])
    ).toBeTrue();
  });
});

describe("hasOpportunities", () => {
  test("hasOpportunities is false if there are no clients loaded", async () => {
    await waitForHydration();
    populateClients([]);
    expect(workflowsStore.hasOpportunities(["compliantReporting"])).toBeFalse();
  });

  test("hasOpportunities is false if no client has opportunities", async () => {
    await waitForHydration();
    populateClients([ineligibleClient]);
    expect(workflowsStore.hasOpportunities(["compliantReporting"])).toBeFalse();
  });

  test("hasOpportunities is false if no client has opportunities for those types", async () => {
    const isHydratedMock = jest.spyOn(
      CompliantReportingOpportunity.prototype,
      "isHydrated",
      "get"
    );
    await waitForHydration();
    populateClients(mockClients);
    isHydratedMock.mockReturnValue(true);
    expect(workflowsStore.hasOpportunities(["earlyTermination"])).toBeFalse();
  });

  test("hasOpportunities is true if any client has opportunities for any of the provided types", async () => {
    jest
      .spyOn(CompliantReportingOpportunity.prototype, "isHydrated", "get")
      .mockReturnValue(true);
    jest
      .spyOn(CompliantReportingOpportunity.prototype, "isLoading", "get")
      .mockReturnValue(false);
    jest
      .spyOn(UsNdEarlyTerminationOpportunity.prototype, "isHydrated", "get")
      .mockReturnValue(true);
    jest
      .spyOn(UsNdEarlyTerminationOpportunity.prototype, "isLoading", "get")
      .mockReturnValue(false);

    await waitForHydration();
    populateClients(mockClients);

    expect(
      workflowsStore.hasOpportunities([
        "earlyTermination",
        "compliantReporting",
      ])
    ).toBeTrue();
  });
});

describe("feature variants", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("feature variants active by default for Recidiviz users", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "RECIDIVIZ",
          featureVariants: undefined,
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toMatchInlineSnapshot(`
      Object {
        "CompliantReportingAlmostEligible": Object {},
        "TEST": Object {},
        "responsiveRevamp": Object {},
        "usCaEnableSMS": Object {},
        "usIdCRC": Object {},
        "usIdExpandedCRC": Object {},
        "usMeFurloughRelease": Object {},
        "usMeWorkRelease": Object {},
        "usTnExpiration": Object {},
        "usTnExpirationSubmitToTomis": Object {},
      }
    `);
  });

  test("recidiviz user with feature variant defined", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "RECIDIVIZ",
          featureVariants: { TEST: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({ TEST: {} });
  });

  test("no feature variants", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({});
  });

  test("variant with no active date", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          featureVariants: { TEST: { variant: "a" } },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({
      TEST: { variant: "a" },
    });
  });

  test("variant with past active date", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          featureVariants: {
            TEST: {
              activeDate: add(new Date(), { seconds: -1 }).toISOString(),
            },
          },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({
      TEST: {},
    });
  });

  test("variant with future active date", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          featureVariants: {
            TEST: {
              activeDate: add(new Date(), { seconds: 1 }).toISOString(),
            },
          },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });
    expect(workflowsStore.featureVariants).toEqual({});

    // We check once a second to see if the feature variant is active now, and since we set it to be
    // active 1 second in the future, the feature variant should become active if we advance time by 1
    // second.
    jest.advanceTimersByTime(1000);

    expect(workflowsStore.featureVariants).toEqual({
      TEST: {},
    });
  });

  test("demo mode with demo variant defined", () => {
    const isDemoModeMock = isDemoMode as jest.Mock;
    isDemoModeMock.mockReturnValue(true);
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          featureVariants: { TEST: { variant: "a" } },
          demoModeFeatureVariants: { usMeWorkRelease: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({
      usMeWorkRelease: {},
    });
  });

  test("demo mode with demo variant not defined", () => {
    const isDemoModeMock = isDemoMode as jest.Mock;
    isDemoModeMock.mockReturnValue(true);
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          featureVariants: { TEST: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({
      TEST: {},
    });
  });

  test("non-demo mode with demo variant defined", () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: mockOfficer.info.email,
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: mockOfficer.info.stateCode,
          demoModeFeatureVariants: { TEST: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.featureVariants).toEqual({});
  });
});

describe("Additional workflowsSupportedSystems and unsupportedWorkflowSystemsByFeatureVariants testing", () => {
  const SESSION_STATE_CODE = "US_BB" as any;
  const TEST_GATED_SYSTEM = "INCARCERATION";
  const SESSION_SUPPORTED_SYSTEMS =
    stateConfigs[SESSION_STATE_CODE as testStateCode].workflowsSupportedSystems;
  const SESSION_SYSTEMS_WITH_GATES = Object.keys(
    (stateConfigs[SESSION_STATE_CODE as testStateCode]
      .workflowsGatedSystemsByFeatureVariant as Record<any, any[]>) || {}
  );
  const SESSION_SYSTEMS_WITHOUT_GATES = difference(
    SESSION_SUPPORTED_SYSTEMS,
    SESSION_SYSTEMS_WITH_GATES
  );
  const setUser = (featureVariants: any, stateCode = SESSION_STATE_CODE) => {
    rootStore.userStore.user = {
      email: "foo@example.com",
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        stateCode,
        featureVariants,
      },
    };
    rootStore.userStore.userIsLoading = false;
  };

  beforeEach(async () => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = SESSION_STATE_CODE;
    });
    await waitForHydration({ ...mockOfficer });
  });

  test("includes associated system when user has every featureVariant in list", () => {
    setUser({ usIdCRC: {}, usIdExpandedCRC: {} });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(
      expect.arrayContaining([
        TEST_GATED_SYSTEM,
        ...SESSION_SYSTEMS_WITHOUT_GATES,
      ])
    );
  });

  test("includes the supported systems when having only one featureVariant from the approved list", () => {
    setUser({ usIdCRC: {} });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(
      expect.arrayContaining([
        TEST_GATED_SYSTEM,
        ...SESSION_SYSTEMS_WITHOUT_GATES,
      ])
    );
  });

  test("does not include supported system if the user does not have featureVariant", () => {
    setUser({});
    expect(workflowsStore.workflowsSupportedSystems).not.toContain(
      TEST_GATED_SYSTEM
    );
    expect(workflowsStore.workflowsSupportedSystems).not.toEqual(
      expect.arrayContaining([
        TEST_GATED_SYSTEM,
        ...SESSION_SYSTEMS_WITHOUT_GATES,
      ])
    );
  });

  test(`unsupportedWorkflowsSystems contains ${TEST_GATED_SYSTEM} if user does not have associated featureVariant for gated system`, () => {
    setUser({});
    expect(workflowsStore.unsupportedWorkflowSystemsByFeatureVariants).toEqual(
      expect.arrayContaining([TEST_GATED_SYSTEM])
    );
    expect(
      workflowsStore.unsupportedWorkflowSystemsByFeatureVariants
    ).not.toEqual(expect.arrayContaining([...SESSION_SYSTEMS_WITHOUT_GATES]));
  });

  test.each(
    // test only state codes that also have TEST_GATED_SYSTEM enabled and not gated
    testStateCodes.filter(
      (code) =>
        code !== SESSION_STATE_CODE &&
        (
          (stateConfigs[code].workflowsSupportedSystems as any[]) || []
        ).includes(TEST_GATED_SYSTEM) &&
        !Object.keys(
          (stateConfigs[code].workflowsGatedSystemsByFeatureVariant as Record<
            any,
            any[]
          >) || {}
        ).includes(TEST_GATED_SYSTEM)
    )
  )(
    `given gated system(s), ${TEST_GATED_SYSTEM}, in ${SESSION_STATE_CODE}, %p systems remain unaffected when the same system is gated in another stateCode`,
    (stateCode) => {
      setUser({}, stateCode);
      expect(workflowsStore.workflowsSupportedSystems).toContain(
        TEST_GATED_SYSTEM
      );
      expect(
        workflowsStore.unsupportedWorkflowSystemsByFeatureVariants
      ).not.toContain(TEST_GATED_SYSTEM);

      const SYSTEMS_WITHOUT_GATING_IN_OTHER_STATES = difference(
        stateConfigs[stateCode].workflowsSupportedSystems as any[],
        Object.keys(
          (stateConfigs[stateCode]
            .workflowsGatedSystemsByFeatureVariant as Record<any, any[]>) || {}
        )
      );
      expect(workflowsStore.workflowsSupportedSystems).toEqual(
        expect.arrayContaining([
          TEST_GATED_SYSTEM,
          ...SYSTEMS_WITHOUT_GATING_IN_OTHER_STATES,
        ])
      );
    }
  );
});

describe("opportunityTypes for US_TN", () => {
  beforeEach(() => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_TN";
    });
  });

  test("includes all non-gated opportunityTypes", async () => {
    await waitForHydration({ ...mockOfficer });
    expect(workflowsStore.opportunityTypes.sort()).toEqual([
      "compliantReporting",
      "supervisionLevelDowngrade",
    ]);
  });

  test("includes usTnExpiration", async () => {
    await waitForHydration({
      ...mockOfficer,
    });
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "US_TN",
          featureVariants: { usTnExpiration: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });

    expect(workflowsStore.opportunityTypes).toContain("usTnExpiration");
  });
});

describe("opportunityTypes are gated by gatedOpportunities when set", () => {
  beforeEach(() => {
    runInAction(() => {
      // @ts-expect-error
      rootStore.tenantStore.currentTenantId = "US_XX";
      workflowsStore.gatedOpportunities = {
        LSU: "TEST",
      };
    });
  });

  test("gated opportunity is not enabled when feature variant is not set for current user", async () => {
    await waitForHydration({ ...mockOfficer });
    expect(workflowsStore.opportunityTypes).toEqual(["compliantReporting"]);
  });

  test("gated opportunity is enabled when feature variant is set for current user", async () => {
    await waitForHydration({ ...mockOfficer });
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "US_XX",
          featureVariants: { TEST: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
    });
    expect(workflowsStore.opportunityTypes.sort()).toEqual([
      "LSU",
      "compliantReporting",
    ]);
  });
});

describe("getMilestonesClientsByStatus", () => {
  beforeEach(async () => {
    // Populate clients with the same number of statuses to test
    populateClients([
      ...mockClients,
      lsuAlmostEligibleClient,
      milestonesClient,
    ]);
    await waitForHydration();

    runInAction(() => {
      const messageStatuses: Partial<TextMessageStatus>[] = [
        "IN_PROGRESS",
        "SUCCESS",
        "FAILURE",
        "DECLINED",
      ];
      // Assign each client one of the possible message statuses
      workflowsStore.milestonesClients.forEach((client, index) => {
        if (index === 0) {
          // eslint-disable-next-line no-param-reassign
          client.milestonesMessageUpdatesSubscription = undefined;
        }
        // eslint-disable-next-line no-param-reassign
        client.milestonesMessageUpdatesSubscription = {
          data: {
            status: messageStatuses[index],
          } as MilestonesMessage,
        } as MilestonesMessageUpdateSubscription<MilestonesMessage>;
      });
    });
  });

  test("Clients who have not had a message sent yet", () => {
    const newMilestonesClients = workflowsStore.getMilestonesClientsByStatus();
    expect(newMilestonesClients.length).toEqual(1);
    expect(
      newMilestonesClients[0].milestoneMessagesUpdates?.status
    ).toBeUndefined();
  });

  test("Clients whose messages are in progress or have been sent", () => {
    const congratulatedMilestonesClients =
      workflowsStore.getMilestonesClientsByStatus(["IN_PROGRESS", "SUCCESS"]);
    expect(congratulatedMilestonesClients.length).toEqual(2);
    expect(
      congratulatedMilestonesClients.map(
        (c) => c.milestoneMessagesUpdates?.status
      )
    ).toIncludeAllMembers(["IN_PROGRESS", "SUCCESS"]);
  });

  test("Clients whose officers declined to send a message", () => {
    const declinedMilestonesClients =
      workflowsStore.getMilestonesClientsByStatus(["DECLINED"]);
    expect(declinedMilestonesClients.length).toEqual(1);
    expect(
      declinedMilestonesClients.map((c) => c.milestoneMessagesUpdates?.status)
    ).toIncludeAllMembers(["DECLINED"]);
  });
  test("Clients who had an error sending the message", () => {
    const errorMilestonesClients = workflowsStore.getMilestonesClientsByStatus([
      "FAILURE",
    ]);
    expect(errorMilestonesClients.length).toEqual(1);
    expect(
      errorMilestonesClients.map((c) => c.milestoneMessagesUpdates?.status)
    ).toIncludeAllMembers(["FAILURE"]);
  });
});

describe("residents for US_ME", () => {
  test("populate residents", async () => {
    populateResidents(mockResidents);

    await waitForHydration();

    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_ME";
      workflowsStore.updateActiveSystem("INCARCERATION");
      workflowsStore.residentsSubscription.data = mockResidents;
      workflowsStore.residentsSubscription.isHydrated = true;
      workflowsStore.residentsSubscription.isLoading = false;
    });

    expect(workflowsStore.justiceInvolvedPersons).toEqual({
      [mockResidents[0].pseudonymizedId]: expect.any(Resident),
    });
    mockResidents.forEach(({ pseudonymizedId }) => {
      expect(
        workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId
      ).toBe(pseudonymizedId);
    });
  });
});
