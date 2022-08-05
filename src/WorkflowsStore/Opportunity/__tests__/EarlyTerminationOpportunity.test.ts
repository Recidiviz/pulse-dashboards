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

import { configure } from "mobx";
import tk from "timekeeper";

import { subscribeToEarlyTerminationReferral } from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import {
  earlyTerminationEligibleClientRecord,
  earlyTerminationReferralRecord,
} from "../__fixtures__";
import { createEarlyTerminationOpportunity } from "../EarlyTerminationOpportunity";
import { Opportunity } from "../types";
import { earlyTerminationOpportunityStatuses } from "../utils";

let et: Opportunity;
let client: Client;
let root: RootStore;

jest.mock("../../../firestore");

const mockSubscribeToEarlyTerminationReferral = subscribeToEarlyTerminationReferral as jest.MockedFunction<
  typeof subscribeToEarlyTerminationReferral
>;

function createTestUnit(
  clientRecord: typeof earlyTerminationEligibleClientRecord
) {
  root = new RootStore();
  client = new Client(clientRecord, root);
  const maybeOpportunity = createEarlyTerminationOpportunity(
    clientRecord.earlyTerminationEligible,
    earlyTerminationReferralRecord,
    client
  );

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  client.opportunities.earlyTermination = maybeOpportunity;
  et = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    mockSubscribeToEarlyTerminationReferral.mockImplementation(
      (clientId, handler) => {
        handler(earlyTerminationReferralRecord);
        return jest.fn();
      }
    );
    createTestUnit(earlyTerminationEligibleClientRecord);
  });

  test("review status", () => {
    expect(et.reviewStatus).toBe("PENDING");
  });

  test("short status message", () => {
    expect(et.statusMessageShort).toBe(
      earlyTerminationOpportunityStatuses.PENDING
    );
  });

  test("extended status message", () => {
    expect(et.statusMessageLong).toBe(
      earlyTerminationOpportunityStatuses.PENDING
    );
  });

  test("rank by status", () => {
    expect(et.rank).toBe(0);
  });

  test("requirements almost met", () => {
    expect(et.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(et.requirementsMet).toEqual([]);
  });
});

describe("invalid opportunity record", () => {
  test("invalid record due to missing supervision level returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );
    // @ts-ignore
    invalidRecord.reasons.eligibleSupervisionLevel = {};
    expect(
      createEarlyTerminationOpportunity(true, invalidRecord, client)
    ).toBeUndefined();
  });

  test("invalid record due to missing notActiveRevocationStatus returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );
    delete invalidRecord.reasons.notActiveRevocationStatus;
    expect(
      createEarlyTerminationOpportunity(true, invalidRecord, client)
    ).toBeUndefined();
  });

  test("invalid record due to revocation_date returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );
    invalidRecord.reasons.notActiveRevocationStatus.revocation_date =
      "12/25/2021";
    expect(
      createEarlyTerminationOpportunity(true, invalidRecord, client)
    ).toBeUndefined();
  });
});
