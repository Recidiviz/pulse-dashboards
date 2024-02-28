// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import {
  UsTnAnnualReclassificationEligibleResidentRecord,
  UsTnAnnualReclassificationReferralRecordFixture01,
} from "../__fixtures__";
import { UsTnAnnualReclassificationReviewOpportunity } from "../UsTnAnnualReclassificationReviewOpportunity";

jest.mock("../../../subscriptions");

let opp: UsTnAnnualReclassificationReviewOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  residentRecord: typeof UsTnAnnualReclassificationEligibleResidentRecord,
) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usTnAnnualReclassification"]);
  resident = new Resident(residentRecord, root);

  const maybeOpportunity =
    resident.potentialOpportunities.usTnAnnualReclassification;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2024, 7, 1));
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("Annual Reclassification Opportunity for fully eligible resident", () => {
  beforeEach(() => {
    createTestUnit(UsTnAnnualReclassificationEligibleResidentRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = UsTnAnnualReclassificationReferralRecordFixture01;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});
