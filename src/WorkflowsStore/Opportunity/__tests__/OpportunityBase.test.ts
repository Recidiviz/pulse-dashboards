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

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import {
  CollectionDocumentSubscription,
  OpportunityUpdateSubscription,
} from "../../subscriptions";
import { ineligibleClientRecord } from "../__fixtures__";
import { OpportunityBase } from "../OpportunityBase";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_UPDATE,
} from "../testUtils";
import { Opportunity, OpportunityType } from "../types";

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

class TestOpportunity extends OpportunityBase<Record<string, any>> {}

function createTestUnit() {
  root = new RootStore();
  // using an ineligible to avoid wasted work creating opportunities we don't need
  client = new Client(ineligibleClientRecord, root);
  opp = new TestOpportunity(client, "TEST" as OpportunityType);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  createTestUnit();

  [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;

  [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
});

afterEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("hydration is lowest common denominator of all subscriptions", () => {
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
  opp.hydrate();
  expect(referralSub.hydrate).toHaveBeenCalled();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});

test("review status", () => {
  expect(opp.reviewStatus).toBe("PENDING");

  updatesSub.data = INCOMPLETE_UPDATE;
  expect(opp.reviewStatus).toBe("IN_PROGRESS");

  updatesSub.data = DENIED_UPDATE;
  expect(opp.reviewStatus).toBe("DENIED");

  updatesSub.data = COMPLETED_UPDATE;
  expect(opp.reviewStatus).toBe("COMPLETED");
});
