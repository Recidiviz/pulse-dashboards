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

import { JusticeInvolvedPerson } from "../../types";
import { Opportunity } from "../types";
import {
  sortByReviewStatus,
  sortByReviewStatusAndEligibilityDate,
} from "../utils";

jest.mock("../../subscriptions");
jest.mock("../../../firestore");
jest.mock("../Forms/FormBase");

let opp1: Opportunity;
let opp2: Opportunity;
let opp3: Opportunity;

const mockOpportunityBase: Opportunity = {
  almostEligible: false,
  person: {} as JusticeInvolvedPerson,
  defaultEligibility: "ELIGIBLE",
  denial: undefined,
  denialReasonsMap: {},
  eligibilityDate: undefined,
  firstViewed: undefined,
  hydrate: () => undefined,
  isAlert: false,
  isHydrated: true,
  requirementsAlmostMet: [],
  requirementsMet: [],
  reviewStatus: "PENDING",
  setCompletedIfEligible: () => undefined,
  setDenialReasons: async () => undefined,
  setFirstViewedIfNeeded: () => undefined,
  setOtherReasonText: async () => undefined,
  supportsDenial: false,
  trackListViewed: () => undefined,
  trackPreviewed: () => undefined,
  type: "pastFTRD",
};

describe("sort", () => {
  beforeEach(() => {
    opp1 = {
      ...mockOpportunityBase,
      reviewStatus: "PENDING",
      eligibilityDate: new Date(2022, 10, 5),
    };

    opp2 = {
      ...mockOpportunityBase,
      reviewStatus: "IN_PROGRESS",
      eligibilityDate: new Date(2022, 10, 8),
    };

    opp3 = {
      ...mockOpportunityBase,
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
      ...mockOpportunityBase,
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
