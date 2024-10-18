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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";

import {
  CURRENT_DATE_FIXTURE,
  relativeFixtureDate,
  usMeSccpFixtures,
} from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { UsMeSCCPOpportunity } from "..";
import {
  usMePersonRecord,
  usMePersonRecordShorterSentence,
} from "../__fixtures__";

let opp: UsMeSCCPOpportunity;
let resident: Resident;
let root: RootStore;

vi.mock("../../../subscriptions");

function createTestUnit(
  residentRecord: typeof usMePersonRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usMeSCCP",
  ]);
  resident = new Resident(residentRecord, root);

  opp = new UsMeSCCPOpportunity(resident, opportunityRecord);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(CURRENT_DATE_FIXTURE);
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.fullyEligibleTwoThirdsPortion.input,
    );
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
  createTestUnit(
    usMePersonRecordShorterSentence,
    usMeSccpFixtures.fullyEligibleHalfPortion.input,
  );

  expect(opp.requirementsMet[1]).toMatchSnapshot();
});

test("eligible with future x portion date", () => {
  createTestUnit(
    usMePersonRecord,
    usMeSccpFixtures.eligibleToApplyBeforeXPortionServed.input,
  );

  expect(opp.requirementsMet[1]).toMatchSnapshot();

  expect(opp.almostEligible).toBeFalse();
  expect(opp.requirementsAlmostMet).toHaveLength(0);
});

describe("almost eligible but for months remaining", () => {
  beforeEach(() => {
    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.almostEligibleMonthsRemaining.input,
    );
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
});

describe("almost eligible but for months with days remaining", () => {
  beforeEach(() => {
    const almostEligibleInDays = {
      ...usMeSccpFixtures.almostEligibleMonthsRemaining.input,
      ineligibleCriteria: {
        usMeXMonthsRemainingOnSentence: {
          eligibleDate: relativeFixtureDate({ days: 13 }),
        },
      },
    };
    createTestUnit(usMePersonRecord, almostEligibleInDays);
  });

  test("almostEligibleStatusMessage with days", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "30 months and 13 days until release",
    );
  });
});

describe("ensure requirements text updates when source changes", () => {
  test("from eligible to ineligible", () => {
    // This is specifically to check for a bug where the first time we built
    // requirements we accidentally overwrote the source template instead of
    // copying it which made the requirements text never update until a reload.
    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.fullyEligibleTwoThirdsPortion.input,
    );

    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const textEligible = opp.requirementsMet.find(({ text }) =>
      text.includes("months remaining on sentence"),
    )!.text;

    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.almostEligibleMonthsRemaining.input,
    );

    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const textAlmostEligible = opp.requirementsAlmostMet.find(({ text }) =>
      text.includes("months remaining on sentence"),
    )!.text;

    expect(textEligible).not.toEqual(textAlmostEligible);
  });
});

describe("almost eligible but for class A/B discipline", () => {
  beforeEach(() => {
    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.almostEligibleRecentViolation.input,
    );
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
      `"Needs 76 more days without a Class A or B discipline"`,
    );
  });
});

describe("almost eligible but for fraction of sentence served", () => {
  beforeEach(() => {
    createTestUnit(
      usMePersonRecord,
      usMeSccpFixtures.almostEligibleXPortion.input,
    );
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
      `"Needs to serve 5 more months on sentence."`,
    );
  });
});
