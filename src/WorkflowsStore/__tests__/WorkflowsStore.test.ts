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
import { keyBy } from "lodash";
import { computed, configure, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  ClientRecord,
  getClient,
  getUser,
  subscribeToCaseloads,
  subscribeToEligibleCount,
  subscribeToFeatureVariants,
  subscribeToOfficers,
  subscribeToUserUpdates,
  UserUpdateRecord,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import { US_ND } from "../../RootStore/TenantStore/pathwaysTenants";
import type { WorkflowsStore } from "..";
import {
  eligibleClient,
  ineligibleClient,
  mockClients,
  mockDirector,
  mockOfficer,
  mockOfficers,
  mockSupervisor,
} from "../__fixtures__";
import { Client } from "../Client";
import { dateToTimestamp } from "../utils";

jest.mock("../../firestore");
jest.mock("../subscriptions");

const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockSubscribeToEligibleCount = subscribeToEligibleCount as jest.MockedFunction<
  typeof subscribeToEligibleCount
>;
const mockSubscribeToOfficers = subscribeToOfficers as jest.MockedFunction<
  typeof subscribeToOfficers
>;
const mockSubscribeToCaseloads = subscribeToCaseloads as jest.MockedFunction<
  typeof subscribeToCaseloads
>;
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
  mockSubscribeToEligibleCount.mockImplementation(
    (opportunityType, stateCode, ids, handler) => {
      handler(1);
      return mockUnsub;
    }
  );
  mockSubscribeToCaseloads.mockImplementation(
    (stateCode, officerIds, handler) => {
      expect(stateCode).toBe(mockOfficer.info.stateCode);
      handler(mockClients);
      return mockUnsub;
    }
  );
}

async function waitForHydration(): Promise<void> {
  workflowsStore.hydrate();

  await when(() => !workflowsStore.isLoading);
}

function populateClients(clients: ClientRecord[]): void {
  runInAction(() => {
    workflowsStore.clients = keyBy(
      clients.map((r) => new Client(r, rootStore)),
      "pseudonymizedId"
    );
  });
}

