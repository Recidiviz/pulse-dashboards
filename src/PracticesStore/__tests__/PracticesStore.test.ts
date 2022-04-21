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

import { keyBy } from "lodash";
import { computed, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  ClientRecord,
  CompliantReportingEligibleRecord,
  getClient,
  getUser,
  subscribeToCaseloads,
  subscribeToEligibleCount,
  subscribeToOfficers,
  UserUpdateRecord,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import type { PracticesStore } from "..";
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

jest.mock("../../firestore");

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

let rootStore: RootStore;
let practicesStore: PracticesStore;
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
      expect(officerIds).toEqual([mockOfficer.info.id]);
      handler(mockClients);
      return mockUnsub;
    }
  );
}

async function waitForHydration(): Promise<void> {
  practicesStore.hydrate();

  await when(() => !practicesStore.isLoading);
}

function populateClients(clients: ClientRecord[]): void {
  runInAction(() => {
    practicesStore.clients = keyBy(
      clients.map((r) => new Client(r, rootStore)),
      "pseudonymizedId"
    );
  });
}

beforeEach(() => {
  rootStore = new RootStore();
  practicesStore = rootStore.practicesStore;
  runInAction(() => {
    rootStore.userStore.user = {
      email: "foo@example.com",
      [`${process.env.REACT_APP_METADATA_NAMESPACE}app_metadata`]: {
        state_code: mockOfficer.info.stateCode,
      },
    };
  });
  doBackendMock();
});

