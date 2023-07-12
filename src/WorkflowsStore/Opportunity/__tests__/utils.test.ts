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
import { Opportunity } from "../types";
import {
  monthsOrDaysRemainingFromToday,
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
});
