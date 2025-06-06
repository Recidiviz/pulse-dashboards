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

import { connectAuthEmulator } from "firebase/auth";
import {
  deleteField,
  doc,
  DocumentReference,
  PartialWithFieldValue,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import tk from "timekeeper";
import { Mock } from "vitest";

import { isOfflineMode } from "~client-env-utils";

import { fetchFirebaseToken } from "../../api/fetchFirebaseToken";
import { RootStore } from "../../RootStore";
import { UserAppMetadata } from "../../RootStore/types";
import { Opportunity } from "../../WorkflowsStore";
import FirestoreStore from "../FirestoreStore";
import {
  FormUpdate,
  MilestonesMessage,
  OpportunityUpdateWithForm,
  SupervisionTaskUpdate,
} from "../types";

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("~client-env-utils");

const { VITE_TEST_ENV } = vi.hoisted(() => {
  const VITE_TEST_ENV = import.meta.env.VITE_TEST_ENV;
  // Delete test env var to test firestore emulator connection
  import.meta.env.VITE_TEST_ENV = "";

  return { VITE_TEST_ENV };
});

const mockFetchFirebaseToken = fetchFirebaseToken as Mock;
const mockConnectAuthEmulator = connectAuthEmulator as Mock;
const mockSetDoc = setDoc as Mock;
const mockDoc = doc as Mock;
const mockDeleteField = deleteField as Mock;
const mockServerTimestamp = serverTimestamp as Mock;

vi.mock("../../api/fetchFirebaseToken", () => {
  return {
    fetchFirebaseToken: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") }),
      ),
    fetchImpersonatedFirebaseToken: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") }),
      ),
  };
});

afterAll(() => {
  import.meta.env.VITE_TEST_ENV = VITE_TEST_ENV;
});

