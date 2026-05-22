// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { onSnapshot, query, where } from "firebase/firestore";
import { Mock } from "vitest";

import FirestoreStore from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { CustomTasksSubscription } from "../CustomTasksSubscription";
import { getMockQuerySnapshotHandler } from "./testUtils";

vi.mock("firebase/firestore");
vi.mock("@sentry/react");

const onSnapshotMock = onSnapshot as Mock;
const queryMock = query as Mock;
const whereMock = where as Mock;

const RECORD_ID = "us_mo_123";
const VALID_UUID = "8e58e96f-3a8d-4f2a-9fa6-1b1c3b4f0e2a";

// The schema accepts a plain JS Date in place of a Timestamp (validated in
// `types/__tests__/customTask.test.ts`) — using Date here avoids needing the
// real Timestamp class while `firebase/firestore` is auto-mocked.
function makeValidRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    title: "Contact employer",
    dueDate: new Date("2026-06-01"),
    createdOn: new Date("2026-05-14"),
    deletedOn: null,
    stateCode: "us_mo",
    ...overrides,
  };
}

let firestoreStoreMock: FirestoreStore;
let sub: CustomTasksSubscription;

beforeEach(() => {
  vi.resetAllMocks();

  firestoreStoreMock = new FirestoreStore({
    rootStore: {
      firebaseAuthClient: { app: {}, projectId: "test" },
    } as unknown as RootStore,
  });
  // returns the mocked subcollection ref — value irrelevant for these assertions
  vi.spyOn(firestoreStoreMock, "customTasksCollection").mockReturnValue(
    "mock-collection" as any,
  );

  // FirestoreQuerySubscription only registers an onSnapshot listener when
  // dataSource is truthy. With firebase/firestore auto-mocked, query() defaults
  // to undefined — give it a sentinel so the subscription wires the handler.
  queryMock.mockReturnValue("mock-query");
  onSnapshotMock.mockReturnValue(vi.fn());
  sub = new CustomTasksSubscription(firestoreStoreMock, RECORD_ID);
});

describe("CustomTasksSubscription", () => {
  test("dataSource queries the per-record custom_tasks subcollection with the soft-delete filter", () => {
    void sub.dataSource;

    expect(firestoreStoreMock.customTasksCollection).toHaveBeenCalledWith(
      RECORD_ID,
    );
    expect(whereMock).toHaveBeenCalledWith("deletedOn", "==", null);
    expect(queryMock).toHaveBeenCalled();
  });

  test("hydrates with valid records on the first snapshot", () => {
    const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
    sub.subscribe();

    const records = [
      makeValidRecord(),
      makeValidRecord({ id: "ce32f0b6-1b2c-4d49-8a1b-2c4ee5b8c1d7" }),
    ];
    mockReceive(records);

    expect(sub.hydrationState).toEqual({ status: "hydrated" });
    expect(sub.data).toHaveLength(2);
    expect(sub.data[0].id).toBe(VALID_UUID);
  });

  test("drops malformed records but keeps valid ones (partial success)", () => {
    const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
    sub.subscribe();

    const records = [
      makeValidRecord(),
      // empty title → schema rejects
      makeValidRecord({
        id: "ce32f0b6-1b2c-4d49-8a1b-2c4ee5b8c1d7",
        title: "",
      }),
    ];
    mockReceive(records);

    expect(sub.hydrationState).toEqual({ status: "hydrated" });
    expect(sub.data).toHaveLength(1);
    expect(sub.data[0].id).toBe(VALID_UUID);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  test("resets hydration state when the data source is undefined", () => {
    const mockReceive = getMockQuerySnapshotHandler(onSnapshotMock);
    sub.subscribe();

    mockReceive([makeValidRecord()]);
    expect(sub.hydrationState).toEqual({ status: "hydrated" });

    mockReceive(undefined);
    expect(sub.hydrationState).toEqual({ status: "needs hydration" });
    expect(sub.data).toEqual([]);
  });
});
