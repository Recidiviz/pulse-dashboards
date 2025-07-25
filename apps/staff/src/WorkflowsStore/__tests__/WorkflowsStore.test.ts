// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { difference, mapValues, noop } from "lodash";
import { computed, configure, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  ClientRecord,
  OpportunityType,
  ResidentRecord,
  SupervisionStaffRecord,
} from "~datatypes";
import { HydrationState } from "~hydration-utils";

import { mockOpportunityConfigs } from "../../core/__tests__/testUtils";
import { SystemId, TenantConfig } from "../../core/models/types";
import FirestoreStore, {
  CombinedUserRecord,
  MilestonesMessage,
  TextMessageStatus,
  UserUpdateRecord,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { FeatureVariant, TenantId } from "../../RootStore/types";
import UserStore from "../../RootStore/UserStore";
import type { OpportunityMapping, WorkflowsStore } from "..";
import {
  mockClients,
  mockIncarcerationOfficers,
  mockIneligibleClient,
  mockLocations,
  mockOfficer,
  mockOfficer2,
  mockResidents,
  mockSupervisionOfficers,
  mockSupervisor,
} from "../__fixtures__";
import { Client } from "../Client";
import { CompliantReportingOpportunity, LSUOpportunity } from "../Opportunity";
import {
  IApiOpportunityConfiguration,
  OpportunityConfiguration,
} from "../Opportunity/OpportunityConfigurations";
import { ApiOpportunityConfiguration } from "../Opportunity/OpportunityConfigurations/models/ApiOpportunityConfigurationImpl";
import { OpportunityManager } from "../Opportunity/OpportunityManager";
import { Resident } from "../Resident";
import { MilestonesMessageUpdateSubscription } from "../subscriptions/MilestonesMessageUpdateSubscription";
import { filterByUserDistrict } from "../utils";

vi.mock("firebase/firestore", async (importOriginal) => {
  const originalModule =
    await importOriginal<typeof import("firebase/firestore")>();

  return {
    __esModule: true,
    ...originalModule,
    connectFirestoreEmulator: vi.fn(),
  };
});

type testStateCode = "US_ME" | "US_BB" | "US_MO" | "US_TN" | "US_XX" | "US_YY";
const { stateConfigs } = vi.hoisted(() => {
  const stateConfigs: Record<testStateCode | "RECIDIVIZ", any> = {
    US_XX: {
      opportunityTypes: [
        "compliantReporting",
        "LSU",
        "usIdCRC",
        "usIdExtendedCRC",
      ],
      workflowsSupportedSystems: ["SUPERVISION"],
      availableStateCodes: ["US_XX"],
      workflowsSystemConfigs: {
        INCARCERATION: {
          search: [
            {
              searchType: "INCARCERATION_OFFICER",
              searchTitle: "case manager",
            },
          ],
        },
      },
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
      workflowsTasksConfig: {},
      workflowsSystemConfigs: {
        INCARCERATION: {
          search: [
            {
              searchType: "OFFICER",
              searchTitle: "case manager",
              restrictedToFeatureVariant: "TEST",
            },
            { searchType: "LOCATION" },
          ],
        },
        SUPERVISION: {
          search: [{ searchType: "LOCATION" }, { searchType: "OFFICER" }],
        },
      },
    },
    US_BB: {
      workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
      workflowsSystemsGatedByFeatureVariant: {
        INCARCERATION: ["usIdCRC", "usIdExtendedCRC"],
      },
      availableStateCodes: ["US_BB"],
    },
    US_ME: {
      opportunityTypes: [],
      workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
      availableStateCodes: ["US_ME"],
      workflowsTasksConfig: {},
    },
    US_MO: {
      opportunityTypes: ["usMoOverdueRestrictiveHousingRelease"],
      workflowsSupportedSystems: ["INCARCERATION"],
      workflowsSystemConfigs: {
        INCARCERATION: {
          search: [
            {
              searchType: "LOCATION",
              searchField: ["facilityId"],
              searchTitle: "location",
            },
          ],
        },
      },
      availableStateCodes: ["US_MO"],
    },
    RECIDIVIZ: {
      availableStateCodes: [
        "US_ME",
        "US_BB",
        "US_MO",
        "US_TN",
        "US_XX",
        "US_YY",
      ],
    },
  };
  return { stateConfigs };
});

vi.mock("../subscriptions");
vi.mock("../../tenants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../tenants")>()),
  TENANT_CONFIGS: stateConfigs,
}));

