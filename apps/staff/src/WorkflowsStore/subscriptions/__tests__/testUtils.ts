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

import { FirestoreError } from "firebase/firestore";
import { Mock } from "vitest";

import { ClientRecord } from "~datatypes";

import FirestoreStore from "../../../FirestoreStore";
import { clientFixture } from "../../../InsightsStore/models/offlineFixtures/ClientFixture";

/**
 * @returns a reference to the callback that receives subscription data,
 * so that test data can be piped through the subscription on demand
 */
export function getMockDocumentSnapshotHandler(
  snapshotMock: Mock,
): (mockData: any) => void {
  let subscriptionHandler: any;

  snapshotMock.mockImplementation((query, handler) => {
    subscriptionHandler = handler;
  });

  snapshotMock();
  snapshotMock.mockClear();

  return function mockReceiveSnapshot(mockData: any): void {
    subscriptionHandler({
      data: () => mockData,
    });
  };
}

/**
 * wraps the objects in `mockData` in a mock QuerySnapshot interface
 */
function mockQuerySnapshotResults(mockData: any[]) {
  return {
    size: mockData.length,
    forEach(callback: (result: any) => void) {
      mockData.forEach((d) => {
        callback({ data: () => d });
      });
    },
  };
}

/**
 * @returns a reference to the callback that receives subscription data,
 * so that test data can be piped through the subscription on demand
 */
export function getMockQuerySnapshotHandler(
  snapshotMock: Mock,
): (mockData: any[] | undefined) => void {
  let subscriptionHandler: any;

  snapshotMock.mockImplementation((query, handler) => {
    subscriptionHandler = handler;
  });

  snapshotMock();
  snapshotMock.mockClear();

  return function mockReceiveQuerySnapshot(mockData: any[] | undefined): void {
    if (mockData) {
      subscriptionHandler(mockQuerySnapshotResults(mockData));
    } else {
      subscriptionHandler(undefined);
    }
  };
}

/**
 *
 * @returns a reference to the callback that receives an error from Firestore,
 * so it can be tested on demand
 */
export function getMockSnapshotErrorHandler(
  snapshotMock: Mock,
): (error: FirestoreError) => void {
  let errorHandler: any;

  snapshotMock.mockImplementation((query, onNext, onError) => {
    errorHandler = onError;
  });

  snapshotMock();
  snapshotMock.mockClear();

  return function mockReceiveFirestoreError(error: FirestoreError): void {
    errorHandler(error);
  };
}

/**
 * Mocks the FirestoreStore.getClientsForOfficerId method to return the given fixture data
 *
 * @export
 * @param {FirestoreStore} firestoreStore - the FirestoreStore to mock
 * @param {(ClientRecord[] | Record<any, ClientRecord>)} [fakeClientData=clientFixture] - the fixture data to return
 * @param {boolean} [returnAll=false] - if true, return all clients
 * @param {string} [fixtureOfficerIdKey="officerId"] - the key in the fixture data that corresponds to the officerId
 */
export async function mockFirestoreStoreClientsForOfficerId(
  firestoreStore: FirestoreStore,
  fakeClientData: ClientRecord[] | Record<any, ClientRecord> = clientFixture,
  returnAll = false,
  fixtureOfficerIdKey = "officerId",
) {
  const formattedFakeClientData =
    fakeClientData instanceof Array
      ? fakeClientData
      : Object.values(fakeClientData);
  vi.spyOn(firestoreStore, "getClientsForOfficerId").mockImplementation(
    async (stateCode: string, officerExternalId: string) => {
      if (returnAll) return formattedFakeClientData;
      return formattedFakeClientData.filter(
        (fixture) =>
          fixture[fixtureOfficerIdKey as keyof ClientRecord] ===
          officerExternalId,
      );
    },
  );
}
