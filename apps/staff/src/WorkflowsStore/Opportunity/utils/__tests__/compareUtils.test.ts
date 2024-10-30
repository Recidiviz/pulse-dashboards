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

import { reverse, shuffle } from "lodash";
import { configure } from "mobx";

import { OpportunityRecordBase } from "~datatypes";
import { OpportunityType } from "~datatypes";

import { SystemId } from "../../../../core/models/types";
import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityConfiguration } from "../../OpportunityConfigurations";
import { OpportunityStatus } from "../../types";
import { buildOpportunityCompareFunction } from "../compareUtils";

vi.mock("../../subscriptions");
vi.mock("firebase/firestore");

let client: Client;
let root: RootStore;

class TestOpportunity extends OpportunityBase<Client, OpportunityRecordBase> {
  constructor(
    oppClient: Client,
    type: OpportunityType,
    public systemType: SystemId,
    record: OpportunityRecordBase,
  ) {
    super(oppClient, type, root, record);
  }

  get config() {
    return {
      systemType: this.systemType,
    } as OpportunityConfiguration;
  }
}

function createTestUnit(systemType: SystemId = "SUPERVISION") {
  root = new RootStore();

  client = new Client({} as any, root);
  return new TestOpportunity(client, "TEST" as OpportunityType, systemType, {
    stateCode: "US_OZ",
    externalId: "123",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    caseNotes: {},
  });
}

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
  };
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
});

afterEach(() => {
  process.env = originalEnv;
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
});

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
  new Date(2016, 4, 2),
  new Date(2019, 1, 1),
  new Date(2019, 1, 2),
  new Date(2020, 1, 2),
];

function initOpportunitiesList(
  reviewStatuses: OpportunityStatus[],
  eligibilityDates: (Date | undefined)[],
  systemType: SystemId = "SUPERVISION",
): TestOpportunity[] {
  const opportunities: TestOpportunity[] = reviewStatuses.map((status, i) => {
    const currentOpp = createTestUnit(systemType);

    vi.spyOn(currentOpp, "eligibilityDate", "get").mockReturnValue(
      eligibilityDates[i],
    );
    vi.spyOn(currentOpp, "reviewStatus", "get").mockReturnValue(status);

    return currentOpp;
  });

  return opportunities;
}

const getDatesWithUndefinedMembers = (datesList: (Date | undefined)[]) =>
  datesList.map((a, idx) => (idx % 2 === 1 ? undefined : a));