let rootStore: RootStore;
let workflowsStore: WorkflowsStore;
let testObserver: IDisposer;

function mockAuthedUser() {
  // mock successful authentication from Auth0
  runInAction(() => {
    rootStore.userStore.user = {
      email: mockOfficer.info.email,
      [`${import.meta.env.VITE_METADATA_NAMESPACE}app_metadata`]: {
        stateCode: mockOfficer.info.stateCode,
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
    workflowsStore.userSubscription.hydrationState = { status: "hydrated" };

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    // these subs will not be null because we called hydrate() above!
    workflowsStore.userUpdatesSubscription!.data = {
      ...updates,
      selectedSearchIds: [mockOfficer.info.id],
    } as UserUpdateRecord;
    workflowsStore.userUpdatesSubscription!.hydrationState = {
      status: "hydrated",
    };
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    workflowsStore.opportunityConfigurationStore.mockHydrated();
  });

  await when(() => workflowsStore.hydrationState.status === "hydrated");
}

function populateClients(clients: ClientRecord[]): void {
  runInAction(() => {
    workflowsStore.clientsSubscription.data = clients;
    workflowsStore.clientsSubscription.hydrationState = { status: "hydrated" };
  });
}

function populateResidents(residents: ResidentRecord[]): void {
  runInAction(() => {
    workflowsStore.residentsSubscription.data = residents;
    workflowsStore.residentsSubscription.hydrationState = {
      status: "hydrated",
    };
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  // this lets us spy on observables, e.g. the tenant ID getter
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
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
  workflowsStore.stopKeepingUserObserved();
});

test("hydration fails without authentication", () => {
  runInAction(() => {
    rootStore.userStore.user = undefined;
  });
  workflowsStore.hydrate();
  expect(workflowsStore.hydrationState.status).toBe("failed");
});

test("hydration creates a persistent observer for user data", () => {
  vi.spyOn(workflowsStore, "keepUserObserved").mockImplementation(noop);
  workflowsStore.hydrate();
  expect(workflowsStore.keepUserObserved).toHaveBeenCalled();
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
  expect(workflowsStore.hydrationState.status).toBe("needs hydration");

  workflowsStore.hydrate();

  runInAction(() => {
    workflowsStore.userSubscription.hydrationState = { status: "hydrated" };
  });
  expect(workflowsStore.hydrationState.status).toBe("needs hydration");

  runInAction(() => {
    workflowsStore.userSubscription.data = [mockOfficer.info];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = {
      status: "hydrated",
    };
  });
  expect(workflowsStore.hydrationState.status).toBe("loading");

  runInAction(() => {
    workflowsStore.opportunityConfigurationStore.mockHydrated();
  });

  expect(workflowsStore.hydrationState.status).toBe("hydrated");
});

describe("hydrationState", () => {
  const statuses = {
    needsHydration: { status: "needs hydration" },
    loading: { status: "loading" },
    failed: { status: "failed", error: new Error("test") },
    hydrated: { status: "hydrated" },
  } satisfies Record<string, HydrationState>;

  beforeEach(() => {
    workflowsStore.hydrate();
  });

  test.each([
    [statuses.needsHydration, statuses.needsHydration],
    [statuses.needsHydration, statuses.loading],
    [statuses.needsHydration, statuses.hydrated],
  ])(
    "needs hydration (subs hydration %s + %s)",
    (hydrationStateA, hydrationStateB) => {
      workflowsStore.userSubscription.hydrationState = hydrationStateA;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateB;
      expect(workflowsStore.hydrationState).toEqual({
        status: "needs hydration",
      });

      workflowsStore.userSubscription.hydrationState = hydrationStateB;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateA;
      expect(workflowsStore.hydrationState).toEqual({
        status: "needs hydration",
      });
    },
  );

  test.each([
    [statuses.loading, statuses.loading],
    [statuses.loading, statuses.hydrated],
  ])("loading (subs hydration %s + %s)", (hydrationStateA, hydrationStateB) => {
    workflowsStore.userSubscription.hydrationState = hydrationStateA;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateB;
    expect(workflowsStore.hydrationState).toEqual({ status: "loading" });

    workflowsStore.userSubscription.hydrationState = hydrationStateB;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateA;
    expect(workflowsStore.hydrationState).toEqual({ status: "loading" });
  });

  test.each([
    [statuses.failed, statuses.failed],
    [statuses.failed, statuses.loading],
    [statuses.failed, statuses.hydrated],
    [statuses.failed, statuses.needsHydration],
  ])("failed (subs hydration %s + %s)", (hydrationStateA, hydrationStateB) => {
    workflowsStore.userSubscription.hydrationState = hydrationStateA;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateB;
    expect(workflowsStore.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });

    workflowsStore.userSubscription.hydrationState = hydrationStateB;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = hydrationStateA;
    expect(workflowsStore.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });
  });

  test("hydrated", () => {
    workflowsStore.userSubscription.hydrationState = statuses.hydrated;
    workflowsStore.userSubscription.data = [mockOfficer.info];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.userUpdatesSubscription!.hydrationState = statuses.hydrated;
    workflowsStore.opportunityConfigurationStore.mockHydrated();
    expect(workflowsStore.hydrationState).toEqual({ status: "hydrated" });
  });

  describe("before userUpdatesSubscription is created", () => {
    test.each([
      [statuses.loading],
      [statuses.hydrated],
      [statuses.needsHydration],
    ])("needs hydration with user sub = %s", (userSubStatus) => {
      workflowsStore.userSubscription.hydrationState = userSubStatus;
      expect(workflowsStore.hydrationState).toEqual({
        status: "needs hydration",
      });
    });

    test("failed with user sub = failed", () => {
      workflowsStore.userSubscription.hydrationState = statuses.failed;
      expect(workflowsStore.hydrationState.status).toEqual("failed");
    });
  });
});

describe("user", () => {
  test("user data waits for hydration to be complete", () => {
    mockAuthedUser();
    workflowsStore.hydrate();

    expect(workflowsStore.user).toBeUndefined();
  });

  test("user data reflects subscriptions", async () => {
    await waitForHydration();

    expect(workflowsStore.user?.info).toEqual(mockOfficer.info);
  });
});

const populateSupervisedStaff = () => {
  runInAction(() => {
    workflowsStore.updateActiveSystem("SUPERVISION");
    workflowsStore.supervisionStaffSubscription.data = [
      // two officers supervised by mockSupervisor, one supervised by someone else
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
        id: "XX_SUPERVISED_OFFICER2",
        stateCode: "US_XX",
        givenNames: "TestSupervisedOfficer2",
        surname: "AlphabeticallyFirst",
        supervisorExternalId: mockSupervisor.info.id,
        pseudonymizedId: "p002",
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
    ];
  });
};

test("staffSupervisedByCurrentUser provides a list of users supervised by currently logged in user", async () => {
  await waitForHydration(mockSupervisor);
  populateSupervisedStaff();

  const staffSupervisedByCurrentUser =
    workflowsStore.staffSupervisedByCurrentUser;
  const staffSupervisorExternalIds = staffSupervisedByCurrentUser.map(
    (staff) => (staff as SupervisionStaffRecord["output"]).supervisorExternalId,
  );

  expect(staffSupervisedByCurrentUser).toBeArrayOfSize(2);
  expect(staffSupervisorExternalIds[0]).toEqual(mockSupervisor.info.id);
  expect(staffSupervisorExternalIds[1]).toEqual(mockSupervisor.info.id);
});

describe("staffSubscription", () => {
  describe("activeSystem is ALL", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("ALL");
    });

    test("staffSubscription has both supervision and incarceration officers", async () => {
      await waitForHydration();
      runInAction(() => {
        workflowsStore.incarcerationStaffSubscription.data =
          mockIncarcerationOfficers;
        workflowsStore.supervisionStaffSubscription.data =
          mockSupervisionOfficers;
      });
      expect(
        workflowsStore.staffSubscription?.map((s) => s.data).flat(),
      ).toEqual([...mockSupervisionOfficers, ...mockIncarcerationOfficers]);
    });
  });

  describe("activeSystem is INCARCERATION", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("INCARCERATION");
    });

    test("staffSubscription has incarceration officers", async () => {
      await waitForHydration();
      runInAction(() => {
        workflowsStore.incarcerationStaffSubscription.data =
          mockIncarcerationOfficers;
        workflowsStore.supervisionStaffSubscription.data =
          mockSupervisionOfficers;
      });
      expect(workflowsStore.staffSubscription?.map((s) => s.data)).toEqual([
        mockIncarcerationOfficers,
      ]);
    });
  });
  describe("activeSystem is SUPERVISION", () => {
    beforeEach(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
    });

    test("staffSubscription has supervision officers", async () => {
      await waitForHydration();
      runInAction(() => {
        workflowsStore.incarcerationStaffSubscription.data =
          mockIncarcerationOfficers;
        workflowsStore.supervisionStaffSubscription.data =
          mockSupervisionOfficers;
      });
      expect(workflowsStore.staffSubscription?.map((s) => s.data)).toEqual([
        mockSupervisionOfficers,
      ]);
    });
  });
});

