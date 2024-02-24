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

import * as Sentry from "@sentry/react";
import { waitFor } from "@testing-library/dom";
import {
  DocumentData,
  FirestoreError,
  onSnapshot,
  Query,
} from "firebase/firestore";
import { computed, IObservableValue, observable } from "mobx";
import { keepAlive } from "mobx-utils";

import { FeatureGateError } from "../../../errors";
import { FirestoreQuerySubscription } from "../FirestoreQuerySubscription";
import {
  getMockQuerySnapshotHandler,
  getMockSnapshotErrorHandler,
} from "./testUtils";

jest.mock("firebase/firestore");
jest.mock("@sentry/react");

const onSnapshotMock = onSnapshot as jest.Mock;

const cancelSnapshotMock = jest.fn();

let observableParam: IObservableValue<string | undefined>;

let sub: FirestoreQuerySubscription<any>;

function getTestUnit(...constructorArgs: any[]) {
  observableParam = observable.box("TEST1");

  class TestSubscription extends FirestoreQuerySubscription<any> {
    // eslint-disable-next-line class-methods-use-this
    get dataSource() {
      // we don't care about the query itself here, just need a return value
      // that will react to the mock observable
      const val = observableParam.get();

      // hook to let us trigger an undefined query
      if (!val) return;

      return jest.fn().mockReturnValue(val) as unknown as Query;
    }
  }

  return new TestSubscription(...constructorArgs);
}

beforeEach(() => {
  jest.resetAllMocks();

  onSnapshotMock.mockReturnValue(cancelSnapshotMock);

  sub = getTestUnit();
});

test("subscribe", () => {
  sub.subscribe();

  expect(onSnapshotMock).toHaveBeenCalled();
});

test("unsubscribe", () => {
  sub.subscribe();

  // @ts-expect-error this is private with respect to the application,
  // but we need to verify its behavior to prevent memory leaks
  jest.spyOn(sub, "disposeDynamicDataSource");
  sub.unsubscribe();

  expect(cancelSnapshotMock).toHaveBeenCalled();
  // @ts-expect-error
  expect(sub.disposeDynamicDataSource).toHaveBeenCalled();
});

test("results", () => {
  const mockData = [
    {
      email: "fake@email.biz",
      id: "abc123",
      stateCode: "US_XX",
    },
  ];

  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);

  mockReceive([]);
  expect(sub.data).toEqual([]);
});

test("subscription responds to observation", async () => {
  jest.spyOn(sub, "subscribe");
  jest.spyOn(sub, "unsubscribe");
  // simulates the data being observed in a datastore or component
  const testObserver = keepAlive(computed(() => sub.data));
  await waitFor(async () => expect(sub.subscribe).toHaveBeenCalled());

  // disposes of the observation
  testObserver();
  await waitFor(() => expect(sub.unsubscribe).toHaveBeenCalled());
});

test("reactive query", () => {
  sub.subscribe();

  jest.spyOn(sub, "subscribe");
  jest.spyOn(sub, "unsubscribe");

  observableParam.set("TEST2");

  expect(sub.unsubscribe).toHaveBeenCalled();
  expect(sub.subscribe).toHaveBeenCalled();
});

test("no query", () => {
  observableParam.set(undefined);
  sub.subscribe();
  expect(onSnapshotMock).not.toHaveBeenCalled();
  expect(sub.data).toEqual([]);
});

test("undefined query resets data", () => {
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const mockData = [
    {
      email: "fake@email.biz",
      id: "abc123",
      stateCode: "US_XX",
    },
  ];

  sub.subscribe();

  jest.spyOn(sub, "subscribe");
  jest.spyOn(sub, "unsubscribe");

  mockReceive(mockData);

  expect(sub.data).toEqual(mockData);

  observableParam.set(undefined);

  expect(sub.data).toEqual([]);
  expect(sub.unsubscribe).toHaveBeenCalled();
  expect(sub.subscribe).toHaveBeenCalled();
  expect(sub.isActive).toBe(false);
  expect(sub.hydrationState.status).toBe("needs hydration");
});

test("no duplicate listeners", () => {
  sub.subscribe();
  sub.subscribe();
  expect(onSnapshotMock).toHaveBeenCalledTimes(1);
});

test("hydration", () => {
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  expect(sub.hydrationState.status).toBe("needs hydration");

  sub.hydrate();

  expect(sub.hydrationState.status).toBe("loading");

  mockReceive([]);

  expect(sub.hydrationState.status).toBe("hydrated");

  mockReceive(undefined);

  expect(sub.hydrationState.status).toBe("needs hydration");
});

test("no data transformer or validation function required", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub = getTestUnit();

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
});

test("handles empty response gracefully by default", () => {
  const mockData: unknown[] = [];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  sub = getTestUnit();

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
});

test("transform raw data", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);

  const testTransform = (d: DocumentData) => {
    return { question: `${d.question}???` };
  };

  sub = getTestUnit(testTransform);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual([{ question: "answer???" }]);
});

test("raw data fails validation", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    throw new Error("foo");
  };

  sub = getTestUnit(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual([]);
});

test("transform errors logged to Sentry", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testError = new Error("foo");
  const testTransform = (d?: DocumentData) => {
    throw testError;
  };

  sub = getTestUnit(testTransform);

  sub.subscribe();

  mockReceive(mockData);
  expect(Sentry.captureException).toHaveBeenCalledOnceWith(testError);
});

test("validation errors logged to Sentry", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testError = new Error("foo");
  const testValidate = (d?: DocumentData) => {
    throw testError;
  };

  sub = getTestUnit(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(Sentry.captureException).toHaveBeenCalledOnceWith(testError);
});

test("feature gate errors not logged to Sentry", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    throw new FeatureGateError("feature flag disabled");
  };

  sub = getTestUnit(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test("raw data passes validation", () => {
  const mockData = [
    {
      question: "answer",
    },
  ];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    return d;
  };

  sub = getTestUnit(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
  expect(sub.hydrationState.status).toBe("hydrated");
});

test("validator is not called on undefined data", () => {
  const mockData = [{ some: "data" }];
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testTransform = (d?: DocumentData) => undefined;
  const testValidate = (d?: DocumentData) => {
    throw new Error("I should not be thrown");
  };

  sub = getTestUnit(testTransform, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual([]);
  expect(sub.hydrationState.status).toBe("hydrated");
});

test("stale data cleared when validation fails", () => {
  const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    if (d?.foo === "bar") return d;
    throw new Error("validation failed");
  };

  sub = getTestUnit(undefined, testValidate);

  sub.subscribe();

  mockReceive([{ foo: "bar" }]);
  expect(sub.data).not.toEqual([]);
  mockReceive([{ bar: "foo" }]);
  expect(sub.data).toEqual([]);
});

test("handles Firestore error", () => {
  const mockReceiveError = getMockSnapshotErrorHandler(onSnapshotMock);
  const testError: FirestoreError = {
    message: "test message",
    code: "permission-denied",
    name: "FirebaseError",
  };
  sub.subscribe();

  mockReceiveError(testError);
  expect(Sentry.captureException).toHaveBeenCalledWith(testError);
  expect(sub.hydrationState).toEqual({ status: "failed", error: testError });

  expect(sub.data).toEqual([]);
});
