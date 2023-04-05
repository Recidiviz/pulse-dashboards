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

import { identity } from "lodash";

import { Client } from "../../Client";
import { getRecordTransformer } from "../UsMiClassificationReviewOpportunity";

const mockClient = {
  rootStore: {
    workflowsStore: {
      formatSupervisionLevel: identity,
    },
  },
};

test("transform record for initial CR", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-1",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
      },
      usMiPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
    },
  };

  expect(
    getRecordTransformer(mockClient as unknown as Client)(rawRecord)
  ).toMatchSnapshot();
});

test("transform record for six-month CR", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-2",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
      },
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2019-01-12",
      },
    },
  };

  expect(
    getRecordTransformer(mockClient as unknown as Client)(rawRecord)
  ).toMatchSnapshot();
});