test("locations from subscription", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.locationsSubscription.data = mockLocations;
  });
  expect(workflowsStore.availableLocations).toEqual(mockLocations);
});

test("systemConfigFor when there is a search type behind a not-enabled feature variant", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.updateActiveSystem("INCARCERATION");
    rootStore.tenantStore.currentTenantId = "US_TN";
  });
  const expected = {
    search: [{ searchType: "LOCATION" }],
  };
  expect(workflowsStore.systemConfigFor("INCARCERATION")).toEqual(expected);
});

test("systemConfigFor when there is a search type behind an enabled feature variant", async () => {
  setUser({ TEST: {} });
  await waitForHydration();
  runInAction(() => {
    workflowsStore.updateActiveSystem("INCARCERATION");
    rootStore.tenantStore.currentTenantId = "US_TN";
  });
  const expected = {
    search: [
      {
        searchType: "OFFICER",
        searchTitle: "case manager",
        restrictedToFeatureVariant: "TEST",
      },
      { searchType: "LOCATION" },
    ],
  };
  expect(workflowsStore.systemConfigFor("INCARCERATION")).toEqual(expected);
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
      workflowsStore.justiceInvolvedPersons[pseudonymizedId].pseudonymizedId,
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
          workflowsStore.justiceInvolvedPersons[pseudonymizedId]
            .pseudonymizedId,
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
          workflowsStore.justiceInvolvedPersons[pseudonymizedId]
            .pseudonymizedId,
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
          workflowsStore.justiceInvolvedPersons[pseudonymizedId]
            .pseudonymizedId,
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
    rootStore.tenantStore.currentTenantId = "US_XX" as any;
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
    computed(() => workflowsStore.eligibleOpportunities.compliantReporting),
  );

  expect(workflowsStore.selectedClient).toBeUndefined();
});

