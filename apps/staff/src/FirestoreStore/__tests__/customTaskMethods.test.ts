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

import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import tk from "timekeeper";
import { Mock } from "vitest";

import { RootStore } from "../../RootStore";
import FirestoreStore from "../FirestoreStore";

vi.mock("firebase/firestore");
vi.mock("~client-env-utils");

// `vi.mock("firebase/firestore")` replaces the real `Timestamp` class with a
// stub, so we use plain placeholder values for `dueDate` / `completedOn` in
// these tests. The schema's parse-time validation is exercised in
// `types/__tests__/customTask.test.ts`.
const FAKE_DUE_DATE = { __mock: "due-date" } as any;
const FAKE_COMPLETED_ON = { __mock: "completed-on" } as any;

const mockSetDoc = setDoc as Mock;
const mockDoc = doc as Mock;
const mockCollection = collection as Mock;
const mockServerTimestamp = serverTimestamp as Mock;

const TEST_USER_EMAIL = "officer@recidiviz.org";
const TEST_UUID = "0fb6ee5a-1f0e-4f78-b9e0-2f37e2c1d5a3";

describe("FirestoreStore custom-task methods", () => {
  let store: FirestoreStore;
  let mockRootStore: RootStore;

  beforeEach(() => {
    vi.clearAllMocks();
    tk.freeze(new Date("2026-05-14"));
    mockRootStore = {
      userStore: {
        user: { email: TEST_USER_EMAIL },
        userEmail: TEST_USER_EMAIL,
        isRecidivizUser: false,
      },
      tenantStore: { currentTenantId: "US_MO" },
      firebaseAuthClient: {
        authenticate: vi.fn(),
        projectId: "real-project",
      },
      isImpersonating: false,
    } as unknown as RootStore;
    store = new FirestoreStore({ rootStore: mockRootStore });

    vi.mocked(writeBatch).mockImplementation(
      () =>
        ({
          // @ts-ignore: mocking the set() call onto setDoc lets us assert
          // batched writes without caring about batching.
          set: setDoc,
          update: vi.fn(),
          delete: vi.fn(),
          commit: vi.fn(),
        }) as any,
    );
    mockDoc.mockReturnValue("test-doc-ref");
    mockServerTimestamp.mockReturnValue("mock-timestamp");
    vi.stubGlobal("crypto", {
      ...globalThis.crypto,
      randomUUID: vi.fn().mockReturnValue(TEST_UUID),
    });
  });

  afterEach(() => {
    tk.reset();
    vi.unstubAllGlobals();
  });

  describe("createCustomTask", () => {
    test("writes the parent stateCode upsert and the task doc in one batch", async () => {
      const taskId = await store.createCustomTask("us_mo_123", {
        title: "Contact employer",
        dueDate: FAKE_DUE_DATE,
      });

      expect(taskId).toBe(TEST_UUID);
      expect(mockDoc.mock.calls).toEqual([
        [undefined, "clientUpdatesV2", `us_mo_123/custom_tasks/${TEST_UUID}`],
        [undefined, "clientUpdatesV2", "us_mo_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        ["test-doc-ref", { stateCode: "us_mo" }, { merge: true }],
        [
          "test-doc-ref",
          {
            id: TEST_UUID,
            title: "Contact employer",
            dueDate: FAKE_DUE_DATE,
            createdOn: "mock-timestamp",
            stateCode: "us_mo",
          },
          { merge: true },
        ],
      ]);
    });
  });

  describe("updateCustomTask", () => {
    test("partial title/dueDate patch stamps updatedOn", async () => {
      await store.updateCustomTask("us_mo_123", TEST_UUID, {
        title: "Updated title",
        dueDate: FAKE_DUE_DATE,
      });

      expect(mockDoc.mock.calls).toEqual([
        [undefined, "clientUpdatesV2", `us_mo_123/custom_tasks/${TEST_UUID}`],
        [undefined, "clientUpdatesV2", "us_mo_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        ["test-doc-ref", { stateCode: "us_mo" }, { merge: true }],
        [
          "test-doc-ref",
          {
            title: "Updated title",
            dueDate: FAKE_DUE_DATE,
            updatedOn: "mock-timestamp",
          },
          { merge: true },
        ],
      ]);
    });

    test("completion transition includes completedOn in patch", async () => {
      await store.updateCustomTask("us_mo_123", TEST_UUID, {
        completedOn: FAKE_COMPLETED_ON,
      });

      expect(mockSetDoc.mock.calls[1][1]).toEqual({
        completedOn: FAKE_COMPLETED_ON,
        updatedOn: "mock-timestamp",
      });
    });

    test("reopen transition nulls completedOn", async () => {
      await store.updateCustomTask("us_mo_123", TEST_UUID, {
        completedOn: null,
      });

      expect(mockSetDoc.mock.calls[1][1]).toEqual({
        completedOn: null,
        updatedOn: "mock-timestamp",
      });
    });
  });

  describe("softDeleteCustomTask", () => {
    test("stamps deletedOn with serverTimestamp", async () => {
      await store.softDeleteCustomTask("us_mo_123", TEST_UUID);

      expect(mockDoc.mock.calls).toEqual([
        [undefined, "clientUpdatesV2", `us_mo_123/custom_tasks/${TEST_UUID}`],
        [undefined, "clientUpdatesV2", "us_mo_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        ["test-doc-ref", { stateCode: "us_mo" }, { merge: true }],
        [
          "test-doc-ref",
          {
            deletedOn: "mock-timestamp",
          },
          { merge: true },
        ],
      ]);
    });
  });

  describe("customTasksCollection", () => {
    test("returns the snake_case subcollection ref for the recordId", () => {
      store.customTasksCollection("us_mo_123");
      // Firestore instance is undefined under vi.mock("firebase/firestore");
      // we only care about the path segments.
      expect(mockCollection).toHaveBeenCalledWith(
        undefined,
        "clientUpdatesV2",
        "us_mo_123",
        "custom_tasks",
      );
    });
  });
});
