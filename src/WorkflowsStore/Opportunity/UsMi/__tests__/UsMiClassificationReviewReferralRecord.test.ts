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

import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "..";

const mockClient = {
  rootStore: {
    workflowsStore: {
      formatSupervisionLevel: identity,
    },
  },
};

const transformer = usMiClassificationReviewSchemaForSupervisionLevelFormatter(
  mockClient.rootStore.workflowsStore.formatSupervisionLevel
).parse;

test("transform record for initial CR", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-1",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        requiresSoRegistration: null,
      },
      usMiPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
    },
    metadata: { recommendedSupervisionLevel: "MEDIUM" },
    caseNotes: {
      "Recommended supervision level": [
        {
          eventDate: null,
          noteBody: "MEDIUM",
          noteTitle: null,
        },
      ],
      "Recent employment (last 6 months)": [
        {
          eventDate: "2022-10-23",
          noteBody: "Got a new job",
          noteTitle: "Employed at Big Bob's Burger Joint",
        },
      ],
    },
  };

  expect(transformer(rawRecord)).toMatchSnapshot();
});

test("transform record for six-month CR", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-2",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        requiresSoRegistration: null,
      },
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2019-01-12",
      },
    },
    metadata: { recommendedSupervisionLevel: "MEDIUM" },
    caseNotes: {
      "Recommended supervision level": [
        {
          eventDate: null,
          noteBody: "MEDIUM",
          noteTitle: null,
        },
      ],
    },
  };

  expect(transformer(rawRecord)).toMatchSnapshot();
});

test("expect to fail if both date reasons are set", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-2",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        requiresSoRegistration: null,
      },
      usMiPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2019-01-12",
      },
    },
    metadata: { recommendedSupervisionLevel: "MEDIUM" },
    caseNotes: {
      "Recommended supervision level": [
        {
          eventDate: null,
          noteBody: "MEDIUM",
          noteTitle: null,
        },
      ],
    },
  };

  expect(() => transformer(rawRecord)).toThrow();
});

test("transform record for missing usMiNotAlreadyOnLowestEligibleSupervisionLevel", () => {
  const rawRecord: Record<string, any> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-3",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: null,
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2023-03-14",
      },
    },
    metadata: {},
  };

  expect(transformer(rawRecord)).toMatchSnapshot();
});
