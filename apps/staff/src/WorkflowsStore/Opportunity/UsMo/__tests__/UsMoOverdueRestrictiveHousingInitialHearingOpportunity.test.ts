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
import { OpportunityStatus, SortParamObject } from "../..";
import {
  usMoOverdueRestrictiveHousingInitialHearingReferralRecordFixture,
  usMoPersonRecord,
} from "../__fixtures__";
import {
  UsMoOverdueRestrictiveHousingInitialHearingOpportunity,
  UsMoOverdueRestrictiveHousingInitialHearingReferralRecord,
} from "../UsMoOverdueRestrictiveHousingInitialHearingOpportunity";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../UsMoOverdueRestrictiveHousingInitialHearingOpportunity/UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";

let opp: UsMoOverdueRestrictiveHousingInitialHearingOpportunity;
let resident: Resident;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;
let fixtureData: UsMoOverdueRestrictiveHousingInitialHearingReferralRecord;

vi.mock("../../../subscriptions");

function createTestUnit(residentRecord: typeof usMoPersonRecord) {
  resident = new Resident(residentRecord, root);

  const maybeOpportunity =
    resident.potentialOpportunities.usMoOverdueRestrictiveHousingInitialHearing;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

const today = new Date(2023, 11, 7);

beforeAll(() => {
  // this lets us spy on observables, e.g. computed getters
  fixtureData = cloneDeep(
    usMoOverdueRestrictiveHousingInitialHearingSchema.parse(
      usMoOverdueRestrictiveHousingInitialHearingReferralRecordFixture,
    ),
  );
  configure({ safeDescriptors: false });
});

afterAll(() => {
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    // this lets us spy on observables, e.g. computed getters
    configure({ safeDescriptors: false });
    freeze(today);

    fixtureData = cloneDeep(
      usMoOverdueRestrictiveHousingInitialHearingSchema.parse(
        usMoOverdueRestrictiveHousingInitialHearingReferralRecordFixture,
      ),
    );

    root = new RootStore();
    vi.spyOn(
      root.workflowsRootStore.opportunityConfigurationStore,
      "enabledOpportunityTypes",
      "get",
    ).mockReturnValue(["usMoOverdueRestrictiveHousingInitialHearing"]);
    createTestUnit(usMoPersonRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = fixtureData;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      [
        {
          "text": "Initial meaningful hearing due 53 days ago (Oct 15, 2023)",
          "tooltip": "If the hearing is scheduled in ITSC, the due date is the scheduled date. If NOT scheduled in ITSC, the due date is seven (7) business days after the initial assignment.",
        },
        {
          "text": "No active D1 sanctions",
        },
        {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements met, overdue today", () => {
    if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
      fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
        today;
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      [
        {
          "text": "Initial meaningful hearing due today (Dec 7, 2023)",
          "tooltip": "If the hearing is scheduled in ITSC, the due date is the scheduled date. If NOT scheduled in ITSC, the due date is seven (7) business days after the initial assignment.",
        },
        {
          "text": "No active D1 sanctions",
        },
        {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements met, overdue yesterday", () => {
    if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
      fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
        subDays(today, 1);
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      [
        {
          "text": "Initial meaningful hearing due 1 day ago (Dec 6, 2023)",
          "tooltip": "If the hearing is scheduled in ITSC, the due date is the scheduled date. If NOT scheduled in ITSC, the due date is seven (7) business days after the initial assignment.",
        },
        {
          "text": "No active D1 sanctions",
        },
        {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  test("requirements almost met, hearing tomorrow", () => {
    if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
      fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
        addDays(today, 1);
    referralSub.data = fixtureData;
    expect(opp.requirementsMet).toMatchInlineSnapshot(`
      [
        {
          "text": "Initial meaningful hearing due in 1 day (Dec 8, 2023)",
          "tooltip": "If the hearing is scheduled in ITSC, the due date is the scheduled date. If NOT scheduled in ITSC, the due date is seven (7) business days after the initial assignment.",
        },
        {
          "text": "No active D1 sanctions",
        },
        {
          "text": "In a Restrictive Housing cell",
        },
      ]
    `);
  });

  describe("tabs", () => {
    test("overridden", () => {
      updatesSub.data = { denial: { reasons: ["test-reason"] } };
      expect(opp.tabTitle()).toEqual("Overridden");
    });

    test("Due this week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          today;
      referralSub.data = fixtureData;
      expect(opp.tabTitle()).toMatch(/\b(Due this week)/gm);
    });

    test("Due this week, on day of reset", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          startOfWeek(today, { weekStartsOn: 1 });
      referralSub.data = fixtureData;
      expect(opp.tabTitle()).toMatch(/\b(Due this week)/gm);
    });

    test("Due last week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          subWeeks(today, 1);
      referralSub.data = fixtureData;
      expect(opp.tabTitle()).toMatch(/\b(Overdue as of Dec 4, 2023)/gm);
    });

    test("Due next week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          addWeeks(new Date(), 1);
      referralSub.data = fixtureData;
      expect(opp.tabTitle()).toMatch(/\b(Coming up)/gm);
    });
  });

  describe("eligibility message", () => {
    test("Due this week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          today;
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Initial hearing due today)/gm,
      );
    });

    test("Due this week, on day of reset", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate = {
          nextReviewDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
          dueDateInferred: false,
        };
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Initial hearing due 3 days ago)/gm,
      );
    });

    test("Due last week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate.nextReviewDate =
          subWeeks(new Date(), 1);
      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Initial hearing due 7 days ago)/gm,
      );
    });

    test("Due next week", () => {
      if (fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate)
        fixtureData.eligibleCriteria.usMoInitialHearingPastDueDate = {
          nextReviewDate: addWeeks(new Date(), 1),
          dueDateInferred: false,
        };

      referralSub.data = fixtureData;
      expect(opp.eligibleStatusMessage).toMatch(
        /\b(Initial hearing due in 7 days)/gm,
      );
    });
  });
});