afterEach(() => {
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("hydration progress", async () => {
  expect(practicesStore.error).toBeUndefined();
  expect(practicesStore.isLoading).toBeUndefined();

  await waitForHydration();

  expect(practicesStore.user).toEqual(mockOfficer);
});

test("caseload defaults to self", async () => {
  await waitForHydration();

  expect(practicesStore.selectedOfficerIds).toEqual([mockOfficer.info.id]);
});

test("caseload defaults to all saved officers when present", async () => {
  const mockSavedOfficers = ["OFFICER1", "OFFICER2", "OFFICER3"];
  mockGetUser.mockResolvedValue({
    ...mockOfficer,
    updates: {
      ...(mockOfficer.updates as UserUpdateRecord),
      savedOfficers: mockSavedOfficers,
    },
  });

  await waitForHydration();

  expect(practicesStore.selectedOfficerIds).toEqual(mockSavedOfficers);
});

test("caseload defaults to no officers if user has no caseload and no saved officers", async () => {
  mockGetUser.mockResolvedValue(mockSupervisor);

  await waitForHydration();

  expect(practicesStore.selectedOfficerIds).toEqual([]);
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
  testObserver = keepAlive(computed(() => practicesStore.availableOfficers));

  await when(() => practicesStore.availableOfficers.length > 0);

  expect(mockSubscribeToOfficers).toHaveBeenCalled();

  expect(practicesStore.availableOfficers).toEqual(mockOfficers);
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
  testObserver = keepAlive(computed(() => practicesStore.availableOfficers));

  await when(() => practicesStore.availableOfficers.length > 0);

  expect(mockSubscribeToOfficers).toHaveBeenCalled();

  expect(practicesStore.availableOfficers).toEqual(mockOfficers);
});

test("subscribe to all clients in default caseload", async () => {
  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(
    computed(() => practicesStore.compliantReportingEligibleClients)
  );

  expect(mockSubscribeToCaseloads).toHaveBeenCalled();

  expect(practicesStore.compliantReportingEligibleClients.length).toBe(1);
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
    computed(() => practicesStore.compliantReportingEligibleClients)
  );

  expect(mockSubscribeToCaseloads).toHaveBeenCalled();
});

test("don't subscribe to clients if no officers are selected", async () => {
  mockGetUser.mockResolvedValue(mockSupervisor);

  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(
    computed(() => practicesStore.compliantReportingEligibleClients)
  );

  expect(mockSubscribeToCaseloads).not.toHaveBeenCalled();
});

test("count compliant reporting opportunities based on current filter", async () => {
  const mockCount = 10;
  mockSubscribeToEligibleCount.mockImplementation(
    (opportunityType, stateCode, ids, handler) => {
      expect(ids).toEqual([mockOfficer.info.id]);
      handler(mockCount);
      return mockUnsub;
    }
  );

  practicesStore.hydrate();

  await when(
    () => practicesStore.opportunityCounts.compliantReporting !== undefined
  );

  expect(practicesStore.opportunityCounts.compliantReporting).toBe(mockCount);
});

test("clean up caseload subscriptions on change", async () => {
  practicesStore.hydrate();

  // simulate a component consuming this value, because it will automatically unsubscribe
  // when no longer observed; we are testing the use case of the underlying filter changing
  // while the computed value is continuously observed
  testObserver = keepAlive(
    computed(() => practicesStore.opportunityCounts.compliantReporting)
  );

  await when(
    () => practicesStore.opportunityCounts.compliantReporting !== undefined
  );

  expect(mockUnsub).not.toHaveBeenCalled();

  runInAction(() => {
    practicesStore.selectedOfficerIds = ["OFFICER2"];
  });

  await when(
    () => practicesStore.opportunityCounts.compliantReporting !== undefined
  );

  expect(mockUnsub).toHaveBeenCalled();
});

test("no client selected", async () => {
  await waitForHydration();

  runInAction(() => {
    practicesStore.selectedOfficerIds = ["OFFICER1"];
  });

  // simulate a UI displaying CR data
  testObserver = keepAlive(
    computed(() => practicesStore.compliantReportingEligibleClients)
  );

  expect(practicesStore.selectedClient).toBeUndefined();
});

test("select existing client", () => {
  populateClients(mockClients);

  const idToSelect = ineligibleClient.pseudonymizedId;

  runInAction(() => {
    practicesStore.selectedOfficerIds = ["OFFICER1"];
    practicesStore.updateSelectedClient(idToSelect);
  });

  // simulate a UI displaying client data
  testObserver = keepAlive(computed(() => practicesStore.selectedClient));

  expect(practicesStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

test("select unfetched client", async () => {
  practicesStore.hydrate();

  const idToSelect = "unknownId";
  mockGetClient.mockResolvedValue({
    ...ineligibleClient,
    pseudonymizedId: idToSelect,
  });

  practicesStore.updateSelectedClient(idToSelect);

  expect(practicesStore.selectedClient).toBeUndefined();

  await when(() => practicesStore.selectedClient !== undefined);

  expect(mockGetClient).toHaveBeenCalledWith(idToSelect);
  expect(practicesStore.selectedClient?.pseudonymizedId).toBe(idToSelect);
});

test("track call on client", async () => {
  populateClients(mockClients);

  const trackingSpy = jest.spyOn(Client.prototype, "trackFormViewed");

  await practicesStore.trackClientFormViewed(
    eligibleClient.pseudonymizedId,
    "compliantReporting"
  );

  expect(trackingSpy).toHaveBeenCalledWith("compliantReporting");
});

test("tracking call waits for client to be instantiated", async () => {
  populateClients([]);
  mockGetClient.mockResolvedValue(eligibleClient);

  const trackingSpy = jest.spyOn(Client.prototype, "trackFormViewed");

  const trackingPromise = practicesStore.trackClientFormViewed(
    eligibleClient.pseudonymizedId,
    "compliantReporting"
  );

  // triggers an additional fetch to populate the expected client
  practicesStore.updateSelectedClient(eligibleClient.pseudonymizedId);

  await trackingPromise;

  expect(trackingSpy).toHaveBeenCalledWith("compliantReporting");
});

test("only approved eligibility categories are surfaced", async () => {
  const eligibilityFields = {
    ...eligibleClient.compliantReportingEligible,
  } as CompliantReportingEligibleRecord;
  const mockEligibleClients: ClientRecord[] = [
    {
      ...eligibleClient,
      personExternalId: "c1",
      pseudonymizedId: "c1p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "c1",
      },
    },
    {
      ...eligibleClient,
      personExternalId: "c2",
      pseudonymizedId: "c2p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "c2",
      },
    },
    {
      ...eligibleClient,
      personExternalId: "c3",
      pseudonymizedId: "c3p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "c3",
      },
    },
    {
      ...eligibleClient,
      personExternalId: "c4",
      pseudonymizedId: "c4p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "c4",
      },
    },
  ];
  const mockIneligibleCategoryClients: ClientRecord[] = [
    {
      ...eligibleClient,
      personExternalId: "c4_review",
      pseudonymizedId: "c4_review_p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "c4_review",
      },
    },
    {
      ...eligibleClient,
      personExternalId: "unexpected_value",
      pseudonymizedId: "unexpected_value_p",
      compliantReportingEligible: {
        ...eligibilityFields,
        eligibilityCategory: "unexpected_value",
      },
    },
  ];

  mockSubscribeToCaseloads.mockImplementation(
    (stateCode, officerIds, handler) => {
      handler([...mockEligibleClients, ...mockIneligibleCategoryClients]);
      return mockUnsub;
    }
  );

  await waitForHydration();

  // simulate a UI displaying client list
  testObserver = keepAlive(
    computed(() => practicesStore.compliantReportingEligibleClients)
  );

  expect(practicesStore.compliantReportingEligibleClients.length).toBe(
    mockEligibleClients.length
  );
  mockEligibleClients.forEach((expectedClient) =>
    expect(
      practicesStore.compliantReportingEligibleClients.find(
        (c) => c.id === expectedClient.personExternalId
      )
    ).toBeDefined()
  );

  mockIneligibleCategoryClients.forEach((unexpectedClient) =>
    expect(
      practicesStore.compliantReportingEligibleClients.find(
        (c) => c.id === unexpectedClient.personExternalId
      )
    ).toBeUndefined()
  );
});