test("select existing client", async () => {
  populateClients(mockClients);

  const idToSelect = mockIneligibleClient.pseudonymizedId;

  await workflowsStore.updateSelectedPerson(idToSelect);

  // simulate a UI displaying client data
  testObserver = keepAlive(computed(() => workflowsStore.selectedClient));

  expect(workflowsStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

test("select unfetched client", async () => {
  await waitForHydration();

  const idToSelect = "unknownId";

  vi.spyOn(FirestoreStore.prototype, "getClient").mockResolvedValue({
    ...mockIneligibleClient,
    pseudonymizedId: idToSelect,
  });

  await workflowsStore.updateSelectedPerson(idToSelect);

  await when(() => workflowsStore.selectedClient !== undefined);

  expect(rootStore.firestoreStore.getClient).toHaveBeenCalledWith(
    idToSelect,
    mockIneligibleClient.stateCode,
  );
  expect(workflowsStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

describe("opportunitiesLoaded", () => {
  test("opportunitiesLoaded is true when clients are loaded and there are no clients", async () => {
    // officer2 has no clients
    await waitForHydration(mockOfficer2);
    populateClients([]);
    workflowsStore.opportunityConfigurationStore.mockHydrated();
    expect(workflowsStore.opportunitiesLoaded()).toBeTrue();
  });

  test("opportunitiesLoaded is false when clients are loading and we have not subscribed to clients", async () => {
    await waitForHydration(mockSupervisor);
    workflowsStore.opportunityConfigurationStore.mockHydrated();
    expect(workflowsStore.opportunitiesLoaded()).toBeFalse();
  });

  test("opportunitiesLoaded is false when clients are loading", async () => {
    await waitForHydration();
    populateClients(mockClients);
    workflowsStore.opportunityConfigurationStore.mockHydrated();
    expect(workflowsStore.opportunitiesLoaded()).toBeFalse();
  });

  test("opportunitiesLoaded is false when not all provided opportunities are hydrated", async () => {
    const compliantReportingHydrationStateMock = vi.spyOn(
      CompliantReportingOpportunity.prototype,
      "hydrationState",
      "get",
    );
    const lsuHydrationStateMock = vi.spyOn(
      LSUOpportunity.prototype,
      "hydrationState",
      "get",
    );
    await waitForHydration();
    populateClients(mockClients);
    workflowsStore.opportunityConfigurationStore.mockHydrated();

    compliantReportingHydrationStateMock.mockReturnValue({
      status: "hydrated",
    });
    lsuHydrationStateMock.mockReturnValue({ status: "loading" });
    expect(workflowsStore.opportunitiesLoaded()).toBeFalse();
  });

  test("opportunitiesLoaded is true when opportunity manager is hydrated", async () => {
    const hydrationStateMock = vi.spyOn(
      OpportunityManager.prototype,
      "hydrationState",
      "get",
    );
    await waitForHydration();
    populateClients(mockClients);
    workflowsStore.opportunityConfigurationStore.mockHydrated();

    hydrationStateMock.mockReturnValue({ status: "hydrated" });
    expect(workflowsStore.opportunitiesLoaded()).toBeTrue();
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
    populateClients([mockIneligibleClient]);
    expect(workflowsStore.hasOpportunities(["compliantReporting"])).toBeFalse();
  });

  test("hasOpportunities is false if no client has opportunities for those types", async () => {
    const hydrationStateMock = vi.spyOn(
      CompliantReportingOpportunity.prototype,
      "hydrationState",
      "get",
    );
    await waitForHydration();
    populateClients(mockClients);
    hydrationStateMock.mockReturnValue({ status: "hydrated" });
    expect(workflowsStore.hasOpportunities(["earlyTermination"])).toBeFalse();
  });

  test("hasOpportunities is true if any client has opportunities for any of the provided types", async () => {
    vi.spyOn(
      OpportunityManager.prototype,
      "hydrationState",
      "get",
    ).mockReturnValue({ status: "hydrated" });

    vi.spyOn(
      OpportunityManager.prototype,
      "opportunities",
      "get",
    ).mockReturnValueOnce({
      earlyTermination: {
        hydrationState: { status: "hydrated" },
      },
      compliantReporting: {
        hydrationState: { status: "hydrated" },
      },
    } as any as OpportunityMapping);

    setOpportunities({
      compliantReporting: mockBaseOpportunityConfig,
      earlyTermination: mockBaseOpportunityConfig,
    });

    await waitForHydration();
    populateClients(mockClients);

    expect(
      workflowsStore.hasOpportunities([
        "earlyTermination",
        "compliantReporting",
      ]),
    ).toBeTrue();
  });
});

describe("isSupervisionTasksLinkEnabled", () => {
  test("when tasks allowed, route exists, and homepage is not tasks", async () => {
    vi.spyOn(
      rootStore.tenantStore,
      "currentTenantConfig",
      "get",
    ).mockReturnValue({
      workflowsHomepage: "home",
    } as unknown as TenantConfig<"US_ME">);
    setUser({}, "US_ME", {
      tasks: true,
    });
    runInAction(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
      rootStore.tenantStore.currentTenantId = "US_ME";
    });
    await waitForHydration();
    expect(workflowsStore.isSupervisionTasksLinkEnabled).toBeTrue();
  });

  test("when task config is missing", async () => {
    vi.spyOn(
      rootStore.tenantStore,
      "currentTenantConfig",
      "get",
    ).mockReturnValue({
      workflowsHomepage: "home",
    } as unknown as TenantConfig<"US_ME">);
    setUser({}, "US_MO", {
      tasks: true,
    });
    runInAction(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
      rootStore.tenantStore.currentTenantId = "US_MO";
    });
    await waitForHydration();
    expect(workflowsStore.isSupervisionTasksLinkEnabled).toBeFalse();
  });

  test("when route permission is missing", async () => {
    vi.spyOn(
      rootStore.tenantStore,
      "currentTenantConfig",
      "get",
    ).mockReturnValue({
      workflowsHomepage: "home",
    } as unknown as TenantConfig<"US_ME">);
    setUser({}, "US_ME", {
      tasks: false,
    });
    runInAction(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
      rootStore.tenantStore.currentTenantId = "US_ME";
    });
    await waitForHydration();
    expect(workflowsStore.isSupervisionTasksLinkEnabled).toBeFalse();
  });

  test("when homepage is /tasks", async () => {
    vi.spyOn(
      rootStore.tenantStore,
      "currentTenantConfig",
      "get",
    ).mockReturnValue({
      workflowsHomepage: "tasks",
    } as unknown as TenantConfig<"US_ME">);
    setUser({}, "US_ME", {
      tasks: true,
    });
    runInAction(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
      rootStore.tenantStore.currentTenantId = "US_TX";
    });
    await waitForHydration();
    expect(workflowsStore.isSupervisionTasksLinkEnabled).toBeFalse();
  });
});

const setUser = (
  featureVariants: any,
  stateCode = "US_BB",
  routes: Record<string, boolean> = {
    workflowsSupervision: true,
    workflowsFacilities: true,
  },
) => {
  rootStore.userStore.user = {
    email: "foo@example.com",
    [`${import.meta.env.VITE_METADATA_NAMESPACE}app_metadata`]: {
      stateCode,
      featureVariants,
      routes,
    },
  };
  rootStore.userStore.isAuthorized = true;
  rootStore.userStore.userIsLoading = false;
  rootStore.tenantStore.setCurrentTenantId(stateCode as any);
};

const mockBaseOpportunityConfig: Partial<IApiOpportunityConfiguration> = {
  stateCode: "US_XX" as TenantId,
  systemType: "SUPERVISION",
};

const setOpportunities = (
  opportunities: Partial<
    Record<OpportunityType, Partial<IApiOpportunityConfiguration>>
  >,
  featureVariants?: any,
) => {
  vi.spyOn(
    workflowsStore.opportunityConfigurationStore,
    "opportunities",
    "get",
  ).mockReturnValue(
    mapValues(
      opportunities,
      (config) =>
        new ApiOpportunityConfiguration(
          config as IApiOpportunityConfiguration,
          {
            activeFeatureVariants: featureVariants ?? {},
          } as UserStore,
        ),
    ) as Record<OpportunityType, OpportunityConfiguration>,
  );
};

describe("Additional workflowsSupportedSystems testing", () => {
  const SESSION_STATE_CODE = "US_BB" as any;
  const TEST_GATED_SYSTEM = "INCARCERATION";
  const SESSION_SUPPORTED_SYSTEMS =
    stateConfigs[SESSION_STATE_CODE as testStateCode].workflowsSupportedSystems;
  const SESSION_SYSTEMS_WITH_GATES = Object.keys(
    (stateConfigs[SESSION_STATE_CODE as testStateCode]
      .workflowsSystemsGatedByFeatureVariant as Record<any, any[]>) || {},
  );
  const SESSION_SYSTEMS_WITHOUT_GATES = difference(
    SESSION_SUPPORTED_SYSTEMS,
    SESSION_SYSTEMS_WITH_GATES,
  );

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
      ]),
    );
  });

  test("includes the supported systems when having only one featureVariant from the approved list", () => {
    setUser({ usIdCRC: {} });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(
      expect.arrayContaining([
        TEST_GATED_SYSTEM,
        ...SESSION_SYSTEMS_WITHOUT_GATES,
      ]),
    );
  });

  test("systems are gated by routes", () => {
    setUser({}, "US_ME", {
      workflowsSupervision: true,
      workflowsFacilities: true,
    });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(
      expect.arrayContaining(["SUPERVISION", "INCARCERATION"]),
    );

    setUser({}, "US_ME", {
      workflowsSupervision: true,
      workflowsFacilities: false,
    });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(["SUPERVISION"]);

    setUser({}, "US_ME", {
      workflowsSupervision: false,
      workflowsFacilities: true,
    });
    expect(workflowsStore.workflowsSupportedSystems).toEqual(["INCARCERATION"]);

    setUser({}, "US_ME", {
      workflowsSupervision: false,
      workflowsFacilities: false,
    });
    expect(workflowsStore.workflowsSupportedSystems).toEqual([]);
  });
});

