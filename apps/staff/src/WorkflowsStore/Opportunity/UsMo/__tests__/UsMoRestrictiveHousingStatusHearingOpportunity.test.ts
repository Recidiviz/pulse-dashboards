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
import { shuffle } from "lodash";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import { OpportunityStatus } from "../..";
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
let updatesSub: DocumentSubscription<any>;

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
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = UsMoRestrictiveHousingStatusHearingRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
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

  describe("tabs", () => {
    test("overridden", () => {
      updatesSub.data = { denial: { reasons: ["test-reason"] } };
      expect(opp.tabTitle).toEqual("Overridden");
    });

    test("Overdue for hearing", () => {
      referralSub.data = {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: { usMoOverdueForHearing: true },
      };
      expect(opp.tabTitle).toEqual("Overdue For Hearing");
    });

    test("Missing Review Date", () => {
      referralSub.data = {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {},
        ineligibleCriteria: {
          usMoOverdueForHearing: { nextReviewDate: null },
        },
      };
      expect(opp.tabTitle).toEqual("Missing Review Date");
    });

    test("Upcoming hearing", () => {
      referralSub.data = {
        ...UsMoRestrictiveHousingStatusHearingRecordFixture,
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: { nextReviewDate: new Date() },
        },
      };
      expect(opp.tabTitle).toEqual("Upcoming Hearings");
    });
  });
});

class TestOpportunity extends UsMoRestrictiveHousingStatusHearingOpportunity {
  compare(other: UsMoRestrictiveHousingStatusHearingOpportunity) {
    return super.compare(other);
  }
}

const createOpportunityInstance = (
  reviewStatus: OpportunityStatus,
  eligibilityDate: Date | undefined,
) => {
  const mockRoot = new RootStore();
  const mockResident = new Resident(usMoPersonRecord, mockRoot);
  const mockOpp = new TestOpportunity(mockResident);

  jest.spyOn(mockOpp, "reviewStatus", "get").mockReturnValue(reviewStatus);
  jest
    .spyOn(mockOpp, "eligibilityDate", "get")
    .mockReturnValue(eligibilityDate);

  return mockOpp;
};

const initOpportunitiesList = (
  reviewStatuses: OpportunityStatus[],
  eligibilityDates: (Date | undefined)[],
) => {
  return reviewStatuses.map((reviewStatus, index) => {
    return createOpportunityInstance(reviewStatus, eligibilityDates[index]);
  });
};

function evaluateForUndefinedDatesFirstOnly(arr: any[]): boolean {
  let seenDefined = false;
  for (const item of arr) {
    if (item === undefined && seenDefined) return false;
    if (item !== undefined) seenDefined = true;
  }
  return true;
}

export const orderedReviewStatuses: OpportunityStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "DENIED",
  "DENIED",
  "COMPLETED",
  "ALMOST",
  "ALMOST",
  "ALMOST",
];

export const orderedDates: (Date | undefined)[] = [
  new Date(2016, 1, 1),
  new Date(2016, 2, 1),
  new Date(2016, 3, 1),
  new Date(2016, 4, 1),
  new Date(2016, 4, 1),
  new Date(2019, 1, 1),
  new Date(2019, 1, 2),
  new Date(2020, 1, 2),
];

describe("Test custom compare function", () => {
  let opportunities: TestOpportunity[];
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 7, 1));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should sort undefined opportunities to the front of the array", () => {
    const shuffledDates = shuffle(orderedDates).map(
      (date: Date | undefined, idx) => (idx % 2 === 1 ? undefined : date),
    );

    opportunities = initOpportunitiesList(
      shuffle(orderedReviewStatuses),
      shuffledDates,
    );
    opportunities.sort((a, b) => a.compare(b));
    expect(
      evaluateForUndefinedDatesFirstOnly(
        opportunities.map((mockOpp) => mockOpp.eligibilityDate),
      ),
    ).toBeTruthy();
  });
});