describe("Created sort functions should work", () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date(2021, 1, 1));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  test("when receiving bad params", () => {
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      orderedDates,
    );
    const opps = shuffle(opportunities)
      .sort(buildOpportunityCompareFunction([{ field: "stuff" }]))
      .map((a) => ({
        eligibilityDate: a.eligibilityDate,
        reviewStatus: a.reviewStatus,
      }));
    expect(opps).toBeDefined();
  });

  test("when list is shuffled and sorting by review status", () => {
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      orderedDates,
    );
    expect(
      shuffle(opportunities)
        .sort(buildOpportunityCompareFunction([{ field: "reviewStatus" }]))
        .map((a) => a.reviewStatus),
    ).toEqual(orderedReviewStatuses);
  });

  test("when list is shuffled and sorting by eligibility date", () => {
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      orderedDates,
    );
    expect(
      shuffle(opportunities)
        .sort(buildOpportunityCompareFunction([{ field: "eligibilityDate" }]))
        .map((a) => a.eligibilityDate),
    ).toEqual(orderedDates);
  });

  test("when list is shuffled and there are undefined eligibility dates", () => {
    const datesWithUndefinedMembers =
      getDatesWithUndefinedMembers(orderedDates);
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      datesWithUndefinedMembers,
    );
    const sortedReviewStatuses = shuffle(opportunities)
      .sort(buildOpportunityCompareFunction([{ field: "reviewStatus" }]))
      .map((a) => a.reviewStatus);
    expect(sortedReviewStatuses).toEqual(sortedReviewStatuses);
  });

  test("when list is shuffled and sorting by review status and eligibility date", () => {
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      orderedDates,
    );
    expect(
      shuffle(opportunities)
        .sort(
          buildOpportunityCompareFunction([
            { field: "reviewStatus" },
            { field: "eligibilityDate" },
          ]),
        )
        .map((a) => [a.reviewStatus, a.eligibilityDate]),
    ).toMatchInlineSnapshot(`
      [
        [
          "PENDING",
          2016-02-01T00:00:00.000Z,
        ],
        [
          "IN_PROGRESS",
          2016-03-01T00:00:00.000Z,
        ],
        [
          "DENIED",
          2016-04-01T00:00:00.000Z,
        ],
        [
          "DENIED",
          2016-05-01T00:00:00.000Z,
        ],
        [
          "COMPLETED",
          2016-05-02T00:00:00.000Z,
        ],
        [
          "ALMOST",
          2019-02-01T00:00:00.000Z,
        ],
        [
          "ALMOST",
          2019-02-02T00:00:00.000Z,
        ],
        [
          "ALMOST",
          2020-02-02T00:00:00.000Z,
        ],
      ]
    `);
  });

  test("when list is shuffled, some eligibilityDates are undefined, and sorting by review status and eligibility date", () => {
    const datesWithUndefinedMembers =
      getDatesWithUndefinedMembers(orderedDates);
    const opportunities = initOpportunitiesList(
      orderedReviewStatuses,
      datesWithUndefinedMembers,
    );
    expect(
      shuffle(opportunities)
        .sort(
          buildOpportunityCompareFunction([
            { field: "reviewStatus" },
            { field: "eligibilityDate" },
          ]),
        )
        .map((a) => a.reviewStatus),
    ).toEqual(orderedReviewStatuses);
  });

  describe("when executed via the opportunity compare function", () => {
    test("when list is shuffled and there are undefined eligibility dates", () => {
      const datesWithUndefinedMembers =
        getDatesWithUndefinedMembers(orderedDates);
      const opportunities = initOpportunitiesList(
        orderedReviewStatuses,
        datesWithUndefinedMembers,
        "SUPERVISION",
      );
      const sortedReviewStatuses = shuffle(opportunities)
        .sort((a, b) => a.compare(b))
        .map((a) => a.reviewStatus);
      expect(sortedReviewStatuses).toEqual(sortedReviewStatuses);
    });

    test("when list is shuffled and sorting by eligibility date", () => {
      const opportunities = initOpportunitiesList(
        orderedReviewStatuses,
        orderedDates,
        "INCARCERATION",
      );
      expect(
        shuffle(opportunities)
          .sort((a, b) => a.compare(b))
          .map((a) => [a.reviewStatus, a.eligibilityDate]),
      ).toMatchInlineSnapshot(`
        [
          [
            "PENDING",
            2016-02-01T00:00:00.000Z,
          ],
          [
            "IN_PROGRESS",
            2016-03-01T00:00:00.000Z,
          ],
          [
            "DENIED",
            2016-04-01T00:00:00.000Z,
          ],
          [
            "DENIED",
            2016-05-01T00:00:00.000Z,
          ],
          [
            "COMPLETED",
            2016-05-02T00:00:00.000Z,
          ],
          [
            "ALMOST",
            2019-02-01T00:00:00.000Z,
          ],
          [
            "ALMOST",
            2019-02-02T00:00:00.000Z,
          ],
          [
            "ALMOST",
            2020-02-02T00:00:00.000Z,
          ],
        ]
      `);
    });

    test("when list is shuffled, some eligibilityDates are undefined, and sorting by eligibility date", () => {
      const datesWithUndefinedMembers =
        getDatesWithUndefinedMembers(orderedDates);
      const opportunities = initOpportunitiesList(
        orderedReviewStatuses,
        datesWithUndefinedMembers,
        "INCARCERATION",
      );
      expect(
        shuffle(opportunities)
          .sort((a, b) => a.compare(b))
          .map((a) => a.eligibilityDate),
      ).toEqual(
        datesWithUndefinedMembers
          .filter((d) => d !== undefined)
          .concat(datesWithUndefinedMembers.filter((d) => d === undefined)),
      );
    });
  });

  describe("when receiving the sort modifier", () => {
    test("asc", () => {
      const opportunities = initOpportunitiesList(
        orderedReviewStatuses,
        orderedDates,
      );

      const sorted = opportunities.sort(
        buildOpportunityCompareFunction([
          { field: "reviewStatus", sortDirection: "asc" },
        ]),
      );

      expect(sorted.map((o) => o.reviewStatus)).toEqual(orderedReviewStatuses);
    });

    test("desc", () => {
      const opportunities = initOpportunitiesList(
        orderedReviewStatuses,
        orderedDates,
      );

      const sorted = opportunities.sort(
        buildOpportunityCompareFunction([
          { field: "reviewStatus", sortDirection: "desc" },
        ]),
      );

      expect(sorted.map((o) => o.reviewStatus)).toEqual(
        reverse(orderedReviewStatuses),
      );
    });
  });
});