describe("test state-specific opportunity type feature variant filters", () => {
  beforeEach(() => {
    configure({ safeDescriptors: false });
    vi.useFakeTimers();
  });

  afterEach(() => {
    configure({ safeDescriptors: true });
    vi.useRealTimers();
  });
  describe("for US_XX", () => {
    const SESSION_STATE_CODE = "US_XX";
    beforeEach(async () => {
      runInAction(() => {
        workflowsStore.updateActiveSystem("SUPERVISION");
        rootStore.tenantStore.currentTenantId = SESSION_STATE_CODE as TenantId;
      });
      await waitForHydration({ ...mockOfficer });
    });

    test("US_XX oppTypes list does not include compliantReporting", async () => {
      // should be in the list when the feat var isn't on
      setOpportunities({ compliantReporting: mockBaseOpportunityConfig });

      expect(
        workflowsStore.opportunityTypes.includes("compliantReporting"),
      ).toBeTruthy();

      setOpportunities(
        {
          compliantReporting: {
            ...mockBaseOpportunityConfig,
            inverseFeatureVariant: "fakeFeatVar" as FeatureVariant,
          },
        },
        {
          fakeFeatVar: {},
        },
      );

      setUser({ fakeFeatVar: {} }, SESSION_STATE_CODE);

      // should no longer be in the list with inverse setting on now.
      expect(
        workflowsStore.opportunityTypes.includes("compliantReporting"),
      ).toBeFalsy();
    });
  });
});