class TestOpportunity extends UsMoOverdueRestrictiveHousingInitialHearingOpportunity {
  compare(other: UsMoOverdueRestrictiveHousingInitialHearingOpportunity) {
    return super.compare(other);
  }
}

const createOpportunityInstance = (
  reviewStatus: OpportunityStatus,
  eligibilityDate: Date | undefined,
  compareBy?: SortParamObject<string>[],
) => {
  const mockRoot = new RootStore();
  const mockResident = new Resident(usMoPersonRecord, mockRoot);
  const mockOpp = new TestOpportunity(mockResident);

  vi.spyOn(mockOpp, "reviewStatus", "get").mockReturnValue(reviewStatus);
  vi.spyOn(mockOpp, "eligibilityDate", "get").mockReturnValue(eligibilityDate);
  if (compareBy)
    vi.spyOn(mockOpp.config, "compareBy", "get").mockReturnValue(compareBy);
  return mockOpp;
};

const initOpportunitiesList = (
  reviewStatuses: OpportunityStatus[],
  eligibilityDates: (Date | undefined)[],
  compareBy?: SortParamObject<string>[],
) => {
  return reviewStatuses.map((reviewStatus, index) => {
    return createOpportunityInstance(
      reviewStatus,
      eligibilityDates[index],
      compareBy,
    );
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
    freeze(new Date(2022, 7, 1));
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

  it("should sort undefined opportunities to the front of the array regardless of param ordering", () => {
    const shuffledDates = shuffle(orderedDates).map(
      (date: Date | undefined, idx) => (idx % 2 === 1 ? undefined : date),
    );

    opportunities = initOpportunitiesList(
      shuffle(orderedReviewStatuses),
      shuffledDates,
      [
        {
          field: "eligibilityDate",
          undefinedBehavior: "undefinedFirst",
          sortDirection: "asc",
        },
      ],
    );
    opportunities.sort((a, b) => a.compare(b));
    expect(
      evaluateForUndefinedDatesFirstOnly(
        opportunities.map((mockOpp) => mockOpp.eligibilityDate),
      ),
    ).toBeTruthy();
  });
});
