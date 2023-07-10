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

import dedent from "dedent";
import { deleteField } from "firebase/firestore";
import { runInAction } from "mobx";

import { ClientRecord, StaffRecord } from "../../FirestoreStore";
import FirestoreStore from "../../FirestoreStore/FirestoreStore";
import { RootStore } from "../../RootStore";
import { Client } from "../Client";

jest.mock("../subscriptions");
jest.mock("firebase/firestore", () => ({
  deleteField: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: function serverTimestamp() {
    return "2023-06-12";
  },
}));
jest.mock("../../FirestoreStore");

let mockRootStore: RootStore;
let rootStore: RootStore;
let testClient: Client;
let record: ClientRecord;
const mockDeleteField = deleteField as jest.Mock;

function createTestUnit() {
  testClient = new Client(record, mockRootStore);
}

describe("Client", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    rootStore = new RootStore();
    mockDeleteField.mockReturnValue("delete field");
    runInAction(() => {
      rootStore.workflowsStore.officersSubscription.data = [
        {
          id: "OFFICER1",
          givenNames: "Officer",
          surname: "Name",
        } as StaffRecord,
      ];
      rootStore.workflowsStore.officersSubscription.isHydrated = true;
    });
    mockRootStore = {
      ...rootStore,
      currentTenantId: "US_CA",
      firestoreStore: {
        updateMilestonesMessages: jest.fn(),
        db: jest.fn(),
      } as unknown as FirestoreStore,
    } as unknown as RootStore;
    record = {
      allEligibleOpportunities: [],
      officerId: "OFFICER1",
      personExternalId: "PERSON1",
      personName: { givenNames: "Real", surname: "Person" },
      pseudonymizedId: "anon1",
      recordId: "us_xx_PERSON1",
      stateCode: "US_XX",
      personType: "CLIENT",
      phoneNumber: "1112223333",
      milestones: [
        { type: "MONTHS_WITHOUT_VIOLATION", text: "6 months violation-free" },
      ],
    };
  });

  describe("updateMilestonesTextMessage", () => {
    test("additionalMessage is updated", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage("This is a message");
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        lastUpdated: "2023-06-12",
        messageDetails: {
          message: dedent`Message from Officer Name at CDCR:

          Hey Real Person! Congratulations on reaching these milestones:

          - 6 months violation-free

          This is a message`,
          stateCode: "US_XX",
          timestamp: "2023-06-12",
        },
        pendingMessage: "This is a message",
        status: "PENDING",
      });
    });
    test("additionalMessage is deleted", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage("", true);
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        lastUpdated: "2023-06-12",
        messageDetails: {
          message: dedent`Message from Officer Name at CDCR:

          Hey Real Person! Congratulations on reaching these milestones:

          - 6 months violation-free`,
          stateCode: "US_XX",
          timestamp: "2023-06-12",
        },
        pendingMessage: mockDeleteField(),
        status: "PENDING",
      });
    });
    test("additionalMessage is not updated", () => {
      createTestUnit();
      testClient.updateMilestonesTextMessage();
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        lastUpdated: "2023-06-12",
        messageDetails: {
          message: dedent`Message from Officer Name at CDCR:

          Hey Real Person! Congratulations on reaching these milestones:

          - 6 months violation-free`,
          stateCode: "US_XX",
          timestamp: "2023-06-12",
        },
        status: "PENDING",
      });
    });
  });
  describe("updateMilestonesPhoneNumber", () => {
    test("phoneNumber is updated", () => {
      createTestUnit();
      testClient.updateMilestonesPhoneNumber("1112223333");
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        lastUpdated: "2023-06-12",
        messageDetails: {
          recipient: "1112223333",
          stateCode: "US_XX",
          timestamp: "2023-06-12",
        },
        status: "PENDING",
      });
    });
    test("phoneNumber is deleted", () => {
      createTestUnit();
      testClient.updateMilestonesPhoneNumber("", true);
      expect(
        mockRootStore.firestoreStore.updateMilestonesMessages
      ).toHaveBeenCalledWith("us_xx_PERSON1", {
        lastUpdated: "2023-06-12",
        messageDetails: {
          recipient: mockDeleteField(),
          stateCode: "US_XX",
          timestamp: "2023-06-12",
        },
        status: "PENDING",
      });
    });
  });

  describe("milestonesPhoneNumberDoesNotMatchClient", () => {
    test("phoneNumber matches", () => {
      createTestUnit();
      expect(
        testClient.milestonesPhoneNumberDoesNotMatchClient("1112223333")
      ).toEqual(false);
    });

    test("phoneNumber does not match", () => {
      createTestUnit();
      expect(
        testClient.milestonesPhoneNumberDoesNotMatchClient("7778889999")
      ).toEqual(true);
    });
  });
});
