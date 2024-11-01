// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import {
  earnedDischargeAlmostEligibleSupervisionLength,
  EarnedDischargeEligibleClientRecord,
  EarnedDischargeReferralRecordFixture,
} from "../__fixtures__";
import { EarnedDischargeOpportunity } from "../EarnedDischargeOpportunity";

vi.mock("../../../subscriptions");

let opp: EarnedDischargeOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: typeof EarnedDischargeEligibleClientRecord,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "earnedDischarge",
  ]);
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
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(EarnedDischargeEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = EarnedDischargeReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeFalse();
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});

describe("almost eligible on probation at least a year", () => {
  beforeEach(() => {
    createTestUnit(EarnedDischargeEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = earnedDischargeAlmostEligibleSupervisionLength;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs 16 more months on supervision",
        tooltip:
          "If on probation, served minimum sentence according to the court; " +
          "if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent " +
          "offense, served at least one-third of remaining sentence; if on parole for a life sentence, served " +
          "at least five years on parole",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs 16 more months on supervision",
    );
  });
});

describe("almost eligible days remaining on length of stay", () => {
  beforeEach(() => {
    createTestUnit(EarnedDischargeEligibleClientRecord);
    tk.freeze(new Date(2022, 1, 23));
    earnedDischargeAlmostEligibleSupervisionLength.ineligibleCriteria.pastEarnedDischargeEligibleDate =
      { eligibleDate: new Date(2022, 1, 24) };
    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = earnedDischargeAlmostEligibleSupervisionLength;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs 1 more day on supervision",
        tooltip:
          "If on probation, served minimum sentence according to the court; " +
          "if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent " +
          "offense, served at least one-third of remaining sentence; if on parole for a life sentence, served " +
          "at least five years on parole",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs 1 more day on supervision",
    );
  });
});
