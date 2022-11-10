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

import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { configure } from "mobx";

import { RootStore } from "../../../RootStore";
import { isOfflineMode } from "../../../utils/isOfflineMode";
import { UserSubscription } from "../UserSubscription";
import { getMockQuerySnapshotHandler } from "./testUtils";

jest.mock("firebase/firestore");
jest.mock("../../../utils/isOfflineMode");

const onSnapshotMock = onSnapshot as jest.Mock;
const isOfflineModeMock = isOfflineMode as jest.Mock;

let rootStoreMock: RootStore;
let sub: UserSubscription;

beforeEach(() => {
  jest.resetAllMocks();

  configure({ safeDescriptors: false });

  rootStoreMock = ({
    currentTenantId: "US_XX",
    userStore: {
      stateCode: "US_XX",
    },
    user: { email: "test@example.com" },
  } as unknown) as RootStore;
  sub = new UserSubscription(rootStoreMock);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("dataSource reflects user auth data", () => {
  sub.subscribe();

  // args may be undefined because of incomplete firestore mocking,
  // generally we don't care about that in these tests
  expect(collection).toHaveBeenCalledWith(undefined, "staff");
  expect(where).toHaveBeenCalledWith("stateCode", "==", "US_XX");
  expect(where).toHaveBeenCalledWith("email", "==", "test@example.com");
  expect(limit).toHaveBeenCalledWith(1);
  expect(query).toHaveBeenCalled();
});

test("inject record for Recidiviz users", () => {
  // @ts-ignore
  rootStoreMock.userStore.stateCode = "RECIDIVIZ";
  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Recidiviz",
        "hasCaseload": false,
        "id": "RECIDIVIZ",
        "stateCode": "US_XX",
        "surname": "Staff",
      },
    ]
  `);
});

test("inject record in offline mode", () => {
  isOfflineModeMock.mockReturnValue(true);

  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Demo",
        "hasCaseload": false,
        "id": "us_xx_test@example.com",
        "stateCode": "US_XX",
        "surname": "",
      },
    ]
  `);
});

test("reject empty result", () => {
  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  expect(sub.error).toEqual(expect.any(Error));
  expect(sub.isHydrated).toBe(false);
  expect(sub.isLoading).toBe(false);
  expect(sub.data).toEqual([]);
});
