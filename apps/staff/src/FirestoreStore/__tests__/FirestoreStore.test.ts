// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
/* eslint-disable import/first */
// Delete test env var to test firestore emulator connection
delete process.env.REACT_APP_TEST_ENV;
import { connectAuthEmulator } from "firebase/auth";
import {
  deleteField,
  doc,
  DocumentReference,
  PartialWithFieldValue,
  setDoc,
} from "firebase/firestore";
import tk from "timekeeper";

import {
  fetchFirebaseToken,
  fetchImpersonatedFirebaseToken,
} from "../../api/fetchFirebaseToken";
import { RootStore } from "../../RootStore";
import { UserAppMetadata } from "../../RootStore/types";
import { isOfflineMode } from "../../utils/isOfflineMode";
import FirestoreStore from "../FirestoreStore";
import {
  MilestonesMessage,
  OpportunityUpdateWithForm,
  SupervisionTaskUpdate,
} from "../types";

jest.mock("firebase/auth");
jest.mock("firebase/firestore");
jest.mock("../../utils/isOfflineMode");

const mockFetchFirebaseToken = fetchFirebaseToken as jest.Mock;
const mockFetchImpersonatedFirebaseToken =
  fetchImpersonatedFirebaseToken as jest.Mock;
const mockConnectAuthEmulator = connectAuthEmulator as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockDeleteField = deleteField as jest.Mock;
const mockGetTokenSilently = jest.fn();

jest.mock("../../api/fetchFirebaseToken", () => {
  return {
    fetchFirebaseToken: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") }),
      ),
    fetchImpersonatedFirebaseToken: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") }),
      ),
  };
});

