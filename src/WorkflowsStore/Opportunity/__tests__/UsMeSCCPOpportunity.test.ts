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
import { Resident } from "../../Resident";
import { DocumentSubscription } from "../../subscriptions";
import {
  usMePersonRecord,
  usMePersonRecordShorterSentence,
  usMeSCCPAlmostEligibleRecordFixture,
  usMeSCCPEligibleRecordFixture,
  usMeSCCPEligibleRecordHalfPortionFixture,
} from "../__fixtures__";
import { UsMeSCCPOpportunity } from "../UsMeSCCPOpportunity";

let opp: UsMeSCCPOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;

jest.mock("../../subscriptions");

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

describe("almost eligible", () => {
  beforeEach(() => {
    createTestUnit(usMePersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = usMeSCCPAlmostEligibleRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
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

    referralSub.data = usMeSCCPAlmostEligibleRecordFixture;

    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const textAlmostEligible = opp.requirementsAlmostMet.find(({ text }) =>
      text.includes("months remaining on sentence")
    )!.text;

    expect(textEligible).not.toEqual(textAlmostEligible);
  });
});
