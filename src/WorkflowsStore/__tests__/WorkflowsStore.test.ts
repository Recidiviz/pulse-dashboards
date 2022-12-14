// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { add } from "date-fns";
import { computed, configure, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import { trackCaseloadSearch } from "../../analytics";
import {
  ClientRecord,
  CombinedUserRecord,
  getClient,
  ResidentRecord,
  UserUpdateRecord,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import type { WorkflowsStore } from "..";
import {
  ineligibleClient,
  mockClients,
  mockOfficer,
  mockOfficer2,
  mockOfficers,
  mockSupervisor,
} from "../__fixtures__";
import { Client } from "../Client";
import {
  CompliantReportingOpportunity,
  EarlyTerminationOpportunity,
  LSUOpportunity,
} from "../Opportunity";
import { Resident } from "../Resident";
import { dateToTimestamp } from "../utils";

jest.mock("../../analytics");
jest.mock("../../firestore");
jest.mock("../subscriptions");
jest.mock("../../tenants", () => ({
  __esModule: true,
  default: {
    US_XX: {
      opportunityTypes: ["compliantReporting", "LSU"],
      workflowsSupportedSystems: ["SUPERVISION"],
    },
    US_YY: {
      workflowsEnableAllDistricts: true,
      workflowsSupportedSystems: ["SUPERVISION"],
    },
    US_TN: {
      opportunityTypes: ["compliantReporting", "supervisionLevelDowngrade"],
      workflowsSupportedSystems: ["SUPERVISION"],
    },
    US_ME: {
      opportunityTypes: [],
      workflowsSupportedSystems: ["INCARCERATION"],
    },
  },
}));

const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;

let rootStore: RootStore;
let workflowsStore: WorkflowsStore;
let testObserver: IDisposer;

function mockAuthedUser() {
  // mock successful authentication from Auth0
  runInAction(() => {
    rootStore.userStore.user = {
      email: mockOfficer.info.email,
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        state_code: mockOfficer.info.stateCode,
      },
    };
    rootStore.tenantStore.setCurrentTenantId(mockOfficer.info.stateCode as any);
  });
}

async function waitForHydration({
  info,
  updates,
  featureVariants,
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
    workflowsStore.featureVariantsSubscription!.data = featureVariants;
    workflowsStore.featureVariantsSubscription!.isHydrated = true;
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

beforeEach(() => {
  jest.resetAllMocks();
  // this lets us spy on observables, e.g. the tenant ID getter
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  workflowsStore = rootStore.workflowsStore;
  mockAuthedUser();
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
  expect(workflowsStore.featureVariantsSubscription).toBeUndefined();

  workflowsStore.hydrate();

  expect(workflowsStore.userUpdatesSubscription).toBeDefined();
  expect(workflowsStore.featureVariantsSubscription).toBeDefined();
});

test("hydration triggers subscriptions", () => {
  workflowsStore.hydrate();

  expect(workflowsStore.userSubscription.hydrate).toHaveBeenCalled();
  expect(workflowsStore.userUpdatesSubscription?.hydrate).toHaveBeenCalled();
  expect(
    workflowsStore.featureVariantsSubscription?.hydrate
  ).toHaveBeenCalled();
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    workflowsStore.featureVariantsSubscription!.isHydrated = true;
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      workflowsStore.featureVariantsSubscription!.isLoading = statusC;
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

  expect(workflowsStore.selectedOfficerIds).toEqual([mockOfficer.info.id]);
  expect(trackCaseloadSearch).toHaveBeenCalledWith({
    officerCount: 1,
    isDefault: true,
  });
});

test("caseload defaults to no officers if user has no caseload and no saved officers", async () => {
  await waitForHydration(mockSupervisor);

  expect(workflowsStore.selectedOfficerIds).toEqual([]);
});

test("caseload defaults to stored value", async () => {
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

  await waitForHydration({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedOfficerIds: mockStoredOfficers,
    },
  });

  expect(workflowsStore.selectedOfficerIds).toEqual(mockStoredOfficers);
});

test("default caseload does not override empty stored value", async () => {
  await waitForHydration({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedOfficerIds: [],
    },
  });
  expect(workflowsStore.selectedOfficerIds).toEqual([]);
});

test("caseload syncs with stored value changes", async () => {
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];

  await waitForHydration();

  runInAction(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rootStore.workflowsStore.userUpdatesSubscription!.data = {
      stateCode: mockOfficer.info.stateCode,
      selectedOfficerIds: mockStoredOfficers,
    };
  });

  expect(workflowsStore.selectedOfficerIds).toEqual(mockStoredOfficers);
});

