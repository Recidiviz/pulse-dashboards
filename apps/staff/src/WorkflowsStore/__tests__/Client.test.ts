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

import dedent from "dedent";
import { deleteField } from "firebase/firestore";
import { configure, runInAction } from "mobx";
import { Mock } from "vitest";

import { ClientRecord } from "~datatypes";

import { MilestonesMessage } from "../../FirestoreStore";
import FirestoreStore from "../../FirestoreStore/FirestoreStore";
import { RootStore } from "../../RootStore";
import { APIStore } from "../../RootStore/APIStore";
import { TENANT_CONFIGS } from "../../tenants";
import { Client } from "../Client";
import { MilestonesMessageUpdateSubscription } from "../subscriptions/MilestonesMessageUpdateSubscription";
import { OTHER_KEY } from "../utils";

vi.mock("../subscriptions");
vi.mock("firebase/firestore", () => ({
  deleteField: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: function serverTimestamp() {
    return "2023-06-12";
  },
}));
vi.mock("../../FirestoreStore");

let mockRootStore: RootStore;
let rootStore: RootStore;
let testClient: Client;
let record: ClientRecord;
const mockDeleteField = deleteField as Mock;

function createTestUnit(milestones?: ClientRecord["milestones"]) {
  testClient = new Client(
    {
      ...record,
      ...(milestones || record.milestones),
      district: "DISTRICT1",
    },
    mockRootStore,
  );
}