beforeEach(() => {
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
  jest.resetAllMocks();
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

test("subscribe to officers in user's district", async () => {
  mockSubscribeToOfficers.mockImplementation(
    (stateCode, district, handleResults) => {
      expect(stateCode).toBe(mockOfficer.info.stateCode);
      expect(district).toBe(mockOfficer.info.district);
      handleResults(mockOfficers);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying officer list
  testObserver = keepAlive(computed(() => workflowsStore.availableOfficers));

  await when(() => workflowsStore.availableOfficers.length > 0);

  expect(mockSubscribeToOfficers).toHaveBeenCalled();

  expect(workflowsStore.availableOfficers).toEqual(mockOfficers);
});

test("subscribe to all officers if user has no district", async () => {
  mockGetUser.mockResolvedValue(mockDirector);
  mockSubscribeToOfficers.mockImplementation(
    (stateCode, district, handleResults) => {
      expect(stateCode).toBe(mockDirector.info.stateCode);
      expect(district).toBeUndefined();
      handleResults(mockOfficers);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying officer list
  testObserver = keepAlive(computed(() => workflowsStore.availableOfficers));

  await when(() => workflowsStore.availableOfficers.length > 0);

  expect(mockSubscribeToOfficers).toHaveBeenCalled();

  expect(workflowsStore.availableOfficers).toEqual(mockOfficers);
});

test("subscribe to all clients in default caseload", async () => {
  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(computed(() => workflowsStore.caseloadClients));

  expect(mockSubscribeToCaseloads).toHaveBeenCalled();
});

test("subscribe to all clients in saved caseload", async () => {
  const mockSavedOfficers = ["OFFICER1", "OFFICER2", "OFFICER3"];
  mockGetUser.mockResolvedValue({
    ...mockSupervisor,
    updates: {
      ...(mockSupervisor.updates as UserUpdateRecord),
      savedOfficers: mockSavedOfficers,
    },
  });

  mockSubscribeToCaseloads.mockImplementation(
    (stateCode, officerIds, handler) => {
      expect(stateCode).toBe(mockOfficer.info.stateCode);
      expect(officerIds).toEqual(mockSavedOfficers);
      handler([]);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(
    computed(() => workflowsStore.eligibleOpportunities.compliantReporting)
  );

  expect(mockSubscribeToCaseloads).toHaveBeenCalled();
});

test("subscribe to all officers if workflowsEnableAllDistricts is true", async () => {
  runInAction(() => {
    // @ts-ignore
    rootStore.tenantStore.currentTenantId = US_ND;
  });

  mockSubscribeToOfficers.mockImplementation(
    (stateCode, district, handleResults) => {
      expect(district).toBeUndefined();
      handleResults(mockOfficers);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying officer list
  testObserver = keepAlive(computed(() => workflowsStore.availableOfficers));
  await when(() => workflowsStore.availableOfficers.length > 0);
});

test("subscribe to district only officers if workflowsEnableAllDistricts is false", async () => {
  runInAction(() => {
    // @ts-ignore
    rootStore.tenantStore.currentTenantId = "US_TN";
  });

  mockSubscribeToOfficers.mockImplementation(
    (stateCode, district, handleResults) => {
      expect(district).toEqual("DISTRICT 1");
      handleResults(mockOfficers);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying officer list
  testObserver = keepAlive(computed(() => workflowsStore.availableOfficers));
  await when(() => workflowsStore.availableOfficers.length > 0);
});

test("don't subscribe to clients if no officers are selected", async () => {
  mockGetUser.mockResolvedValue(mockSupervisor);

  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(
    computed(() => workflowsStore.eligibleOpportunities.compliantReporting)
  );

  expect(mockSubscribeToCaseloads).not.toHaveBeenCalled();
});

test("clean up caseload subscriptions on change", async () => {
  await waitForHydration();

  // simulate a component consuming this value, because it will automatically unsubscribe
  // when no longer observed; we are testing the use case of the underlying filter changing
  // while the computed value is continuously observed
  testObserver = keepAlive(computed(() => workflowsStore.caseloadClients));

  await when(() => workflowsStore.caseloadClients !== undefined);

  expect(mockUnsub).not.toHaveBeenCalled();

  runInAction(() => {
    (workflowsStore.user as any).updates = {
      selectedOfficerIds: ["OFFICER2"],
    };
  });

  await when(() => workflowsStore.caseloadClients !== undefined);

  expect(mockUnsub).toHaveBeenCalled();
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

test("select existing client", () => {
  populateClients(mockClients);

  const idToSelect = ineligibleClient.pseudonymizedId;

  runInAction(() => {
    workflowsStore.updateSelectedClient(idToSelect);
  });

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

test("allOpportunitiesLoaded", async () => {
  // allOpportunitiesLoaded is false when clients is empty/loading
  populateClients([]);
  expect(workflowsStore.allOpportunitiesLoaded).toBeFalse();

  populateClients(mockClients);
  // allOpportunitiesLoaded is false before hydration
  expect(workflowsStore.allOpportunitiesLoaded).toBeFalse();

  // allOpportunitiesLoaded is true after hydration / loading is finished
  await waitForHydration();
  expect(workflowsStore.allOpportunitiesLoaded).toBeTrue();
});

// TODO(#2346): Update this test when we are using hydrate interface and validating data
// test.skip("only approved eligibility categories are surfaced", async () => {
//   const mockEligibleClients: ClientRecord[] = [
//     {
//       ...eligibleClient,
//       personExternalId: "c1",
//       pseudonymizedId: "c1p",
//       compliantReportingEligible: true,
//     },
//     {
//       ...eligibleClient,
//       personExternalId: "c2",
//       pseudonymizedId: "c2p",
//       compliantReportingEligible: true,
//     },
//     {
//       ...eligibleClient,
//       personExternalId: "c3",
//       pseudonymizedId: "c3p",
//       compliantReportingEligible: true,
//     },
//     {
//       ...eligibleClient,
//       personExternalId: "c4",
//       pseudonymizedId: "c4p",
//       compliantReportingEligible: true,
//     },
//   ];
//   const mockIneligibleCategoryClients: ClientRecord[] = [
//     {
//       ...eligibleClient,
//       personExternalId: "c4_review",
//       pseudonymizedId: "c4_review_p",
//       compliantReportingEligible: false,
//     },
//     {
//       ...eligibleClient,
//       personExternalId: "unexpected_value",
//       pseudonymizedId: "unexpected_value_p",
//       compliantReportingEligible: false,
//     },
//   ];

//   mockSubscribeToCaseloads.mockImplementation(
//     (stateCode, officerIds, handler) => {
//       handler([...mockEligibleClients, ...mockIneligibleCategoryClients]);
//       return mockUnsub;
//     }
//   );

//   await waitForHydration();

//   // simulate a UI displaying client list
//   testObserver = keepAlive(
//     computed(() => workflowsStore.eligibleOpportunities)
//   );

//   expect(workflowsStore.eligibleOpportunities.compliantReporting.length).toBe(
//     mockEligibleClients.length
//   );
//   mockEligibleClients.forEach((expectedClient) =>
//     expect(
//       workflowsStore.eligibleOpportunities.compliantReporting.find(
//         (opp) => opp.client.id === expectedClient.personExternalId
//       )
//     ).toBeDefined()
//   );

//   mockIneligibleCategoryClients.forEach((unexpectedClient) =>
//     expect(
//       workflowsStore.eligibleOpportunities.compliantReporting.find(
//         (opp) => opp.client.id === unexpectedClient.personExternalId
//       )
//     ).toBeUndefined()
//   );
// });

// function getMockAlmostEligibleClients(): ClientRecord[] {
//   return [
//     {
//       ...eligibleClient,
//       personExternalId: "almost1",
//       pseudonymizedId: "almost1p",
//       compliantReportingEligible: true,
//       compliantReportingEligible: {
//         eligibilityCategory: "c1",
//         remainingCriteriaNeeded: 1,
//         almostEligibleCriteria: {
//           passedDrugScreenNeeded: true,
//         },
//       },
//     },
//     // clients below will still be excluded, needing >1 criteria
//     {
//       ...eligibleClient,
//       personExternalId: "almost2",
//       pseudonymizedId: "almost2p",
//       compliantReportingEligible: {
//         ...eligibilityFields,
//         eligibilityCategory: "c2",
//         remainingCriteriaNeeded: 3,
//         almostEligibleCriteria: {
//           passedDrugScreenNeeded: true,
//           paymentNeeded: true,
//           recentRejectionCodes: ["ABCD"],
//         },
//       },
//     },
//     {
//       ...eligibleClient,
//       personExternalId: "almost3",
//       pseudonymizedId: "almost3p",
//       compliantReportingEligible: {
//         ...eligibilityFields,
//         eligibilityCategory: "c3",
//         remainingCriteriaNeeded: 2,
//         almostEligibleCriteria: {
//           passedDrugScreenNeeded: true,
//           paymentNeeded: true,
//         },
//       },
//     },
//   ];
// }

// // TODO(#2346): Update this test when we are using hydrate interface and validating data
// test.skip("filter out clients who are almost eligible", async () => {
//   const mockAlmostEligibleClients = getMockAlmostEligibleClients();

//   const eligibilityFields = {
//     ...eligibleClient.compliantReportingEligible,
//   };
//   const mockEligibleClients = [
//     {
//       ...eligibleClient,
//       personExternalId: "eligible1",
//       pseudonymizedId: "eligible1p",
//       compliantReportingEligible: {
//         ...eligibilityFields,
//         eligibilityCategory: "c1",
//         remainingCriteriaNeeded: 0,
//       },
//     },
//   ];

//   mockSubscribeToCaseloads.mockImplementation(
//     (stateCode, officerIds, handler) => {
//       handler([...mockAlmostEligibleClients, ...mockEligibleClients]);
//       return mockUnsub;
//     }
//   );

//   await waitForHydration();

//   // simulate a UI displaying client list
//   testObserver = keepAlive(
//     computed(() => workflowsStore.eligibleOpportunities)
//   );

//   expect(workflowsStore.eligibleOpportunities.compliantReporting.length).toBe(
//     mockEligibleClients.length
//   );
//   mockEligibleClients.forEach((expectedClient) =>
//     expect(
//       workflowsStore.eligibleOpportunities.compliantReporting.find(
//         (opp) => opp.client.id === expectedClient.personExternalId
//       )
//     ).toBeDefined()
//   );

//   mockAlmostEligibleClients.forEach((unexpectedClient) =>
//     expect(
//       workflowsStore.eligibleOpportunities.compliantReporting.find(
//         (opp) => opp.client.id === unexpectedClient.personExternalId
//       )
//     ).toBeUndefined()
//   );
// });

// TODO(#2346): Update this test when we are using hydrate interface and validating data
// test.skip("list clients who are almost eligible", async () => {
//   // requires active feature flag
//   mockGetUser.mockResolvedValue({
//     ...mockOfficer,
//     featureVariants: { CompliantReportingAlmostEligible: {} },
//   });

//   const mockAlmostEligibleClients = getMockAlmostEligibleClients();

//   mockSubscribeToCaseloads.mockImplementation(
//     (stateCode, officerIds, handler) => {
//       handler([...mockAlmostEligibleClients]);
//       return mockUnsub;
//     }
//   );

//   await waitForHydration();

//   // simulate a UI displaying client list
//   testObserver = keepAlive(
//     computed(() => workflowsStore.eligibleOpportunities.compliantReporting)
//   );

//   expect(workflowsStore.eligibleOpportunities.compliantReporting.length).toBe(
//     0
//   );

//   expect(
//     workflowsStore.almostEligibleOpportunities.compliantReporting.length
//   ).toBe(1);

//   expect(
//     workflowsStore.almostEligibleOpportunities.compliantReporting.find(
//       (opp) => opp.client.id === mockAlmostEligibleClients[0].personExternalId
//     )
//   ).toBeDefined();
// });

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
