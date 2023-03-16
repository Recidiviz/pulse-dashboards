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
import { DocumentSubscription } from "../../subscriptions";
import {
  usMeEarlyTerminationEligibleClientRecord,
  usMeEarlyTerminationReferralRecord,
} from "../__fixtures__";
import { UsMeEarlyTerminationOpportunity } from "../UsMeEarlyTerminationOpportunity";

let opp: UsMeEarlyTerminationOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

jest.mock("../../subscriptions");

function createTestUnit(
  clientRecord: typeof usMeEarlyTerminationEligibleClientRecord
) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usMeEarlyTermination"]);
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.potentialOpportunities.usMeEarlyTermination;

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
    createTestUnit(usMeEarlyTerminationEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeEarlyTerminationReferralRecord;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});
