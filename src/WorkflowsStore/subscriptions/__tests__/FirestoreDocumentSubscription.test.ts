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

import { DocumentData } from "@google-cloud/firestore";
import { DocumentReference, onSnapshot } from "firebase/firestore";
import { computed } from "mobx";
import { keepAlive } from "mobx-utils";

import { FirestoreDocumentSubscription } from "../FirestoreDocumentSubscription";
import { getMockDocumentSnapshotHandler } from "../testUtils";

jest.mock("firebase/firestore");

const onSnapshotMock = onSnapshot as jest.Mock;

const cancelSnapshotMock = jest.fn();

let sub: FirestoreDocumentSubscription<any>;

class TestSubscription extends FirestoreDocumentSubscription {
  dataSource = (jest.fn() as unknown) as DocumentReference;
}

beforeEach(() => {
  jest.resetAllMocks();

  onSnapshotMock.mockReturnValue(cancelSnapshotMock);

  sub = new TestSubscription();
});

test("subscribe", () => {
  sub.subscribe();

  expect(onSnapshot).toHaveBeenCalled();
});

test("unsubscribe", () => {
  sub.subscribe();

  sub.unsubscribe();

  expect(cancelSnapshotMock).toHaveBeenCalled();
});

test("results", () => {
  const mockData = {
    email: "fake@email.biz",
    id: "abc123",
    stateCode: "US_XX",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);

  mockReceive(undefined);
  expect(sub.data).toBeUndefined();
});

test("subscription responds to observation", () => {
  // simulates the data being observed in a datastore or component
  const testObserver = keepAlive(computed(() => sub.data));
  expect(onSnapshot).toHaveBeenCalled();

  // disposes of the observation
  testObserver();
  expect(cancelSnapshotMock).toHaveBeenCalled();
});

test("no duplicate listeners", () => {
  sub.subscribe();
  sub.subscribe();
  expect(onSnapshotMock).toHaveBeenCalledTimes(1);
});

test("hydration", () => {
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  expect(sub.isLoading).toBeUndefined();

  sub.hydrate();

  expect(sub.isLoading).toBe(true);

  mockReceive({});

  expect(sub.isLoading).toBe(false);
});

test("no data transformer required", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  sub = new TestSubscription();

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
});

test("transform raw data", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  const testTransform = (d?: DocumentData) => {
    return { question: `${d?.question}???` };
  };

  sub = new TestSubscription(testTransform);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual({ question: "answer???" });
});
