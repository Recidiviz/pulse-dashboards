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

  rootStoreMock = {
    currentTenantId: "US_XX",
    userStore: {
      stateCode: "US_XX",
      district: "D5",
    },
    user: {
      email: "test@example.com",
      given_name: "Geri",
      family_name: "Halliwell",
    },
    firestoreStore: {
      db: jest.fn(),
    },
  } as unknown as RootStore;
  sub = new UserSubscription(rootStoreMock);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("dataSource reflects user auth data", () => {
  sub.subscribe();

  expect(collection).toHaveBeenCalledWith(
    rootStoreMock.firestoreStore.db,
    "staff",
  );
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

  // data should be available immediately
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Geri",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "RECIDIVIZ",
        "stateCode": "US_XX",
        "surname": "Halliwell",
      },
    ]
  `);

  // Firestore listener should not clobber our injected data
  mockReceive([]);
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Geri",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "RECIDIVIZ",
        "stateCode": "US_XX",
        "surname": "Halliwell",
      },
    ]
  `);
});

test("inject record in offline mode", () => {
  isOfflineModeMock.mockReturnValue(true);

  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  // data should be available immediately
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Demo",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "us_xx_test@example.com",
        "stateCode": "US_XX",
        "surname": "",
      },
    ]
  `);

  // Firestore listener should not clobber our injected data
  mockReceive([]);
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "email": "test@example.com",
        "givenNames": "Demo",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "us_xx_test@example.com",
        "stateCode": "US_XX",
        "surname": "",
      },
    ]
  `);
});

test("supplement record for staff user without caseload", () => {
  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  // Override should not be set
  expect(sub.dataOverride).toBeUndefined();

  // data should be available immediately
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "district": "D5",
        "email": "test@example.com",
        "givenNames": "Geri",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "us_xx_test@example.com",
        "stateCode": "US_XX",
        "surname": "Halliwell",
      },
    ]
  `);
});

test("supplement record for staff user without caseload but with id", () => {
  Object.defineProperty(rootStoreMock.userStore, "externalId", {
    get() {
      return "12345";
    },
  });
  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  // Override should not be set
  expect(sub.dataOverride).toBeUndefined();

  // data should be available immediately
  expect(sub.data).toMatchInlineSnapshot(`
    Array [
      Object {
        "district": "D5",
        "email": "test@example.com",
        "givenNames": "Geri",
        "hasCaseload": false,
        "hasFacilityCaseload": false,
        "id": "12345",
        "stateCode": "US_XX",
        "surname": "Halliwell",
      },
    ]
  `);
});

test("reject empty result", () => {
  // @ts-ignore
  rootStoreMock.user = undefined;
  jest.spyOn(sub, "dataSource", "get").mockReturnValue(jest.fn() as any);
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive([]);

  expect(sub.hydrationState).toEqual({
    status: "failed",
    error: expect.any(Error),
  });
  expect(sub.data).toEqual([]);
});