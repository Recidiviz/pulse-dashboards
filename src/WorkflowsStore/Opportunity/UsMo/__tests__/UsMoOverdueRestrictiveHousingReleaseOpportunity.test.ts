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

import { addDays, addWeeks, startOfWeek, subDays, subWeeks } from "date-fns";
import { cloneDeep, shuffle } from "lodash";
import { configure } from "mobx";
import { freeze } from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import { OpportunityStatus } from "../..";
import {
  usMoOverdueRestrictiveHousingReleaseReferralRecordFixture,
  usMoPersonRecord,
} from "../__fixtures__";
import {
  UsMoOverdueRestrictiveHousingReleaseOpportunity,
  UsMoOverdueRestrictiveHousingReleaseReferralRecord,
} from "../UsMoOverdueRestrictiveHousingReleaseOpportunity";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";

let opp: UsMoOverdueRestrictiveHousingReleaseOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;
let fixtureData: UsMoOverdueRestrictiveHousingReleaseReferralRecord;

jest.mock("../../../subscriptions");

function createTestUnit(residentRecord: typeof usMoPersonRecord) {
  resident = new Resident(residentRecord, root);

  const maybeOpportunity =
    resident.potentialOpportunities.usMoOverdueRestrictiveHousingRelease;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

const today = new Date(2023, 11, 7);

beforeAll(() => {
  // this lets us spy on observables, e.g. computed getters
  fixtureData = cloneDeep(
    usMoOverdueRestrictiveHousingReleaseSchema.parse(
      usMoOverdueRestrictiveHousingReleaseReferralRecordFixture
    )
  );
  configure({ safeDescriptors: false });
  jest.useFakeTimers().setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    configure({ safeDescriptors: false });
    root = new RootStore();
    jest
      .spyOn(root.workflowsStore, "opportunityTypes", "get")
      .mockReturnValue(["usMoOverdueRestrictiveHousingRelease"]);
    jest
      .spyOn(root.workflowsStore, "featureVariants", "get")
      .mockReturnValue({ usMoOverdueRHPilot: {} });
    createTestUnit(usMoPersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = fixtureData;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "In Restrictive Housing due to a D1 sanction",
        },
        Object {
          "text": "No active D1 sanctions",
        },
        Object {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements met, overdue today", () => {
    fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
      today;
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "In Restrictive Housing due to a D1 sanction",
        },
        Object {
          "text": "No active D1 sanctions",
        },
        Object {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements met, overdue yesterday", () => {
    fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
      subDays(today, 1);
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "In Restrictive Housing due to a D1 sanction",
        },
        Object {
          "text": "No active D1 sanctions",
        },
        Object {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements almost met, hearing tomorrow", () => {
    fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
      addDays(today, 1);
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "In Restrictive Housing due to a D1 sanction",
        },
        Object {
          "text": "No active D1 sanctions",
        },
        Object {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  beforeEach(() => {
    // this lets us spy on observables, e.g. computed getters

    freeze(today);
    fixtureData = cloneDeep(
      usMoOverdueRestrictiveHousingReleaseSchema.parse(
        usMoOverdueRestrictiveHousingReleaseReferralRecordFixture
      )
    );
  });

  describe("tabs", () => {
    test("overridden", () => {
      updatesSub.data = { denial: { reasons: ["test-reason"] } };
      expect(opp.tabTitle).toEqual("Overridden");
    });

    test("Due this week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        today;
      referralSub.data = fixtureData;
      expect(opp.tabTitle).toMatch(/\b(Due this week)/gm);
    });

    test("Due this week, on day of reset", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        startOfWeek(today, { weekStartsOn: 1 });
      referralSub.data = fixtureData;
      expect(opp.tabTitle).toMatch(/\b(Due this week)/gm);
    });

    test("Due last week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        subWeeks(today, 1);
      referralSub.data = fixtureData;
      expect(opp.tabTitle).toMatch(/\b(Overdue as of Dec 4, 2023)/gm);
    });

    test("Due next week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        addWeeks(new Date(), 1);
      referralSub.data = fixtureData;
      expect(opp.tabTitle).toMatch(/\b(Coming up)/gm);
    });
  });

  describe("eligibility message", () => {
    test("Due this week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        today;
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Segregation period ends today)/gm
      );
    });

    test("Due this week, on day of reset", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        startOfWeek(new Date(), { weekStartsOn: 1 });
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Segregation period ended 3 days ago)/gm
      );
    });

    test("Due last week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        subWeeks(new Date(), 1);
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Segregation period ended 7 days ago)/gm
      );
    });

    test("Due next week", () => {
      fixtureData.eligibleCriteria.usMoNoActiveD1Sanctions.latestSanctionEndDate =
        addWeeks(new Date(), 1);
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Segregation period ends in 7 days)/gm
      );
    });
  });
});

class TestOpportunity extends UsMoOverdueRestrictiveHousingReleaseOpportunity {
  compare(other: UsMoOverdueRestrictiveHousingReleaseOpportunity) {
    return super.compare(other);
  }
}

const createOpportunityInstance = (
  reviewStatus: OpportunityStatus,
  eligibilityDate: Date | undefined
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
  eligibilityDates: (Date | undefined)[]
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
      (date: Date | undefined, idx) => (idx % 2 === 1 ? undefined : date)
    );

    opportunities = initOpportunitiesList(
      shuffle(orderedReviewStatuses),
      shuffledDates
    );
    opportunities.sort((a, b) => a.compare(b));
    expect(
      evaluateForUndefinedDatesFirstOnly(
        opportunities.map((mockOpp) => mockOpp.eligibilityDate)
      )
    ).toBeTruthy();
  });
});