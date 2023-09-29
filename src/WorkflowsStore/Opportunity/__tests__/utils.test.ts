/* eslint-disable @typescript-eslint/no-var-requires */
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
import tk from "timekeeper";

import { mockOpportunity } from "../../../core/__tests__/testUtils";
import {
  MOCK_OPPORTUNITY_CONFIGS,
  mockUsXxOpp,
  mockUsXxOppConfig,
} from "../__fixtures__";
import {
  OPPORTUNITY_CONFIGS,
  OpportunityHydratedHeader,
  OpportunityType,
} from "../OpportunityConfigs";
import { Opportunity } from "../types";
import {
  generateOpportunityHydratedHeader,
  generateOpportunityInitialHeader,
  monthsOrDaysRemainingFromToday,
  sortByEligibilityDateUndefinedFirst,
  sortByReviewStatus,
  sortByReviewStatusAndEligibilityDate,
} from "../utils";

jest.mock("../../subscriptions");
jest.mock("firebase/firestore");
jest.mock("../Forms/FormBase");

let opp1: Opportunity;
let opp2: Opportunity;
let opp3: Opportunity;

describe("monthsOrDaysRemainingFromToday", () => {
  beforeEach(() => {
    tk.freeze(new Date(2023, 1, 23));
  });

  afterAll(() => {
    tk.reset();
  });

  test("months remaining", () => {
    expect(monthsOrDaysRemainingFromToday(new Date(2023, 5, 23))).toEqual(
      "4 more months"
    );
  });

  test("days remaining", () => {
    expect(monthsOrDaysRemainingFromToday(new Date(2023, 1, 30))).toEqual(
      "7 more days"
    );
  });
});

describe("sort", () => {
  beforeEach(() => {
    opp1 = {
      ...mockOpportunity,
      reviewStatus: "PENDING",
      eligibilityDate: new Date(2022, 10, 5),
    };

    opp2 = {
      ...mockOpportunity,
      reviewStatus: "IN_PROGRESS",
      eligibilityDate: new Date(2022, 10, 8),
    };

    opp3 = {
      ...mockOpportunity,
      reviewStatus: "DENIED",
      eligibilityDate: new Date(2022, 10, 7),
    };
  });

  test("sort by rank", () => {
    const opps = [opp2, opp3, opp1];
    expect(opps.sort(sortByReviewStatus).map((o) => o.reviewStatus)).toEqual([
      "PENDING",
      "IN_PROGRESS",
      "DENIED",
    ]);
  });

  test("sort by rank and eligibility date", () => {
    const opp4: Opportunity = {
      ...mockOpportunity,
      reviewStatus: "DENIED",
      eligibilityDate: new Date(2022, 10, 6),
    };
    const opps = [opp2, opp4, opp3, opp1];
    expect(
      opps
        .sort(sortByReviewStatusAndEligibilityDate)
        .map((o) => o.eligibilityDate)
    ).toEqual([
      new Date(2022, 10, 5),
      new Date(2022, 10, 8),
      new Date(2022, 10, 6),
      new Date(2022, 10, 7),
    ]);
  });

  test("sort by eligibility date unknowns first", () => {
    const opp4: Opportunity = {
      ...mockOpportunity,
      reviewStatus: "IN_PROGRESS",
      eligibilityDate: undefined,
    };
    const opps = [opp2, opp4, opp3, opp1];
    expect(
      opps
        .sort(sortByEligibilityDateUndefinedFirst)
        .map((o) => o.eligibilityDate)
    ).toEqual([
      undefined,
      new Date(2022, 10, 5),
      new Date(2022, 10, 7),
      new Date(2022, 10, 8),
    ]);
  });
});

describe("Generate header", () => {
  const TEST_FIELD = "TEST_FIELD";
  const TEST_TITLE = "TEST_PERSON";

  beforeAll(() => {
    // TODO(#4090): refactor to use jest.replaceProperty() once jest is updated to recognize the function.
    OPPORTUNITY_CONFIGS[mockUsXxOpp] = mockUsXxOppConfig;
  });

  afterAll(() => {
    // TODO(#4090): refactor to use jest.replaceProperty() once jest is updated to recognize the function.
    OPPORTUNITY_CONFIGS[mockUsXxOpp] = undefined as any;
  });

  test("when initialHeader is provided in config", () => {
    const header = generateOpportunityInitialHeader(
      mockUsXxOpp,
      TEST_TITLE,
      TEST_FIELD
    );
    expect(header).toMatchSnapshot();
  });

  test("when initialHeader is not provided in config", () => {
    OPPORTUNITY_CONFIGS[mockUsXxOpp].initialHeader = undefined;
    const header = generateOpportunityInitialHeader(
      mockUsXxOpp,
      TEST_TITLE,
      TEST_FIELD
    );
    expect(header).toMatchSnapshot();
  });
});

const hydratedHeaders: OpportunityHydratedHeader[] = [];
describe("Generate hydrated header", () => {
  beforeAll(() => {
    // TODO(#4090): refactor to use jest.replaceProperty() once jest is updated to recognize the function.
    Object.entries(MOCK_OPPORTUNITY_CONFIGS).forEach(([key, value], index) => {
      OPPORTUNITY_CONFIGS[key as OpportunityType] = value;
      hydratedHeaders.push(
        generateOpportunityHydratedHeader(key as OpportunityType, index)
      );
    });
  });

  afterAll(() => {
    // TODO(#4090): refactor to use jest.replaceProperty() once jest is updated to recognize the function.
    Object.keys(MOCK_OPPORTUNITY_CONFIGS).forEach((key) => {
      OPPORTUNITY_CONFIGS[key as OpportunityType] = undefined as any;
    });
  });

  test("to generate correctly", () => {
    expect(hydratedHeaders).toBeDefined();
    expect(hydratedHeaders.length).toEqual(
      Object.keys(MOCK_OPPORTUNITY_CONFIGS).length
    );
  });

  test("to match snapshot", () => {
    expect(hydratedHeaders).toMatchSnapshot();
  });

  test("to match snapshot", () => {
    hydratedHeaders.forEach((hydratedHeader, index) => {
      const eligibilityOrFullText =
        hydratedHeader.eligibilityText || hydratedHeader.fullText;
      expect(eligibilityOrFullText?.startsWith(index.toString())).toBeTrue();
    });
  });
});
