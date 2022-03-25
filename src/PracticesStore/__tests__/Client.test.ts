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

import { computed, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  ClientRecord,
  subscribeToClientUpdates,
  updateCompliantReportingCompleted,
  updateCompliantReportingDenial,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import { mockClients, mockClientUpdate, mockOfficer } from "../__fixtures__";
import { Client } from "../Client";
import { OTHER_KEY } from "../PracticesStore";
import { dateToTimestamp } from "../utils";

let testObserver: IDisposer;

jest.mock("../../firestore");

const mockSubscribeToClientUpdates = subscribeToClientUpdates as jest.MockedFunction<
  typeof subscribeToClientUpdates
>;
const mockUpdateCompliantReportingDenial = updateCompliantReportingDenial as jest.MockedFunction<
  typeof updateCompliantReportingDenial
>;
const mockUpdateCompliantReportingCompleted = updateCompliantReportingCompleted as jest.MockedFunction<
  typeof updateCompliantReportingCompleted
>;

let clientRecord: ClientRecord;
let client: Client;
let rootStore: RootStore;

beforeEach(() => {
  [clientRecord] = mockClients;
  rootStore = new RootStore();
  client = new Client(clientRecord, rootStore);
});

afterEach(() => {
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("fetch client updates on demand", async () => {
  mockSubscribeToClientUpdates.mockImplementation((clientId, handler) => {
    expect(clientId).toBe(client.id);
    handler(mockClientUpdate);
    return jest.fn();
  });

  // simulate a client profile page observing updates
  testObserver = keepAlive(computed(() => [client.updates]));

  expect(mockSubscribeToClientUpdates).toHaveBeenCalled();

  await when(() => client.updates !== undefined);
});

test("fines and fees status", () => {
  client.feeExemptions = "exemption test";

  expect(client.finesAndFeesStatus).toBe("exemption test");

  client.feeExemptions = undefined;

  expect(client.finesAndFeesStatus).toBe("Fees paid in full");

  client.currentBalance = 250.12;

  expect(client.finesAndFeesStatus).toBe("Last payment: $50.00 on 11/15/21");

  client.lastPaymentAmount = undefined;
  client.lastPaymentDate = undefined;

  expect(client.finesAndFeesStatus).toBe("Current balance: $250.12");
});

test("set compliant reporting ineligible", () => {
  rootStore.practicesStore.user = mockOfficer;

  const reasons = ["test1", "test2"];
  client.setCompliantReportingDenialReasons(reasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id,
    { reasons },
    { otherReason: true }
  );

  expect(mockUpdateCompliantReportingCompleted).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id,
    true
  );
});

test("ineligible for other reason", () => {
  rootStore.practicesStore.user = mockOfficer;

  const reasons = ["test1", OTHER_KEY];
  client.setCompliantReportingDenialReasons(reasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id,
    { reasons },
    undefined
  );

  const newReasons = reasons.slice(0, 1);

  client.setCompliantReportingDenialReasons(newReasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id,
    { reasons: newReasons },
    // this will delete the related field if reasons do not include "other"
    { otherReason: true }
  );
});

test("set compliant reporting other reason", () => {
  rootStore.practicesStore.user = mockOfficer;

  const otherReason = "some other reason";
  client.setCompliantReportingDenialOtherReason(otherReason);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id,
    { otherReason }
  );
});

test("print client reporting form", () => {
  rootStore.practicesStore.user = mockOfficer;

  expect(client.formIsPrinting).toBe(false);

  client.printCurrentForm();

  expect(client.formIsPrinting).toBe(true);
});

test("mark client as completed when printing form", () => {
  rootStore.practicesStore.user = mockOfficer;

  client.printCurrentForm();

  expect(mockUpdateCompliantReportingCompleted).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.id
  );
});

test("don't record a completion if user is ineligible", async () => {
  rootStore.practicesStore.user = mockOfficer;

  mockSubscribeToClientUpdates.mockImplementation((clientId, handleResults) => {
    handleResults({
      compliantReporting: {
        denial: {
          reasons: ["test"],
          updated: { by: "test", date: dateToTimestamp("2022-02-01") },
        },
      },
    });
    return jest.fn();
  });

  // ensure the update data has been hydrated
  await when(() => client.updates !== undefined);

  client.printCurrentForm();

  expect(mockUpdateCompliantReportingCompleted).not.toHaveBeenCalled();
});
