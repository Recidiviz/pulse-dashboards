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

import {
  ClientRecord,
  getClient,
  getUser,
  subscribeToFeatureVariants,
  subscribeToUserUpdates,
  UserUpdateRecord,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import type { WorkflowsStore } from "..";
import {
  eligibleClient,
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
import { dateToTimestamp } from "../utils";

jest.mock("../../firestore");
jest.mock("../subscriptions");
jest.mock("../../tenants", () => ({
  __esModule: true,
  default: {
    US_XX: {
      opportunityTypes: ["compliantReporting", "LSU"],
    },
    US_YY: {
      workflowsEnableAllDistricts: true,
    },
    US_TN: {
      opportunityTypes: ["compliantReporting", "supervisionLevelDowngrade"],
    },
  },
}));

const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockSubscribeToUserUpdates = subscribeToUserUpdates as jest.MockedFunction<
  typeof subscribeToUserUpdates
>;
const mockSubscribeToFeatureVariants = subscribeToFeatureVariants as jest.MockedFunction<
  typeof subscribeToFeatureVariants
>;

let rootStore: RootStore;
let workflowsStore: WorkflowsStore;
let testObserver: IDisposer;

const mockUnsub = jest.fn();

function doBackendMock() {
  mockGetUser.mockResolvedValue(mockOfficer);
}

async function waitForHydration(): Promise<void> {
  workflowsStore.hydrate();

  await when(() => !workflowsStore.isLoading);
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
  runInAction(() => {
    rootStore.userStore.user = {
      email: "foo@example.com",
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        state_code: mockOfficer.info.stateCode,
      },
    };
    // @ts-ignore
    rootStore.tenantStore.currentTenantId = mockOfficer.info.stateCode;
  });
  doBackendMock();
});

afterEach(() => {
  configure({ safeDescriptors: true });
  window.localStorage.clear();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("hydration progress", async () => {
  expect(workflowsStore.error).toBeUndefined();
  expect(workflowsStore.isLoading).toBeUndefined();

  await waitForHydration();

  expect(workflowsStore.user).toBeDefined();
});

test("caseload defaults to self", async () => {
  await waitForHydration();

  expect(workflowsStore.selectedOfficerIds).toEqual([mockOfficer.info.id]);
});

test("caseload defaults to all saved officers when present", async () => {
  const mockSavedOfficers = ["OFFICER1", "OFFICER2", "OFFICER3"];
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedOfficerIds: undefined,
      savedOfficers: mockSavedOfficers,
    },
  });

  await waitForHydration();

  expect(workflowsStore.selectedOfficerIds).toEqual(mockSavedOfficers);
});

test("caseload defaults to no officers if user has no caseload and no saved officers", async () => {
  mockGetUser.mockResolvedValue(mockSupervisor);

  await waitForHydration();

  expect(workflowsStore.selectedOfficerIds).toEqual([]);
});

test("caseload defaults to stored value", async () => {
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedOfficerIds: mockStoredOfficers,
    },
  });

  await waitForHydration();

  expect(workflowsStore.selectedOfficerIds).toEqual(mockStoredOfficers);
});

test("default caseload skips empty stored value", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      selectedOfficerIds: [],
    },
  });

  await waitForHydration();
  expect(workflowsStore.selectedOfficerIds).toEqual([mockOfficer.info.id]);
});

test("caseload syncs with stored value changes", async () => {
  // simulate a database write; this will be read immediately after the default,
  // which is not 100% realistic but good enough for now
  const mockStoredOfficers = ["OFFICER1", "OFFICER3"];
  mockSubscribeToUserUpdates.mockImplementation((email, handler) => {
    handler({
      stateCode: mockOfficer.info.stateCode,
      selectedOfficerIds: mockStoredOfficers,
    });
    return mockUnsub;
  });

  await waitForHydration();

  expect(workflowsStore.selectedOfficerIds).toEqual(mockStoredOfficers);
});

test("receive feature variants at startup", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: { TEST: {} },
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({
    TEST: {},
  });
});