describe("FirestoreStore", () => {
  let store: FirestoreStore;
  let mockRootStore = {} as RootStore;

  beforeEach(() => {
    jest.clearAllMocks();
    tk.freeze(new Date("2022-01-01"));
    store = new FirestoreStore({ rootStore: mockRootStore });
  });

  afterEach(() => {
    tk.reset();
  });

  describe("authenticate", () => {
    test("Should call /token if user can access workflows supervision", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflowsSupervision: true,
        },
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call /token if user can access workflows facilities", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflowsFacilities: true,
        },
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should not call /token if user cannot access workflows", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflowsSupervision: false,
        },
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).not.toBeCalled();
    });
    test("Should call /token for recidiviz user", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "recidiviz",
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call /token for offline user", async () => {
      const isOfflineModeMock = isOfflineMode as jest.Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      await store.authenticate(auth0Token);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call connectAuthEmulator for offline user", async () => {
      const isOfflineModeMock = isOfflineMode as jest.Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      await store.authenticate(auth0Token);
      expect(mockConnectAuthEmulator).toBeCalled();
    });
  });

  describe("authenticateImpersonatedUser", () => {
    const impersonatedEmail = "test@email.com";
    const impersonatedStateCode = "US_TN";

    test("Should fetch impersonated token if recidiviz user", async () => {
      const appMetadata: UserAppMetadata = {
        stateCode: "recidiviz",
        routes: {
          workflowsSupervision: true,
        },
      };
      await store.authenticateImpersonatedUser(
        impersonatedEmail,
        impersonatedStateCode,
        mockGetTokenSilently,
        appMetadata,
      );
      expect(mockFetchImpersonatedFirebaseToken).toBeCalled();
    });

    test("Should not fetch impersonated if user is not recidiviz", async () => {
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflowsSupervision: false,
        },
      };
      await store.authenticateImpersonatedUser(
        impersonatedEmail,
        impersonatedStateCode,
        mockGetTokenSilently,
        appMetadata,
      );
      expect(mockFetchImpersonatedFirebaseToken).not.toBeCalled();
    });
  });

  describe("updateDocument", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, "log");
    });

    test("Does not call setDoc when user is impersonating", () => {
      mockRootStore = {
        isImpersonating: true,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateDocument(
        { path: "testDocument/recordId" } as DocumentReference,
        {},
      );
      expect(mockSetDoc).not.toBeCalled();
      // eslint-disable-next-line no-console
      expect(console.log).toBeCalledWith(
        "[IMPERSONATOR] Skipping update for: testDocument/recordId with updates {}",
      );
    });

    test("Calls setDoc when user is not impersonating", () => {
      mockRootStore = {
        isImpersonating: false,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateDocument({} as DocumentReference, {});
      expect(mockSetDoc).toBeCalled();
    });
  });

  describe("firestore updates", () => {
    beforeEach(() => {
      mockRootStore = {
        isImpersonating: false,
      } as unknown as RootStore;
      mockDoc.mockReturnValue("test-doc-ref");
      mockDeleteField.mockReturnValue("mock-delete-fn");
      store = new FirestoreStore({ rootStore: mockRootStore });
    });

    test("updateSupervisionTask", async () => {
      const taskUpdate: SupervisionTaskUpdate = {
        homeVisit: {
          snoozedBy: "test@test.org",
          snoozeForDays: 7,
          snoozedOn: "2023-01-01",
        },
      };
      await store.updateSupervisionTask("us_ca_123", taskUpdate);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_ca" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { ...taskUpdate },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("deleteOpportunityDenialAndSnooze", async () => {
      await store.deleteOpportunityDenialAndSnooze("LSU", "us_id_123");
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          {
            denial: "mock-delete-fn",
            autoSnooze: "mock-delete-fn",
            manualSnooze: "mock-delete-fn",
          },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateOpportunityAutoSnooze", async () => {
      const update = {
        snoozeUntil: "2024-01-01",
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityAutoSnooze(
        "LSU",
        "us_id_123",
        update,
        false,
      );
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { autoSnooze: update },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateOpportunityAutoSnooze with delete", async () => {
      const update = {
        snoozeUntil: "2024-01-01",
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityAutoSnooze("LSU", "us_id_123", update, true);
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { autoSnooze: "mock-delete-fn" },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateOpportunityManualSnooze", async () => {
      const update = {
        snoozeForDays: 10,
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityManualSnooze(
        "LSU",
        "us_id_123",
        update,
        false,
      );
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { manualSnooze: update },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateOpportunityManualSnooze", async () => {
      const update = {
        snoozeForDays: 10,
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityManualSnooze(
        "LSU",
        "us_id_123",
        update,
        true,
      );
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { manualSnooze: "mock-delete-fn" },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateMilestonesMessages", async () => {
      const milestonesMessagesUpdate: PartialWithFieldValue<MilestonesMessage> =
        {
          status: "IN_PROGRESS",
        };
      await store.updateMilestonesMessages(
        "us_ca_123",
        milestonesMessagesUpdate,
      );
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_ca_123/milestonesMessages/milestones_01_2022",
        ],
        [undefined, "clientUpdatesV2", "us_ca_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_ca" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { ...milestonesMessagesUpdate },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateOpportunity", async () => {
      const opportunityUpdate: PartialWithFieldValue<
        OpportunityUpdateWithForm<Record<string, any>>
      > = {
        completed: {
          update: {},
        },
      };
      await store.updateOpportunity("LSU", "us_id_123", opportunityUpdate);
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_id_123/clientOpportunityUpdates/LSU",
        ],
        [undefined, "clientUpdatesV2", "us_id_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_id" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { ...opportunityUpdate },
          {
            merge: true,
          },
        ],
      ]);
    });

    test("updateSelectedSearchIds", () => {
      const selectedSearchIds = ["id1", "id2"];
      const userEmail = "user@domain.gov";
      const stateCode = "us_ca";
      const update = {
        stateCode: "us_ca",
        selectedSearchIds,
        selectedOfficerIds: "mock-delete-fn",
      };
      store.updateSelectedSearchIds(userEmail, stateCode, selectedSearchIds);
      expect(mockDoc.mock.calls).toEqual([
        [undefined, "userUpdates", userEmail],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          update,
          {
            merge: true,
          },
        ],
      ]);
    });
  });
});
