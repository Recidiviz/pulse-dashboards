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

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import {
  CollectionDocumentSubscription,
  OpportunityUpdateSubscription,
} from "../../subscriptions";
import {
  earlyTerminationEligibleClientRecord,
  earlyTerminationReferralRecord,
} from "../__fixtures__";
import { createEarlyTerminationOpportunity } from "../EarlyTerminationOpportunity";
import { EarlyTerminationCriteria } from "../EarlyTerminationReferralRecord";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";
import { earlyTerminationOpportunityStatuses } from "../utils";

let et: Opportunity;
let client: Client;
let root: RootStore;
let referralSub: CollectionDocumentSubscription<any>;
let updatesSub: OpportunityUpdateSubscription<any>;

jest.mock("../../subscriptions");
const CollectionDocumentSubscriptionMock = CollectionDocumentSubscription as jest.MockedClass<
  typeof CollectionDocumentSubscription
>;
const OpportunityUpdateSubscriptionMock = OpportunityUpdateSubscription as jest.MockedClass<
  typeof OpportunityUpdateSubscription
>;

function createTestUnit(
  clientRecord: typeof earlyTerminationEligibleClientRecord
) {
  root = new RootStore();
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.opportunities.earlyTermination;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

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
    createTestUnit(earlyTerminationEligibleClientRecord);

    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
    referralSub.isLoading = false;
    referralSub.data = earlyTerminationReferralRecord;

    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
    updatesSub.isLoading = false;
  });

  test("short status message", () => {
    expect(et.statusMessageShort).toBe(
      earlyTerminationOpportunityStatuses.PENDING
    );

    updatesSub.data = INCOMPLETE_UPDATE;
    expect(et.statusMessageShort).toBe(
      earlyTerminationOpportunityStatuses.IN_PROGRESS
    );

    updatesSub.data = DENIED_UPDATE;
    expect(et.statusMessageShort).toBe(
      earlyTerminationOpportunityStatuses.DENIED
    );

    updatesSub.data = COMPLETED_UPDATE;
    expect(et.statusMessageShort).toBe(
      earlyTerminationOpportunityStatuses.COMPLETED
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
    expect(et.requirementsMet).toMatchSnapshot();
  });
});

// TODO(#2263): Re-implement this once validate() is running again.
xdescribe("invalid opportunity record", () => {
  test("invalid record due to missing supervision level returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );

    invalidRecord.reasons = invalidRecord.reasons.filter(
      (criteria: EarlyTerminationCriteria) =>
        criteria.criteriaName ===
        "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SUPERVISION_LEVEL"
    );

    expect(createEarlyTerminationOpportunity(true, client)).toBeUndefined();
  });

  test("invalid record due to missing notActiveRevocationStatus returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );

    invalidRecord.reasons = invalidRecord.reasons.filter(
      (criteria: EarlyTerminationCriteria) =>
        criteria.criteriaName === "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS"
    );

    expect(createEarlyTerminationOpportunity(true, client)).toBeUndefined();
  });

  test("invalid record due to revocationDate returns undefined opportunity", () => {
    const invalidRecord = JSON.parse(
      JSON.stringify(earlyTerminationReferralRecord)
    );

    invalidRecord.reasons = invalidRecord.reasons.filter(
      (criteria: EarlyTerminationCriteria) =>
        criteria.criteriaName === "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS"
    );

    invalidRecord.reasons.push({
      criteria_name: "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS",
      reason: { revocationDate: "12/25/2021" },
    });

    expect(createEarlyTerminationOpportunity(true, client)).toBeUndefined();
  });
});
