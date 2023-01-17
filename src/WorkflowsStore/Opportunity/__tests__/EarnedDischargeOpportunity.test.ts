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

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { DocumentSubscription } from "../../subscriptions";
import {
  earnedDischargeAlmostEligibleSupervisionLength,
  earnedDischargeAlmostEligibleVerifiedIncome,
  EarnedDischargeEligibleClientRecord,
  EarnedDischargeReferralRecordFixture,
} from "../__fixtures__";
import { EarnedDischargeOpportunity } from "../EarnedDischargeOpportunity";

jest.mock("../../subscriptions");

let opp: EarnedDischargeOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: typeof EarnedDischargeEligibleClientRecord
) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["earnedDischarge"]);
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.potentialOpportunities.earnedDischarge;

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

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = EarnedDischargeReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeFalse();
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});

describe("almost eligible income verified within 3 months", () => {
  beforeEach(() => {
    createTestUnit(EarnedDischargeEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = earnedDischargeAlmostEligibleVerifiedIncome;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs employment verification",
        tooltip:
          "Policy requirement: Verified employment status, full-time student, or adequate lawful " +
          "income from non-employment sources have been confirmed within past 3 months.",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs employment verification"
    );
  });
});

describe("almost eligible on probation at least a year", () => {
  beforeEach(() => {
    createTestUnit(EarnedDischargeEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = earnedDischargeAlmostEligibleSupervisionLength;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs 46 more months on supervision",
        tooltip:
          "Policy requirement: If on probation, served minimum sentence according to the court; " +
          "if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent " +
          "offense, served at least one-third of remaining sentence; if on parole for a life sentence, served " +
          "at least five years on parole.",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs 46 more months on supervision"
    );
  });
});
