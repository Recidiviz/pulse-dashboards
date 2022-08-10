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

import { computed, configure, observable, set, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  trackReferralFormViewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../../analytics";
import { transform } from "../../core/Paperwork/US_TN/Transformer";
import {
  subscribeToCompliantReportingReferral,
  updateCompliantReportingDenial,
  updateOpportunityCompleted,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import { eligibleClient, mockOfficer } from "../__fixtures__";
import { Client } from "../Client";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../CompliantReportingReferralRecord";
import { dateToTimestamp } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";

let testObserver: IDisposer;

jest.mock("../../analytics");
jest.mock("../../firestore");
jest.mock("../../core/Paperwork/US_TN/Transformer");

const mockTransform = transform as jest.MockedFunction<typeof transform>;
const mockSubscribeToCompliantReportingReferral = subscribeToCompliantReportingReferral as jest.MockedFunction<
  typeof subscribeToCompliantReportingReferral
>;
const mockUpdateCompliantReportingDenial = updateCompliantReportingDenial as jest.MockedFunction<
  typeof updateCompliantReportingDenial
>;
const mockUpdateOpportunityCompleted = updateOpportunityCompleted as jest.MockedFunction<
  typeof updateOpportunityCompleted
>;

let client: Client;
let rootStore: RootStore;
let mockUpdate: typeof Client.prototype["opportunityUpdates"];

beforeEach(() => {
  // this lets us spy on mobx computed getters
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  client = new Client(eligibleClient, rootStore);

  // update this to simulate fetched data and pipe it through MobX
  mockUpdate = observable({});
  jest
    .spyOn(Client.prototype, "opportunityUpdates", "get")
    .mockReturnValue(computed(() => mockUpdate).get());
});

afterEach(() => {
  configure({ safeDescriptors: true });
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("fetch CompliantReportingReferral uses recordId", async () => {
  const record = { poFirstName: "Bob" } as CompliantReportingReferralRecord;
  mockTransform.mockImplementation(
    (_: Client, data: CompliantReportingReferralRecord) => {
      return (data as unknown) as Partial<TransformedCompliantReportingReferral>;
    }
  );

  mockSubscribeToCompliantReportingReferral.mockImplementation(
    (recordId, handler) => {
      expect(recordId).toBe(client.recordId);
      handler(record);
      return jest.fn();
    }
  );

  testObserver = keepAlive(
    computed(() => [client.prefilledCompliantReferralForm])
  );

  await when(
    () => client.prefilledCompliantReferralForm.poFirstName !== undefined
  );

  expect(mockSubscribeToCompliantReportingReferral).toHaveBeenCalled();
});

test("set compliant reporting ineligible", async () => {
  rootStore.workflowsStore.user = mockOfficer;

  const reasons = ["test1", "test2"];
  await client.setCompliantReportingDenialReasons(reasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    { reasons },
    { otherReason: true }
  );

  expect(mockUpdateOpportunityCompleted).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    "compliantReporting",
    true
  );
  expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "DENIED",
    opportunityType: "compliantReporting",
    deniedReasons: reasons,
  });
});

test("ineligible for other reason", () => {
  rootStore.workflowsStore.user = mockOfficer;

  const reasons = ["test1", OTHER_KEY];
  client.setCompliantReportingDenialReasons(reasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    { reasons },
    undefined
  );

  const newReasons = reasons.slice(0, 1);

  client.setCompliantReportingDenialReasons(newReasons);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    { reasons: newReasons },
    // this will delete the related field if reasons do not include "other"
    { otherReason: true }
  );
});

test("set compliant reporting other reason", () => {
  rootStore.workflowsStore.user = mockOfficer;

  const otherReason = "some other reason";
  client.setCompliantReportingDenialOtherReason(otherReason);

  expect(mockUpdateCompliantReportingDenial).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    { otherReason }
  );
});

