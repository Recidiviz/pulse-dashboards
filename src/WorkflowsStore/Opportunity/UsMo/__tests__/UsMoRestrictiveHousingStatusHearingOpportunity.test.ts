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

import { addDays, subDays } from "date-fns";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import {
  usMoPersonRecord,
  UsMoRestrictiveHousingStatusHearingRecordFixture,
} from "../__fixtures__";
import {
  UsMoRestrictiveHousingStatusHearingOpportunity,
  UsMoRestrictiveHousingStatusHearingReferralRecord,
} from "../UsMoRestrictiveHousingStatusHearingOpportunity";

let opp: UsMoRestrictiveHousingStatusHearingOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;

jest.mock("../../../subscriptions");

function createTestUnit(residentRecord: typeof usMoPersonRecord) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usMoRestrictiveHousingStatusHearing"]);
  resident = new Resident(residentRecord, root);

  const maybeOpportunity =
    resident.potentialOpportunities.usMoRestrictiveHousingStatusHearing;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

const today = new Date(2022, 7, 1);

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(today);
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(usMoPersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = UsMoRestrictiveHousingStatusHearingRecordFixture;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements met, overdue today", () => {
    const fixtureEligibleToday: UsMoRestrictiveHousingStatusHearingReferralRecord =
      {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: today,
          },
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
      };
    referralSub.data = fixtureEligibleToday;
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements met, overdue yesterday", () => {
    const fixtureEligibleYesterday: UsMoRestrictiveHousingStatusHearingReferralRecord =
      {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: subDays(today, 1),
          },
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
      };
    referralSub.data = fixtureEligibleYesterday;
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met, hearing tomorrow", () => {
    const fixtureEligibleTomorrow: UsMoRestrictiveHousingStatusHearingReferralRecord =
      {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: addDays(today, 1),
          },
        },
      };
    referralSub.data = fixtureEligibleTomorrow;
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("requirements almost met, hearing in future", () => {
    const fixtureEligibleFuture: UsMoRestrictiveHousingStatusHearingReferralRecord =
      {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: addDays(today, 7),
          },
        },
      };
    referralSub.data = fixtureEligibleFuture;
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("requirements almost met, missing date", () => {
    const fixtureMissingDate: UsMoRestrictiveHousingStatusHearingReferralRecord =
      {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: {},
        },
      };
    referralSub.data = fixtureMissingDate;
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
    expect(opp.almostEligibleStatusMessage).toMatchSnapshot();
  });
});