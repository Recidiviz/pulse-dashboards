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
import * as Sentry from "@sentry/react";
import {
  DocumentReference,
  FirestoreError,
  onSnapshot,
} from "firebase/firestore";
import { computed } from "mobx";
import { keepAlive } from "mobx-utils";

import { FeatureGateError } from "../../../errors";
import { FirestoreDocumentSubscription } from "../FirestoreDocumentSubscription";
import {
  getMockDocumentSnapshotHandler,
  getMockSnapshotErrorHandler,
} from "./testUtils";

jest.mock("firebase/firestore");
jest.mock("@sentry/react");

const onSnapshotMock = onSnapshot as jest.Mock;

const cancelSnapshotMock = jest.fn();

let sub: FirestoreDocumentSubscription<any>;

class TestSubscription extends FirestoreDocumentSubscription {
  dataSource = jest.fn() as unknown as DocumentReference;
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

test("no data transformer or validation function required", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  sub = new TestSubscription();

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
});

test("handles empty response gracefully", () => {
  const mockData = undefined;
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  sub = new TestSubscription();

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toBeUndefined();
});

test("passes empty object through instead of detecting as falsy", () => {
  const mockData = {};
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

test("raw data fails validation", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testError = new Error("Test doc fails validation");
  const testValidate = (d?: DocumentData) => {
    throw testError;
  };

  sub = new TestSubscription(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(undefined);
  expect(sub.isHydrated).toEqual(false);
  expect(sub.error).toEqual(testError);
  expect(sub.isLoading).toEqual(false);
});

test("transform errors logged to Sentry", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const transformError = new Error("Test doc fails transform");
  const testTransformFail = (d?: DocumentData) => {
    throw transformError;
  };

  sub = new TestSubscription(testTransformFail);

  sub.subscribe();

  mockReceive(mockData);

  expect(Sentry.captureException).toHaveBeenCalledOnceWith(transformError);
});

test("validation errors logged to Sentry", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const validationError = new Error("Test doc fails validation");
  const testValidateFail = (d?: DocumentData) => {
    throw validationError;
  };

  sub = new TestSubscription(undefined, testValidateFail);

  sub.subscribe();

  mockReceive(mockData);

  expect(Sentry.captureException).toHaveBeenCalledOnceWith(validationError);
});

test("feature gate errors not logged to Sentry", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testValidateFail = (d?: DocumentData) => {
    throw new FeatureGateError("Feature flag disabled");
  };

  sub = new TestSubscription(undefined, testValidateFail);

  sub.subscribe();

  mockReceive(mockData);

  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test("raw data passes validation", () => {
  const mockData = {
    question: "answer",
  };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    return d;
  };

  sub = new TestSubscription(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
  expect(sub.isHydrated).toEqual(true);
  expect(sub.error).toEqual(undefined);
  expect(sub.isLoading).toEqual(false);
});

test("validator is not called on undefined data", () => {
  const mockData = undefined;
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    throw new Error("I should not be thrown");
  };

  sub = new TestSubscription(undefined, testValidate);

  sub.subscribe();

  mockReceive(mockData);
  expect(sub.data).toEqual(mockData);
  expect(sub.isHydrated).toEqual(true);
  expect(sub.error).toEqual(undefined);
  expect(sub.isLoading).toEqual(false);
});

test("stale data cleared when validation fails", () => {
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testValidate = (d?: DocumentData) => {
    if (d?.foo === "bar") return d;
    throw new Error("validation failed");
  };

  sub = new TestSubscription(undefined, testValidate);

  sub.subscribe();

  mockReceive({ foo: "bar" });
  expect(sub.data).toBeDefined();
  mockReceive({ bar: "foo" });
  expect(sub.data).toBeUndefined();
  expect(sub.error).toBeDefined();
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
  expect(Sentry.captureException).toHaveBeenCalledOnceWith(testError);
  expect(sub.error).toEqual(testError);
  expect(sub.isHydrated).toBe(false);
  expect(sub.isLoading).toBeFalse();
  expect(sub.data).toBeUndefined();
});

test("update function is called with record", () => {
  const mockData = { recordId: "us_id_123" };
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);
  const testUpdateFn = jest
    .fn()
    .mockImplementation(async (d?: DocumentData) => {
      await Promise.resolve();
    });

  sub = new TestSubscription(undefined, undefined, testUpdateFn);

  sub.subscribe();

  mockReceive(mockData);
  expect(testUpdateFn).toHaveBeenCalledWith(mockData);
  expect(sub.data).toEqual(mockData);
  expect(sub.isHydrated).toEqual(true);
  expect(sub.error).toEqual(undefined);
  expect(sub.isLoading).toEqual(false);
});