test("clear denial reasons", async () => {
  rootStore.workflowsStore.user = mockOfficer;

  const reasons = ["test1", OTHER_KEY];
  await client.setCompliantReportingDenialReasons(reasons);

  await client.setCompliantReportingDenialReasons([]);

  expect(trackSetOpportunityStatus).toHaveBeenCalledTimes(2);
  expect(trackSetOpportunityStatus).toHaveBeenLastCalledWith({
    clientId: client.pseudonymizedId,
    status: "IN_PROGRESS",
    opportunityType: "compliantReporting",
  });
});

test("print client reporting form", () => {
  rootStore.workflowsStore.user = mockOfficer;

  expect(client.formIsPrinting).toBe(false);

  client.printReferralForm("compliantReporting");

  expect(client.formIsPrinting).toBe(true);
});

test("mark client as completed when printing form", () => {
  rootStore.workflowsStore.user = mockOfficer;

  client.printReferralForm("compliantReporting");

  expect(mockUpdateOpportunityCompleted).toHaveBeenCalledWith(
    mockOfficer.info.email,
    client.recordId,
    "compliantReporting"
  );
  expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "COMPLETED",
    opportunityType: "compliantReporting",
  });
});

test("don't record a completion if user is ineligible", () => {
  rootStore.workflowsStore.user = mockOfficer;

  set(mockUpdate, {
    compliantReporting: {
      denial: {
        reasons: ["test"],
        updated: { by: "test", date: dateToTimestamp("2022-02-01") },
      },
    },
  });

  client.printReferralForm("compliantReporting");

  expect(mockUpdateOpportunityCompleted).not.toHaveBeenCalled();
  expect(trackSetOpportunityStatus).not.toHaveBeenCalled();
});

test("compliant reporting review status", () => {
  expect(client.opportunities.compliantReporting?.statusMessageShort).toBe(
    "Needs referral"
  );

  set(mockUpdate, {
    compliantReporting: {
      denial: {
        reasons: ["test"],
        updated: { by: "test", date: dateToTimestamp("2022-02-01") },
      },
    },
  });

  expect(client.opportunities.compliantReporting?.statusMessageShort).toBe(
    "Currently ineligible"
  );

  set(mockUpdate, {
    compliantReporting: {
      referralForm: {},
    },
  });
  expect(client.opportunities.compliantReporting?.statusMessageShort).toBe(
    "Referral in progress"
  );

  set(mockUpdate, {
    compliantReporting: {
      completed: {
        by: "test",
        date: {},
      },
    },
  });
  expect(client.opportunities.compliantReporting?.statusMessageShort).toBe(
    "Referral form complete"
  );
});

test("form view tracking", async () => {
  // tracking call waits for the initial update fetch so we have to mock it
  set(mockUpdate, { compliantReporting: {} });

  await client.trackFormViewed("compliantReporting");

  expect(trackReferralFormViewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("form view tracking waits for updates", async () => {
  const trackingCall = client.trackFormViewed("compliantReporting");

  // simulate fetch latency
  setTimeout(() => {
    set(mockUpdate, {
      compliantReporting: {
        completed: {
          update: { by: "abc", date: dateToTimestamp("2022-01-01") },
        },
      },
    });
  }, 10);

  await trackingCall;

  expect(trackReferralFormViewed).toHaveBeenCalledTimes(1);
  expect(trackReferralFormViewed).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("list view tracking", async () => {
  // tracking call waits for the initial update fetch so we have to mock it
  set(mockUpdate, { compliantReporting: {} });

  await client.trackListViewed("compliantReporting");

  expect(trackSurfacedInList).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});

test("list view tracking waits for updates", async () => {
  const trackingCall = client.trackListViewed("compliantReporting");

  // simulate fetch latency
  setTimeout(() => {
    set(mockUpdate, {
      compliantReporting: {
        completed: {
          update: { by: "abc", date: dateToTimestamp("2022-01-01") },
        },
      },
    });
  }, 10);

  await trackingCall;

  expect(trackSurfacedInList).toHaveBeenCalledTimes(1);
  expect(trackSurfacedInList).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    opportunityType: "compliantReporting",
  });
});
