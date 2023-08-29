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

import { parseISO } from "date-fns";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import { UsMeSCCPOpportunity } from "..";
import {
  usMePersonRecord,
  usMePersonRecordShorterSentence,
  usMeSCCPAlmostEligibleViolationRecordFixture,
  usMeSCCPAlmostEligibleXMonthsRecordFixture,
  usMeSCCPAlmostEligibleXPortionOfSentenceRecordFixture,
  usMeSCCPEligibleRecordFixture,
  usMeSCCPEligibleRecordHalfPortionFixture,
} from "../__fixtures__";

let opp: UsMeSCCPOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;

jest.mock("../../../subscriptions");

function createTestUnit(residentRecord: typeof usMePersonRecord) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usMeSCCP"]);
  resident = new Resident(residentRecord, root);

  const maybeOpportunity = resident.potentialOpportunities.usMeSCCP;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 12, 1));
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPEligibleRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeFalse();
    expect(opp.requirementsAlmostMet).toHaveLength(0);
  });
});

test("requirements for half sentence served", () => {
  createTestUnit(usMePersonRecordShorterSentence);

  referralSub = opp.referralSubscription;
  referralSub.isLoading = false;
  referralSub.isHydrated = true;
  referralSub.data = usMeSCCPEligibleRecordHalfPortionFixture;

  expect(opp.requirementsMet[1]).toMatchSnapshot();
});

describe("almost eligible but for months remaining", () => {
  beforeEach(() => {
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPAlmostEligibleXMonthsRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual("35 months until release");
  });

  test("almostEligibleStatusMessage with days", () => {
    const almostEligibleInDays = {
      ...usMeSCCPAlmostEligibleXMonthsRecordFixture,
      ineligibleCriteria: {
        usMeXMonthsRemainingOnSentence: {
          eligibleDate: parseISO("2023-01-14"),
        },
      },
    };
    referralSub.data = almostEligibleInDays;
    expect(opp.almostEligibleStatusMessage).toEqual(
      "30 months and 13 days until release"
    );
  });
});

describe("ensure requirements text updates when source changes", () => {
  test("from eligible to ineligible", () => {
    // This is specifically to check for a bug where the first time we built
    // requirements we accidentally overwrote the source template instead of
    // copying it which made the requirements text never update until a reload.
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPEligibleRecordFixture;

    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const textEligible = opp.requirementsMet.find(({ text }) =>
      text.includes("months remaining on sentence")
    )!.text;

    referralSub.data = usMeSCCPAlmostEligibleXMonthsRecordFixture;

    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const textAlmostEligible = opp.requirementsAlmostMet.find(({ text }) =>
      text.includes("months remaining on sentence")
    )!.text;

    expect(textEligible).not.toEqual(textAlmostEligible);
  });
});

describe("almost eligible but for class A/B discipline", () => {
  beforeEach(() => {
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPAlmostEligibleViolationRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toMatchInlineSnapshot(
      `"Needs 45 more days without a Class A or B discipline"`
    );
  });
});

describe("almost eligible but for fraction of sentence served", () => {
  beforeEach(() => {
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPAlmostEligibleXPortionOfSentenceRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toMatchInlineSnapshot(
      `"Needs to serve 3 more months on sentence."`
    );
  });
});