describe("opportunityTypes for US_TN", () => {
  beforeEach(() => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_TN";
    });
  });

  test("includes usTnExpiration", async () => {
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${import.meta.env.VITE_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "US_TN",
          featureVariants: { usTnExpiration: {} },
        },
      };
      rootStore.userStore.userIsLoading = false;
      rootStore.userStore.isAuthorized = true;
    });
    await waitForHydration({
      ...mockOfficer,
    });
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
    expect(workflowsStore.opportunityTypes).toContain("usTnExpiration");
  });
});

describe("opportunityTypes are gated by gatedOpportunities when set", () => {
  const NON_GATED_OPPS = ["compliantReporting"];
  const TEST_GATED_OPP = "LSU" as OpportunityType;
  const TEST_FEAT_VAR = "TEST" as FeatureVariant;
  const setupHydration = () =>
    runInAction(() => {
      rootStore.userStore.user = {
        email: "foo@example.com",
        [`${import.meta.env.VITE_METADATA_NAMESPACE}app_metadata`]: {
          stateCode: "US_XX",
          featureVariants: { [TEST_FEAT_VAR]: {} },
        },
      };
      rootStore.userStore.isAuthorized = true;
      rootStore.userStore.userIsLoading = false;

      setOpportunities(
        {
          LSU: {
            ...mockBaseOpportunityConfig,
            featureVariant: TEST_FEAT_VAR,
          },
          compliantReporting: mockBaseOpportunityConfig,
        },
        { [TEST_FEAT_VAR]: {} },
      );
    });
  beforeEach(() => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_XX" as TenantId;
    });

    setOpportunities({
      LSU: {
        ...mockBaseOpportunityConfig,
        featureVariant: TEST_FEAT_VAR,
      },
      compliantReporting: mockBaseOpportunityConfig,
    });
  });

  test("undefined active system results in no opportunity types", async () => {
    vi.spyOn(workflowsStore, "activeSystem", "get").mockReturnValue(
      undefined as unknown as SystemId,
    );
    await waitForHydration({ ...mockOfficer });
    setupHydration();

    expect(workflowsStore.opportunityTypes.sort()).toEqual([]);
  });

  test("active system filter should yield only opps that are in incarceration", async () => {
    vi.spyOn(workflowsStore, "activeSystem", "get").mockReturnValue(
      "INCARCERATION",
    );
    await waitForHydration({ ...mockOfficer });

    const oppTypes = workflowsStore.opportunityTypes;
    expect(
      oppTypes.every(
        (oppType) =>
          mockOpportunityConfigs[oppType].systemType === "INCARCERATION",
      ),
    ).toBeTruthy();
  });

  test("active system filter should yield only opps that are in supervision", async () => {
    vi.spyOn(workflowsStore, "activeSystem", "get").mockReturnValue(
      "SUPERVISION",
    );
    await waitForHydration({ ...mockOfficer });

    const oppTypes = workflowsStore.opportunityTypes;
    expect(
      oppTypes.length > 0 &&
        oppTypes.every(
          (oppType) =>
            mockOpportunityConfigs[oppType].systemType === "SUPERVISION",
        ),
    ).toBeTruthy();
  });

  test("gated opportunity is not enabled when feature variant is not set for current user", async () => {
    await waitForHydration({ ...mockOfficer });
    expect(workflowsStore.opportunityTypes.sort()).toEqual(NON_GATED_OPPS);
  });

  test("gated opportunity is enabled when feature variant is set for current user", async () => {
    setupHydration();
    await waitForHydration({ ...mockOfficer });

    expect(workflowsStore.opportunityTypes.sort()).toEqual([
      TEST_GATED_OPP,
      ...NON_GATED_OPPS,
    ]);
  });
});