describe("Client", () => {
  beforeEach(() => {
    configure({ safeDescriptors: false });
    vi.resetAllMocks();
    rootStore = new RootStore();
    vi.spyOn(
      rootStore.workflowsStore,
      "currentUserEmail",
      "get",
    ).mockReturnValue("staff@email.com");
    vi.spyOn(rootStore.workflowsStore, "systemConfigFor").mockReturnValue({
      search: [
        { searchType: "LOCATION", searchField: ["district"], searchTitle: "" },
        { searchType: "OFFICER", searchField: ["officerId"], searchTitle: "" },
      ],
    });
    vi.spyOn(rootStore.userStore, "userSurname", "get").mockReturnValue(
      "Smith",
    );
    vi.spyOn(rootStore.userStore, "userFullName", "get").mockReturnValue(
      "Firstname Smith",
    );
    vi.spyOn(rootStore.userStore, "userHash", "get").mockReturnValue(
      "123-hash",
    );
    mockDeleteField.mockReturnValue("delete field");
    mockRootStore = {
      ...rootStore,
      currentTenantId: "US_CA",
      firestoreStore: {
        updateMilestonesMessages: vi.fn(),
        doc: vi.fn(),
        collection: vi.fn(),
      } as unknown as FirestoreStore,
      apiStore: {
        postExternalSMSMessage: vi.fn(),
      } as unknown as APIStore,
    } as unknown as RootStore;
    record = {
      allEligibleOpportunities: [],
      officerId: "OFFICER1",
      personExternalId: "PERSON1",
      displayId: "dPERSON1",
      personName: { givenNames: "Real", surname: "Person" },
      pseudonymizedId: "anon1",
      recordId: "us_xx_PERSON1",
      stateCode: "US_XX",
      personType: "CLIENT",
      phoneNumber: "1112223333",
      custodialAuthority: "SUPERVISION_AUTHORITY",
      hasAnyInStateSentences: false,
      hasAnyOutOfStateSentences: false,
      milestones: [
        {
          type: "NO_VIOLATION_WITHIN_6_MONTHS",
          text: "6 months violation-free",
        },
      ],
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
    configure({ safeDescriptors: true });
  });

  describe("updateMilestonesTextMessage", () => {
    test("pendingMessage is updated", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage("This is a message");
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        message: dedent`Message from Agent Smith at CDCR:

          Hey Real! Congratulations on reaching this milestone:

          - 6 months violation-free

          This is a message`,
        stateCode: "US_XX",
        pendingMessage: "This is a message",
        status: "PENDING",
        userHash: "123-hash",
      });
    });
    test("additionalMessage is deleted", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage("", true);
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        message: dedent`Message from Agent Smith at CDCR:

          Hey Real! Congratulations on reaching this milestone:

          - 6 months violation-free`,
        stateCode: "US_XX",
        pendingMessage: mockDeleteField(),
        status: "PENDING",
        userHash: "123-hash",
      });
    });
    test("additionalMessage is not updated", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage();
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        message: dedent`Message from Agent Smith at CDCR:

          Hey Real! Congratulations on reaching this milestone:

          - 6 months violation-free`,
        stateCode: "US_XX",
        status: "PENDING",
        userHash: "123-hash",
      });
    });
    test("correct copy when more than one milestone", () => {
      createTestUnit();
      testClient.tenantMilestones = [
        {
          type: "NO_VIOLATION_WITHIN_6_MONTHS",
          text: "6 months violation-free",
        },
        {
          type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
          text: "Housing type is not transient",
        },
      ];
      testClient.updateMilestonesTextMessage();
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        message: dedent`Message from Agent Smith at CDCR:

          Hey Real! Congratulations on reaching these milestones:

          - 6 months violation-free
          - Housing type is not transient`,
        stateCode: "US_XX",
        status: "PENDING",
        userHash: "123-hash",
      });
    });
  });

  describe("updateMilestonesPhoneNumber", () => {
    test("phoneNumber is updated", () => {
      createTestUnit();
      testClient.updateMilestonesPhoneNumber("1112223333");
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        recipient: "1112223333",
        stateCode: "US_XX",
        status: "PENDING",
        userHash: "123-hash",
      });
    });

    test("phoneNumber is deleted", () => {
      createTestUnit();
      testClient.updateMilestonesPhoneNumber("", true);
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        recipient: mockDeleteField(),
        stateCode: "US_XX",
        status: "PENDING",
        userHash: "123-hash",
      });
    });
  });

  describe("updateMilestonesDeclineReasons", () => {
    test("reasons include other key", () => {
      createTestUnit();
      testClient.updateMilestonesDeclineReasons(
        ["MILESTONE_NOT_MET", OTHER_KEY],
        "Other reason here",
      );
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        status: "DECLINED",
        declinedReasons: {
          reasons: ["MILESTONE_NOT_MET", OTHER_KEY],
          otherReason: "Other reason here",
        },
      });
    });
    test("reasons do not include other key", () => {
      createTestUnit();
      testClient.updateMilestonesDeclineReasons(["MILESTONE_NOT_MET"]);
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        status: "DECLINED",
        declinedReasons: {
          reasons: ["MILESTONE_NOT_MET"],
          otherReason: "delete field",
        },
      });
    });
  });

  test("updateMilestonesStatus", () => {
    createTestUnit();
    testClient.updateMilestonesStatus("PENDING");
    expect(
      mockRootStore.firestoreStore.updateMilestonesMessages,
    ).toHaveBeenCalledWith("us_xx_PERSON1", {
      updated: {
        by: "staff@email.com",
        date: "2023-06-12",
      },
      status: "PENDING",
      userHash: "123-hash",
    });
  });

  test("undoMilestonesDeclined", () => {
    createTestUnit();
    testClient.undoMilestonesDeclined();
    expect(
      mockRootStore.firestoreStore.updateMilestonesMessages,
    ).toHaveBeenCalledWith("us_xx_PERSON1", {
      updated: {
        by: "staff@email.com",
        date: "2023-06-12",
      },
      status: "PENDING",
      declinedReasons: "delete field",
    });
  });

  describe("milestonesPhoneNumberDoesNotMatchClient", () => {
    test("phoneNumber matches", () => {
      createTestUnit();
      expect(
        testClient.milestonesPhoneNumberDoesNotMatchClient("1112223333"),
      ).toEqual(false);
    });

    test("phoneNumber does not match", () => {
      createTestUnit();
      expect(
        testClient.milestonesPhoneNumberDoesNotMatchClient("7778889999"),
      ).toEqual(true);
    });
  });

  describe("sendMilestonesMessage", () => {
    test("message is sent to backend successfully", async () => {
      createTestUnit();
      runInAction(() => {
        testClient.milestonesMessageUpdatesSubscription = {
          data: {
            status: "PENDING",
            updated: {
              by: "staff@email.com",
              date: "2023-06-12",
            } as unknown as MilestonesMessage["updated"],
            message: "Test message",
            recipient: record.phoneNumber,
          },
        } as MilestonesMessageUpdateSubscription<MilestonesMessage>;
      });
      await testClient.sendMilestonesMessage();
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages,
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        updated: {
          by: "staff@email.com",
          date: "2023-06-12",
        },
        status: "IN_PROGRESS",
        userHash: "123-hash",
      });

      expect(
        mockRootStore.apiStore.postExternalSMSMessage,
      ).toHaveBeenCalledWith({
        message: "Test message",
        recipientExternalId: record.personExternalId,
        recipientPhoneNumber: record.phoneNumber,
        senderId: "staff@email.com",
        userHash: "123-hash",
      });
    });

    test("there's an error sending the message", async () => {
      mockRootStore = {
        ...mockRootStore,
        apiStore: {
          postExternalSMSMessage: vi
            .fn()
            .mockRejectedValueOnce(new Error("backend error")),
        } as unknown as APIStore,
      } as unknown as RootStore;
      createTestUnit();
      runInAction(() => {
        testClient.milestonesMessageUpdatesSubscription = {
          data: {
            status: "PENDING",
            updated: {
              by: "staff@email.com",
              date: "2023-06-12",
            } as unknown as MilestonesMessage["updated"],

            message: "Test message",
            recipient: record.phoneNumber,
          },
        } as MilestonesMessageUpdateSubscription<MilestonesMessage>;
      });
      try {
        expect(await testClient.sendMilestonesMessage()).toThrow();

        expect(
          mockRootStore.firestoreStore.updateMilestonesMessages,
        ).toHaveBeenCalledWith("us_xx_PERSON1", {
          updated: {
            by: "staff@email.com",
            date: "2023-06-12",
          },
          status: "PENDING",
          userHash: "123-hash",
        });

        expect(
          mockRootStore.apiStore.postExternalSMSMessage,
        ).not.toHaveBeenCalled();
      } catch (e: any) {
        expect(e.message).toEqual("backend error");
      }
    });
  });

  test("searchIdValues", () => {
    createTestUnit();
    expect(testClient.searchIdValues).toEqual(["DISTRICT1", "OFFICER1"]);
  });

  describe("supervisedIn", () => {
    const tenantId = "US_CA";
    const tenantName = TENANT_CONFIGS[tenantId].name;

    beforeEach(() => {
      vi.spyOn(rootStore, "currentTenantId", "get").mockReturnValue(tenantId);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test.each<[string, string | undefined]>([
      ["SUPERVISION_AUTHORITY", tenantName],
      ["STATE_PRISON", tenantName],
      ["OTHER_STATE", "Other State"],
      ["FEDERAL_PRISON", "Federal Court"],
      ["OTHER_COUNTRY", "Other Country"],
      ["UNKNOWN", undefined],
    ])(
      "when custodialAuthority is %s → supervisedIn returns %s",
      (authority, expected) => {
        record.custodialAuthority = authority;
        createTestUnit();
        expect(testClient.supervisedIn).toEqual(expected);
      },
    );

    test("returns undefined when there is no currentTenantId", () => {
      const rootStore = {
        ...mockRootStore,
        currentTenantId: undefined,
      } as unknown as RootStore;
      testClient = new Client({ ...record }, rootStore);

      expect(testClient.supervisedIn).toBeUndefined();
    });
  });

  describe("sentencedBy", () => {
    const tenantId = "US_IA";
    const tenantName = TENANT_CONFIGS[tenantId].name;

    beforeEach(() => {
      vi.spyOn(rootStore, "currentTenantId", "get").mockReturnValue(tenantId);
      vi.spyOn(mockRootStore, "currentTenantId", "get").mockReturnValue(
        tenantId,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("no in-state and no out-of-state sentences", () => {
      record.hasAnyInStateSentences = false;
      record.hasAnyOutOfStateSentences = false;
      createTestUnit();

      expect(testClient.sentencedBy).toBeUndefined();
    });

    test("only in-state sentence", () => {
      record.hasAnyInStateSentences = true;
      record.hasAnyOutOfStateSentences = false;
      createTestUnit();

      expect(testClient.sentencedBy).toEqual(tenantName);
    });

    test("only out-of-state sentence", () => {
      record.hasAnyInStateSentences = false;
      record.hasAnyOutOfStateSentences = true;
      createTestUnit();

      expect(testClient.sentencedBy).toEqual("Other State");
    });

    test("both in-state and out-of-state sentences", () => {
      record.hasAnyInStateSentences = true;
      record.hasAnyOutOfStateSentences = true;
      createTestUnit();

      expect(testClient.sentencedBy).toEqual(`${tenantName} & Other State`);
    });

    test("returns undefined when there is no currentTenantId", () => {
      const rootStore = {
        ...mockRootStore,
        currentTenantId: undefined,
      } as unknown as RootStore;
      testClient = new Client({ ...record }, rootStore);

      expect(testClient.sentencedBy).toBeUndefined();
    });
  });
});