describe("FirestoreStore", () => {
  let store: FirestoreStore;
  let mockRootStore: RootStore;
  const opp: Opportunity = {
    person: { recordId: "us_id_123" },
    firestoreUpdateDocId: "LSU",
  } as unknown as Opportunity;

  beforeEach(() => {
    vi.clearAllMocks();
    tk.freeze(new Date("2022-01-01"));
    mockRootStore = {
      userStore: { user: { email: "user@domain.gov" } },
      tenantStore: {
        currentTenantId: "us_ca",
      },
    } as unknown as RootStore;
    store = new FirestoreStore({ rootStore: mockRootStore });
    vi.mocked(writeBatch).mockImplementation(() => ({
      // mocking set with setDoc lets us assert that docs have been set without caring if
      // they're batched or not.
      // @ts-ignore: set() is really a chainable method and setDoc() returns a promise instead
      set: setDoc,
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    }));
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
      const isOfflineModeMock = isOfflineMode as Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_ca",
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call connectAuthEmulator for offline user", async () => {
      const isOfflineModeMock = isOfflineMode as Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_ca",
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockConnectAuthEmulator).toBeCalled();
    });
  });

  describe("authenticateImpersonatedUser", () => {
    const impersonatedEmail = "test@email.com";
    const impersonatedAppMetadata: UserAppMetadata = {
      stateCode: "us_tn",
      routes: {
        workflowsFacilities: true,
      },
    };
    const auth0Token = "token123";

    test("Should fetch impersonated token", async () => {
      await store.authenticate(
        auth0Token,
        impersonatedAppMetadata,
        impersonatedEmail,
      );
      expect(mockFetchFirebaseToken).toBeCalledWith(auth0Token, {
        impersonatedEmail,
        impersonatedStateCode: "us_tn",
      });
    });
  });

  describe("updateDocument", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(console, "log");
    });

    test("Does not call setDoc when user is impersonating", () => {
      mockRootStore = {
        ...mockRootStore,
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
        ...mockRootStore,
        isImpersonating: false,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateDocument({} as DocumentReference, {});
      expect(mockSetDoc).toBeCalled();
    });
  });

  describe("updateClientUpdatesV2Document", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(console, "log");
    });

    test("Does not call updateDocument/updatePerson when user is impersonating", () => {
      mockRootStore = {
        ...mockRootStore,
        isImpersonating: true,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateClientUpdatesV2Document(
        "testDocument/recordId",
        { path: "testDocument/recordId" } as DocumentReference,
        {},
      );
      expect(mockSetDoc).not.toBeCalled();
      // eslint-disable-next-line no-console
      expect(console.log).toBeCalledWith(
        "[IMPERSONATOR] Skipping update for: testDocument/recordId with updates {}",
      );
    });

    test("Does not call updateDocument/updatePerson for Recidiviz user in prod", () => {
      mockRootStore = {
        ...mockRootStore,
        userStore: {
          ...mockRootStore.userStore,
          isRecidivizUser: true,
        },
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      vi.stubEnv("VITE_DEPLOY_ENV", "production");

      store.updateClientUpdatesV2Document(
        "testDocument/recordId",
        { path: "testDocument/recordId" } as DocumentReference,
        {},
      );
      expect(mockSetDoc).not.toBeCalled();
      // eslint-disable-next-line no-console
      expect(console.log).toBeCalledWith(
        "Recidiviz user in prod; Skipping update for: testDocument/recordId with updates {}",
      );

      vi.unstubAllEnvs();
    });

    test("Calls setDoc when user is not impersonating", () => {
      mockRootStore = {
        ...mockRootStore,
        isImpersonating: false,
        userStore: { ...mockRootStore.userStore, isRecidivizUser: false },
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateClientUpdatesV2Document("", {} as DocumentReference, {});
      expect(mockSetDoc).toBeCalled();
    });
  });

  describe("firestore updates", () => {
    beforeEach(() => {
      mockRootStore = {
        ...mockRootStore,
        isImpersonating: false,
        userStore: {
          ...mockRootStore.userStore,
          isRecidivizUser: false,
        },
      } as unknown as RootStore;
      mockDoc.mockReturnValue("test-doc-ref");
      mockDeleteField.mockReturnValue("mock-delete-fn");
      mockServerTimestamp.mockReturnValue("mock-timestamp");
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
      await store.deleteOpportunityDenialAndSnooze(opp);
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
      await store.updateOpportunityAutoSnooze(opp, update, false);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123/clientOpportunityUpdates/LSU",
      ]);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123",
      ]);

      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        { autoSnooze: update },
        {
          merge: true,
        },
      ]);
    });

    test("updateOpportunityAutoSnooze with delete", async () => {
      const update = {
        snoozeUntil: "2024-01-01",
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityAutoSnooze(opp, update, true);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123/clientOpportunityUpdates/LSU",
      ]);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123",
      ]);

      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        { autoSnooze: "mock-delete-fn" },
        {
          merge: true,
        },
      ]);
    });

    test("updateOpportunityManualSnooze", async () => {
      const update = {
        snoozeForDays: 10,
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityManualSnooze(opp, update, false);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123/clientOpportunityUpdates/LSU",
      ]);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123",
      ]);

      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        { manualSnooze: update },
        {
          merge: true,
        },
      ]);
    });

    test("updateOpportunityManualSnooze delete field", async () => {
      const update = {
        snoozeForDays: 10,
        snoozedBy: "test-email",
        snoozedOn: "2023-11-10",
      };
      await store.updateOpportunityManualSnooze(opp, update, true);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123/clientOpportunityUpdates/LSU",
      ]);
      expect(mockDoc.mock.calls).toContainEqual([
        undefined,
        "clientUpdatesV2",
        "us_id_123",
      ]);

      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        { manualSnooze: "mock-delete-fn" },
        {
          merge: true,
        },
      ]);
    });

    test("updateOpportunitySubmitted", async () => {
      await store.updateOpportunitySubmitted("test-email", opp);
      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        {
          submitted: {
            by: "test-email",
            date: "mock-timestamp",
          },
        },
        {
          merge: true,
        },
      ]);
    });

    test("deleteOpportunitySubmitted", async () => {
      await store.deleteOpportunitySubmitted(opp);
      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        {
          submitted: "mock-delete-fn",
        },
        {
          merge: true,
        },
      ]);
    });

    test("updateOpportunityActionHistory", async () => {
      const update = [
        {
          type: "DENIAL" as any,
          actionPlan: "test-plan",
          denialReasons: ["reason1", "reason2"],
          requestedSnoozeLength: 30,
          by: "test-officer-email",
          date: mockServerTimestamp(),
          supervisorReponse: undefined,
        },
      ];
      await store.updateOpportunityActionHistory(opp, update);
      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        {
          actionHistory: [
            {
              by: "test-officer-email",
              date: "mock-timestamp",
              type: "DENIAL",
              actionPlan: "test-plan",
              denialReasons: ["reason1", "reason2"],
              requestedSnoozeLength: 30,
            },
          ],
        },
        {
          merge: true,
        },
      ]);
    });

    test("deleteOpportunityActionHistory", async () => {
      await store.deleteOpportunityActionHistory(opp);
      expect(mockSetDoc.mock.calls).toContainEqual([
        "test-doc-ref",
        {
          actionHistory: "mock-delete-fn",
        },
        {
          merge: true,
        },
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

    test("updateForm", async () => {
      const update = { testField: "testValue" };
      const formUpdate: PartialWithFieldValue<FormUpdate<Record<string, any>>> =
        {
          data: {
            update,
          },
        };

      await store.updateForm("us_mi_123", formUpdate, "testForm-common");
      expect(mockDoc.mock.calls).toEqual([
        [
          undefined,
          "clientUpdatesV2",
          "us_mi_123/clientFormUpdates/testForm-common",
        ],
        [undefined, "clientUpdatesV2", "us_mi_123"],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { stateCode: "us_mi" },
          {
            merge: true,
          },
        ],
        [
          "test-doc-ref",
          { ...formUpdate },
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
      await store.updateOpportunity(opp, opportunityUpdate);
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
      const update = {
        stateCode: "us_ca",
        selectedSearchIds,
      };
      store.updateSelectedSearchIds(selectedSearchIds);
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

    test("updateDismissedOpportunityNotificationIds", () => {
      const dismissedOpportunityNotificationIds = [
        "july_2024_update",
        "june_2023_tip",
      ];
      const userEmail = "user@domain.gov";
      store.updateDismissedOpportunityNotificationIds(
        dismissedOpportunityNotificationIds,
      );
      expect(mockDoc.mock.calls).toEqual([
        [undefined, "userUpdates", userEmail],
      ]);

      expect(mockSetDoc.mock.calls).toEqual([
        [
          "test-doc-ref",
          { dismissedOpportunityNotificationIds },
          {
            merge: true,
          },
        ],
      ]);
    });
  });

  describe("updateSnoozeCompanions", () => {
    test("Should verify if a snooze triggers companion snoozes and update snooze companions with provided changes", async () => {
      const mockCompanionOpportunities = [
        { type: "type1" },
        { type: "type2" },
      ] as unknown as Opportunity[];

      const mockOpportunity = {
        config: {
          snoozeCompanionOpportunityTypes: ["type1", "type2"],
        },
        snoozeCompanionOpportunities: mockCompanionOpportunities,
      } as unknown as Opportunity;

      store = new FirestoreStore({ rootStore: mockRootStore });

      const updateSpy = vi
        .spyOn(store, "updateOpportunity")
        .mockResolvedValue();

      const changes = {
        manualSnooze: {
          snoozeForDays: 7,
          snoozedBy: "test-user",
          snoozedOn: "2025-04-10",
        },
      };

      await store.updateSnoozeCompanions(mockOpportunity, changes);

      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith(
        mockCompanionOpportunities[0],
        changes,
      );
      expect(updateSpy).toHaveBeenCalledWith(
        mockCompanionOpportunities[1],
        changes,
      );
    });

    test("Should update companion snoozes when updateOpportunityAutoSnooze is called", async () => {
      const mockCompanionOpportunities = [
        { type: "type1" },
        { type: "type2" },
      ] as unknown as Opportunity[];

      const mockOpportunity = {
        config: {
          snoozeCompanionOpportunityTypes: ["type1", "type2"],
        },
        snoozeCompanionOpportunities: mockCompanionOpportunities,
      } as unknown as Opportunity;

      store = new FirestoreStore({ rootStore: mockRootStore });

      const updateSpy = vi
        .spyOn(store, "updateOpportunity")
        .mockResolvedValue();

      const snoozeUpdate = {
        snoozeUntil: "2025-04-20",
        snoozedBy: "test-user",
        snoozedOn: "2025-04-10",
      };

      await store.updateOpportunityAutoSnooze(
        mockOpportunity,
        snoozeUpdate,
        false,
      );

      expect(updateSpy).toHaveBeenCalledTimes(3); // 1 for the main opportunity, 2 for companions
      expect(updateSpy).toHaveBeenCalledWith(mockCompanionOpportunities[0], {
        autoSnooze: snoozeUpdate,
      });
      expect(updateSpy).toHaveBeenCalledWith(mockCompanionOpportunities[1], {
        autoSnooze: snoozeUpdate,
      });
    });

    test("Should update companion snoozes when updateOpportunityManualSnooze is called", async () => {
      const mockCompanionOpportunities = [
        { type: "type1" },
      ] as unknown as Opportunity[];

      const mockOpportunity = {
        config: {
          snoozeCompanionOpportunityTypes: ["type1"],
        },
        snoozeCompanionOpportunities: mockCompanionOpportunities,
      } as unknown as Opportunity;

      store = new FirestoreStore({ rootStore: mockRootStore });

      const updateSpy = vi
        .spyOn(store, "updateOpportunity")
        .mockResolvedValue();

      const snoozeUpdate = {
        snoozeForDays: 10,
        snoozedBy: "test-user",
        snoozedOn: "2025-04-10",
      };

      await store.updateOpportunityManualSnooze(
        mockOpportunity,
        snoozeUpdate,
        false,
      );

      expect(updateSpy).toHaveBeenCalledTimes(2); // 1 for the main opportunity, 1 for the companion
      expect(updateSpy).toHaveBeenCalledWith(mockCompanionOpportunities[0], {
        manualSnooze: snoozeUpdate,
      });
    });

    test("Should update companion snoozes when updateOpportunityDenial is called", async () => {
      const mockCompanionOpportunities = [
        { type: "type1" },
        { type: "type2" },
      ] as unknown as Opportunity[];

      const mockOpportunity = {
        config: {
          snoozeCompanionOpportunityTypes: ["type1", "type2"],
        },
        snoozeCompanionOpportunities: mockCompanionOpportunities,
      } as unknown as Opportunity;

      store = new FirestoreStore({ rootStore: mockRootStore });

      const updateSpy = vi
        .spyOn(store, "updateOpportunity")
        .mockResolvedValue();

      const denialUpdate = { reasons: ["reason1"], otherReason: "other" };
      mockServerTimestamp.mockReturnValue("mock-timestamp");

      await store.updateOpportunityDenial(
        "test-user",
        mockOpportunity,
        denialUpdate,
      );

      expect(updateSpy).toHaveBeenCalledTimes(3); // 1 for the main opportunity, 2 for companions
      expect(updateSpy).toHaveBeenCalledWith(mockCompanionOpportunities[0], {
        denial: {
          ...denialUpdate,
          updated: { by: "test-user", date: "mock-timestamp" },
        },
      });
      expect(updateSpy).toHaveBeenCalledWith(mockCompanionOpportunities[1], {
        denial: {
          ...denialUpdate,
          updated: { by: "test-user", date: "mock-timestamp" },
        },
      });
    });
  });
});
