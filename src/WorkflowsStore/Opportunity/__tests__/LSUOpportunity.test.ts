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
  LSUEligibleClientRecord,
  LSUReferralRecordFixture,
} from "../__fixtures__";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";
import { LSUOpportunityStatuses } from "../utils";

jest.mock("../../../firestore");
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

function createTestUnit(clientRecord: typeof LSUEligibleClientRecord) {
  root = new RootStore();
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.opportunities.LSU;

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
    createTestUnit(LSUEligibleClientRecord);

    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;
    referralSub.isLoading = false;
    referralSub.data = LSUReferralRecordFixture;

    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
    updatesSub.isLoading = false;
  });

  test("review status", () => {
    expect(opp.reviewStatus).toBe("PENDING");

    updatesSub.data = INCOMPLETE_UPDATE.LSU;
    expect(opp.reviewStatus).toBe("IN_PROGRESS");

    updatesSub.data = DENIED_UPDATE.LSU;
    expect(opp.reviewStatus).toBe("DENIED");

    updatesSub.data = COMPLETED_UPDATE.LSU;
    expect(opp.reviewStatus).toBe("COMPLETED");
  });

  test("short status message", () => {
    expect(opp.statusMessageShort).toBe(LSUOpportunityStatuses.PENDING);

    updatesSub.data = INCOMPLETE_UPDATE.LSU;
    expect(opp.statusMessageShort).toBe(LSUOpportunityStatuses.IN_PROGRESS);

    updatesSub.data = DENIED_UPDATE.LSU;
    expect(opp.statusMessageShort).toBe(LSUOpportunityStatuses.DENIED);

    updatesSub.data = COMPLETED_UPDATE.LSU;
    expect(opp.statusMessageShort).toBe(LSUOpportunityStatuses.COMPLETED);
  });

  test("extended status message", () => {
    expect(opp.statusMessageLong).toBe(LSUOpportunityStatuses.PENDING);
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

describe("hydration is lowest common denominator of all subscriptions", () => {
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;

    [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
  });

  test.each([
    [undefined, undefined, undefined],
    [undefined, true, undefined],
    [undefined, false, undefined],
    [true, true, true],
    [true, false, true],
    [false, false, false],
  ])("%s + %s = %s", (statusA, statusB, result) => {
    referralSub.isLoading = statusA;
    updatesSub.isLoading = statusB;
    expect(opp.isLoading).toBe(result);

    referralSub.isLoading = statusB;
    updatesSub.isLoading = statusA;
    expect(opp.isLoading).toBe(result);
  });
});

test("hydrate", () => {
  createTestUnit(LSUEligibleClientRecord);

  [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;

  [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;

  opp.hydrate();
  expect(referralSub.hydrate).toHaveBeenCalled();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});
