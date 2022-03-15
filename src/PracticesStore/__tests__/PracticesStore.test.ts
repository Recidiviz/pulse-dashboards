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

import { computed, runInAction, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  getUser,
  searchClients,
  subscribeToEligibleCount,
  subscribeToOfficers,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import type { PracticesStore } from "..";
import { mockClients, mockOfficers, mockUser } from "../__fixtures__";

jest.mock("../../firestore");

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockSubscribeToEligibleCount = subscribeToEligibleCount as jest.MockedFunction<
  typeof subscribeToEligibleCount
>;
const mockSubscribeToOfficers = subscribeToOfficers as jest.MockedFunction<
  typeof subscribeToOfficers
>;
const mockSearchClients = searchClients as jest.MockedFunction<
  typeof searchClients
>;

let practicesStore: PracticesStore;
let testObserver: IDisposer;

const mockUnsub = jest.fn();

function doBackendMock() {
  mockGetUser.mockResolvedValue(mockUser);
  mockSubscribeToEligibleCount.mockImplementation(
    (opportunityType, stateCode, ids, handler) => {
      handler(1);
      return mockUnsub;
    }
  );
}

beforeEach(() => {
  practicesStore = new RootStore().practicesStore;
  practicesStore.rootStore.userStore.user = { email: "foo@example.com" };
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
  expect(practicesStore.isLoading).toBeTrue();

  practicesStore.hydrate();

  await when(() => !practicesStore.isLoading);

  expect(practicesStore.user).toEqual(mockUser);
});

test("caseload defaults to self", async () => {
  practicesStore.hydrate();

  await when(() => !practicesStore.isLoading);

  expect(practicesStore.districtFilter).toEqual([mockUser.info.district]);
  expect(practicesStore.officerFilter).toEqual([mockUser.info.id]);
});

test("caseload defaults to all saved officers when present", async () => {
  const mockSavedOfficers = ["OFFICER1", "OFFICER2", "OFFICER3"];
  const mockSavedDistricts = ["DISTRICT1", "DISTRICT2"];
  mockGetUser.mockResolvedValue({
    ...mockUser,
    updates: {
      savedOfficers: mockSavedOfficers,
      savedDistricts: mockSavedDistricts,
    },
  });

  practicesStore.hydrate();

  await when(() => practicesStore.isLoading === false);

  expect(practicesStore.districtFilter).toEqual(mockSavedDistricts);
  expect(practicesStore.officerFilter).toEqual(mockSavedOfficers);
});

test("count compliant reporting opportunities based on current filter", async () => {
  const mockCount = 10;
  mockSubscribeToEligibleCount.mockImplementation(
    (opportunityType, stateCode, ids, handler) => {
      expect(ids).toEqual([mockUser.info.id]);
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
    practicesStore.officerFilter = ["OFFICER2"];
  });

  await when(
    () => practicesStore.opportunityCounts.compliantReporting !== undefined
  );

  expect(mockUnsub).toHaveBeenCalled();
});

test("search for clients", async () => {
  mockSearchClients.mockResolvedValue(mockClients);

  mockSubscribeToOfficers.mockImplementation((stateCode, handler) => {
    expect(stateCode).toBe(mockUser.info.stateCode);
    handler(mockOfficers);
    return mockUnsub;
  });

  practicesStore.hydrate();

  await when(() => !practicesStore.isLoading);

  runInAction(() => {
    practicesStore.searchFilter = "foo";
  });

  // simulate a search results page in the UI that is observing results
  keepAlive(computed(() => practicesStore.searchResults));

  expect(mockSearchClients).toHaveBeenCalledWith(
    mockUser.info.stateCode,
    [mockUser.info.id],
    "foo"
  );
  expect(mockSubscribeToOfficers).toHaveBeenCalled();

  await when(() => practicesStore.searchResults.clients !== undefined);

  expect(practicesStore.searchResults.clients?.length).toBe(mockClients.length);

  await when(() => practicesStore.searchResults.officers !== undefined);

  expect(practicesStore.searchResults.officers).toEqual(
    mockOfficers.slice(0, 1)
  );
});