test("receive feature variants from subscription", async () => {
  mockSubscribeToFeatureVariants.mockImplementation((email, handler) => {
    handler({ TEST: {} });
    return mockUnsub;
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({
    TEST: {},
  });
});

test("feature variants inactive by default", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: undefined,
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({});
});

test("feature variants active by default for Recidiviz users", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: undefined,
  });

  runInAction(() => {
    rootStore.userStore.user = {
      email: "foo@example.com",
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        state_code: "RECIDIVIZ",
      },
    };
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toMatchInlineSnapshot(`
    Object {
      "CompliantReportingAlmostEligible": Object {},
      "TEST": Object {},
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
  expect(workflowsStore.clients).toEqual({
    [mockClients[0].pseudonymizedId]: expect.any(Client),
    [mockClients[1].pseudonymizedId]: expect.any(Client),
    [mockClients[2].pseudonymizedId]: expect.any(Client),
  });
  mockClients.forEach(({ pseudonymizedId }) => {
    expect(workflowsStore.clients[pseudonymizedId].pseudonymizedId).toBe(
      pseudonymizedId
    );
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

  await workflowsStore.updateSelectedClient(idToSelect);

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

  await workflowsStore.updateSelectedClient(idToSelect);

  await when(() => workflowsStore.selectedClient !== undefined);

  expect(mockGetClient).toHaveBeenCalledWith(
    idToSelect,
    ineligibleClient.stateCode
  );
  expect(workflowsStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

test("track call on client", async () => {
  populateClients(mockClients);

  const trackingSpy = jest.spyOn(Client.prototype, "trackFormViewed");

  await workflowsStore.trackClientFormViewed(
    eligibleClient.pseudonymizedId,
    "compliantReporting"
  );

  expect(trackingSpy).toHaveBeenCalledWith("compliantReporting");
});

test("tracking call waits for client to be instantiated", async () => {
  populateClients([]);
  mockGetClient.mockResolvedValue(eligibleClient);

  const trackingSpy = jest.spyOn(Client.prototype, "trackFormViewed");

  const trackingPromise = workflowsStore.trackClientFormViewed(
    eligibleClient.pseudonymizedId,
    "compliantReporting"
  );

  // triggers an additional fetch to populate the expected client
  await workflowsStore.updateSelectedClient(eligibleClient.pseudonymizedId);

  await trackingPromise;

  expect(trackingSpy).toHaveBeenCalledWith("compliantReporting");
});

describe("opportunitiesLoaded", () => {
  test("opportunitiesLoaded is true when clients are loaded and there are no clients", async () => {
    mockGetUser.mockResolvedValue(mockOfficer2); // officer2 has no clients
    await waitForHydration();
    populateClients([]);
    expect(
      workflowsStore.opportunitiesLoaded(["compliantReporting"])
    ).toBeTrue();
  });

  test("opportunitiesLoaded is false when clients are loading and we have not subscribed to clients", async () => {
    mockGetUser.mockResolvedValue(mockSupervisor);
    await waitForHydration();
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
    const isHydratedMock = jest.spyOn(
      CompliantReportingOpportunity.prototype,
      "isHydrated",
      "get"
    );
    populateClients(mockClients);
    await waitForHydration();

    isHydratedMock.mockReturnValue(true);
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
    const compliantReportingIsHydratedMock = jest.spyOn(
      CompliantReportingOpportunity.prototype,
      "isHydrated",
      "get"
    );
    const earlyTerminationIsHydratedMock = jest.spyOn(
      EarlyTerminationOpportunity.prototype,
      "isHydrated",
      "get"
    );
    await waitForHydration();
    populateClients(mockClients);
    compliantReportingIsHydratedMock.mockReturnValue(true);
    earlyTerminationIsHydratedMock.mockReturnValue(true);
    expect(
      workflowsStore.hasOpportunities([
        "earlyTermination",
        "compliantReporting",
      ])
    ).toBeTrue();
  });
});

test("variant with no active date", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: { TEST: { variant: "a" } },
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({
    TEST: { variant: "a" },
  });
});

test("variant with past active date", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: {
      TEST: {
        activeDate: dateToTimestamp(
          add(new Date(), { seconds: -1 }).toISOString()
        ),
      },
    },
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({
    TEST: {},
  });
});

test("variant with future active date", async () => {
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    featureVariants: {
      TEST: {
        activeDate: dateToTimestamp(
          add(new Date(), { seconds: 1 }).toISOString()
        ),
      },
    },
  });

  await waitForHydration();

  expect(workflowsStore.featureVariants).toEqual({});
});

describe("opportunityTypes for US_TN", () => {
  beforeEach(() => {
    runInAction(() => {
      rootStore.tenantStore.currentTenantId = "US_TN";
    });
  });

  test("includes supervisionLevelDowngrade", async () => {
    mockSubscribeToFeatureVariants.mockImplementation((email, handler) => {
      handler({ usTnSupervisionLevelDowngrade: {} });
      return mockUnsub;
    });

    await waitForHydration();

    expect(workflowsStore.opportunityTypes).toContain(
      "supervisionLevelDowngrade"
    );
  });

  test("does not include supervisionLevelDowngrade", async () => {
    mockSubscribeToFeatureVariants.mockImplementation((email, handler) => {
      handler({});
      return mockUnsub;
    });

    await waitForHydration();

    expect(workflowsStore.opportunityTypes).not.toContain(
      "supervisionLevelDowngrade"
    );
  });
});