test("receive feature variants at startup", async () => {
  await waitForHydration({
    ...mockOfficer,
    featureVariants: { TEST: {} },
  });

  expect(workflowsStore.featureVariants).toEqual({
    TEST: {},
  });
});

test("feature variants inactive by default", async () => {
  await waitForHydration({
    ...mockOfficer,
    featureVariants: undefined,
  });

  expect(workflowsStore.featureVariants).toEqual({});
});

test("feature variants active by default for Recidiviz users", async () => {
  runInAction(() => {
    rootStore.userStore.user = {
      email: "foo@example.com",
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        state_code: "RECIDIVIZ",
      },
    };
  });

  await waitForHydration({
    ...mockOfficer,
    featureVariants: undefined,
  });

  expect(workflowsStore.featureVariants).toMatchInlineSnapshot(`
    Object {
      "CompliantReportingAlmostEligible": Object {},
      "TEST": Object {},
      "usIdEarnedDischargeForm": Object {},
      "usTnExpiration": Object {},
      "usTnSupervisionLevelDowngrade": Object {},
    }
  `);
});

test("officers from subscription", async () => {
  await waitForHydration();
  runInAction(() => {
    workflowsStore.officersSubscription.data = mockOfficers;
  });
  expect(workflowsStore.availableOfficers).toEqual(mockOfficers);
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

test("caseloadDistrict reflects user data", async () => {
  await waitForHydration();
  expect(workflowsStore.caseloadDistrict).toBe(mockOfficer.info.district);
});

test("workflowsEnableAllDistricts overrides caseloadDistrict", async () => {
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = "US_YY" as any;
  });

  await waitForHydration();

  expect(workflowsStore.caseloadDistrict).toBeUndefined();
});

test("no client selected", async () => {
  await waitForHydration();

  runInAction(() => {
    (workflowsStore.user as any).updates = { selectedOfficerIds: ["OFFICER1"] };
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
  mockGetClient.mockResolvedValue({
    ...ineligibleClient,
    pseudonymizedId: idToSelect,
  });

  await workflowsStore.updateSelectedPerson(idToSelect);

  await when(() => workflowsStore.selectedClient !== undefined);

  expect(mockGetClient).toHaveBeenCalledWith(
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
      .spyOn(EarlyTerminationOpportunity.prototype, "isHydrated", "get")
      .mockReturnValue(true);
    jest
      .spyOn(EarlyTerminationOpportunity.prototype, "isLoading", "get")
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

test("variant with no active date", async () => {
  await waitForHydration({
    ...mockOfficer,
    featureVariants: { TEST: { variant: "a" } },
  });

  expect(workflowsStore.featureVariants).toEqual({
    TEST: { variant: "a" },
  });
});

test("variant with past active date", async () => {
  await waitForHydration({
    ...mockOfficer,
    featureVariants: {
      TEST: {
        activeDate: dateToTimestamp(
          add(new Date(), { seconds: -1 }).toISOString()
        ),
      },
    },
  });

  expect(workflowsStore.featureVariants).toEqual({
    TEST: {},
  });
});

test("variant with future active date", async () => {
  await waitForHydration({
    ...mockOfficer,
    featureVariants: {
      TEST: {
        activeDate: dateToTimestamp(
          add(new Date(), { seconds: 1 }).toISOString()
        ),
      },
    },
  });

  expect(workflowsStore.featureVariants).toEqual({});
});

describe("opportunityTypes for US_TN", () => {
  beforeEach(() => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_TN";
    });
  });

  test("includes supervisionLevelDowngrade", async () => {
    await waitForHydration({
      ...mockOfficer,
      featureVariants: { usTnSupervisionLevelDowngrade: {} },
    });

    expect(workflowsStore.opportunityTypes).toContain(
      "supervisionLevelDowngrade"
    );
  });

  test("does not include supervisionLevelDowngrade", async () => {
    await waitForHydration({
      ...mockOfficer,
      featureVariants: {},
    });

    expect(workflowsStore.opportunityTypes).not.toContain(
      "supervisionLevelDowngrade"
    );
  });
});

describe("residents for US_ME", () => {
  test("populate residents", async () => {
    const mockResidents: ResidentRecord[] = [
      {
        allEligibleOpportunities: [],
        officerId: "TEST1",
        personExternalId: "res1",
        personName: {},
        personType: "RESIDENT",
        pseudonymizedId: "pres1",
        recordId: "abc123",
        stateCode: "US_ME",
      },
    ];

    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_ME";
    });

    await waitForHydration();

    runInAction(() => {
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