describe("getMilestonesClientsByStatus", () => {
  const messageStatuses: Partial<TextMessageStatus>[] = [
    "IN_PROGRESS",
    "SUCCESS",
    "FAILURE",
    "DECLINED",
  ];

  beforeEach(async () => {
    const milestonesClient: ClientRecord = {
      ...mockIneligibleClient,
      milestones: [
        {
          text: "Birthday this month (February 29)",
          type: "BIRTHDAY_THIS_MONTH",
        },
        {
          text: "6 months violation-free",
          type: "NO_VIOLATION_WITHIN_6_MONTHS",
        },
      ],
    };

    // Populate clients, one for each status and one more to have no message
    const milestonesClients: ClientRecord[] = [];
    for (let i = 0; i < messageStatuses.length + 1; i++) {
      milestonesClients.push({ ...milestonesClient, pseudonymizedId: `p${i}` });
    }
    populateClients(milestonesClients);

    await waitForHydration();
    runInAction(() => {
      // The first client will have no message sent
      workflowsStore.milestonesClients[0].milestonesMessageUpdatesSubscription =
        undefined;
      // Each of the rest will have a different message status
      messageStatuses.forEach((status, index) => {
        workflowsStore.milestonesClients[
          index + 1
        ].milestonesMessageUpdatesSubscription = {
          data: {
            status,
          } as MilestonesMessage,
        } as MilestonesMessageUpdateSubscription<MilestonesMessage>;
      });
    });
  });

  test("Clients who have not had a message sent yet", () => {
    const newMilestonesClients = workflowsStore.getMilestonesClientsByStatus();
    expect(newMilestonesClients.length).toEqual(1);
    expect(
      newMilestonesClients[0].milestoneMessagesUpdates?.status,
    ).toBeUndefined();
  });

  test("Clients of every message send status", () => {
    messageStatuses.forEach((status) => {
      const milestonesClientsWithStatus =
        workflowsStore.getMilestonesClientsByStatus([status]);
      expect(milestonesClientsWithStatus).toBeArrayOfSize(1);
      expect(
        milestonesClientsWithStatus[0].milestoneMessagesUpdates?.status,
      ).toEqual(status);
    });
  });
});

describe("user data observer", () => {
  // for lack of a better test mechanism, we are verifying the behavior of a private property here.
  // It's still better for the property to stay private because it should not be
  // accessed directly outside of WorkflowsStore in a real application context.

  test("starts observing", () => {
    // @ts-expect-error
    expect(workflowsStore.userKeepAliveDisposer).toBeUndefined();

    workflowsStore.keepUserObserved();

    // @ts-expect-error
    expect(workflowsStore.userKeepAliveDisposer).toBeDefined();
  });

  test("stops observing", async () => {
    workflowsStore.keepUserObserved();

    // @ts-expect-error
    const spy = vi.spyOn(workflowsStore, "userKeepAliveDisposer");

    workflowsStore.stopKeepingUserObserved();

    expect(spy).toHaveBeenCalled();
  });

  test("resets observer state", () => {
    workflowsStore.keepUserObserved();
    workflowsStore.stopKeepingUserObserved();

    // @ts-expect-error
    expect(workflowsStore.userKeepAliveDisposer).toBeUndefined();
  });
});
