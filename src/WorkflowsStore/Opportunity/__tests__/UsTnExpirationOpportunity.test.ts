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
  UsTnExpirationEligibleClientRecord,
  UsTnExpirationReferralRecordFixture,
} from "../__fixtures__";
import {
  hydrateExpirationDateRequirementText,
  UsTnExpirationOpportunity,
} from "../UsTnExpirationOpportunity";

jest.mock("../../subscriptions");

let opp: UsTnExpirationOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: typeof UsTnExpirationEligibleClientRecord
) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usTnExpiration"]);
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.potentialOpportunities.usTnExpiration;

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
    createTestUnit(UsTnExpirationEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = UsTnExpirationReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("hydrate same day", () => {
    tk.reset();
    tk.freeze(new Date(2022, 1, 2, 16, 30));

    const actual = hydrateExpirationDateRequirementText(
      UsTnExpirationReferralRecordFixture.eligibleCriteria
        .supervisionPastFullTermCompletionDateOrUpcoming1Day
    );

    expect(actual).toEqual("Expiration date is today (Feb 2, 2022)");
  });

  test("hydrate text for 1 day past", () => {
    tk.reset();
    tk.freeze(new Date(2022, 1, 3, 16, 30));

    const actual = hydrateExpirationDateRequirementText(
      UsTnExpirationReferralRecordFixture.eligibleCriteria
        .supervisionPastFullTermCompletionDateOrUpcoming1Day
    );

    expect(actual).toEqual("1 day past expiration date (Feb 2, 2022)");
  });
});
