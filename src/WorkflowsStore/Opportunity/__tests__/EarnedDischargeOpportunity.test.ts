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
  EarnedDischargeEligibleClientRecord,
  EarnedDischargeReferralRecordFixture,
} from "../__fixtures__";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";
import { earnedDischargeOpportunityStatuses } from "../utils";

jest.mock("../../subscriptions");

const CollectionDocumentSubscriptionMock = CollectionDocumentSubscription as jest.MockedClass<
  typeof CollectionDocumentSubscription
>;
const OpportunityUpdateSubscriptionMock = OpportunityUpdateSubscription as jest.MockedClass<
  typeof OpportunityUpdateSubscription
>;

let opp: Opportunity;
let client: Client;
let root: RootStore;
let referralSub: CollectionDocumentSubscription<any>;
let updatesSub: OpportunityUpdateSubscription<any>;

function createTestUnit(
  clientRecord: typeof EarnedDischargeEligibleClientRecord
) {
  root = new RootStore();
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.opportunities.earnedDischarge;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
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
    createTestUnit(EarnedDischargeEligibleClientRecord);

    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
    referralSub.isLoading = false;
    referralSub.data = EarnedDischargeReferralRecordFixture;

    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
    updatesSub.isLoading = false;
  });

  test("short status message", () => {
    expect(opp.statusMessageShort).toBe(
      earnedDischargeOpportunityStatuses.PENDING
    );

    updatesSub.data = INCOMPLETE_UPDATE;
    expect(opp.statusMessageShort).toBe(
      earnedDischargeOpportunityStatuses.IN_PROGRESS
    );

    updatesSub.data = DENIED_UPDATE;
    expect(opp.statusMessageShort).toBe(
      earnedDischargeOpportunityStatuses.DENIED
    );

    updatesSub.data = COMPLETED_UPDATE;
    expect(opp.statusMessageShort).toBe(
      earnedDischargeOpportunityStatuses.COMPLETED
    );
  });

  test("extended status message", () => {
    expect(opp.statusMessageLong).toBe(
      earnedDischargeOpportunityStatuses.PENDING
    );
  });

  test("rank by status", () => {
    expect(opp.rank).toBe(0);
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});
