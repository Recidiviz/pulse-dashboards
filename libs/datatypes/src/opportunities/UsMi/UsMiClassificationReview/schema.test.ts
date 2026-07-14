// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { z } from "zod";

import { usMiClassificationReviewFixtures } from "./fixtures";
import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "./schema";

const schema = usMiClassificationReviewSchemaForSupervisionLevelFormatter();

type RawRecord = z.input<typeof schema>;

test.each(
  Object.keys(usMiClassificationReviewFixtures) as Array<
    keyof typeof usMiClassificationReviewFixtures
  >,
)("schema for %s", (key) => {
  expect(
    schema.parse(usMiClassificationReviewFixtures[key].input),
  ).toMatchSnapshot();
});

test("transforms records with eligible and ineligible criteria", () => {
  const rawRecord: RawRecord = {
    stateCode: "US_MI",
    externalId: "cr-eligible-4",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        mediumIsLowestSupervisionLevelAllowed: true,
      },
    },
    ineligibleCriteria: {
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
    },
    isEligible: false,
    isAlmostEligible: true,
  };

  expect(schema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record for initial CR", () => {
  const rawRecord: RawRecord = {
    stateCode: "US_MI",
    externalId: "cr-eligible-1",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        mediumIsLowestSupervisionLevelAllowed: null,
      },
      usMiPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
    },
    ineligibleCriteria: {},
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
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(schema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record for six-month CR", () => {
  const rawRecord: RawRecord = {
    stateCode: "US_MI",
    externalId: "cr-eligible-2",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        mediumIsLowestSupervisionLevelAllowed: null,
      },
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2019-01-12",
      },
    },
    ineligibleCriteria: {},
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
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(schema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record for missing usMiNotAlreadyOnLowestEligibleSupervisionLevel", () => {
  const rawRecord: RawRecord = {
    stateCode: "US_MI",
    externalId: "cr-eligible-3",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: null,
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2023-03-14",
      },
    },
    ineligibleCriteria: {},
    metadata: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(schema.parse(rawRecord)).toMatchSnapshot();
});

test("expect to fail if both date reasons are set", () => {
  // Not typed as RawRecord because this is intentionally invalid
  const rawRecord: Record<string, unknown> = {
    stateCode: "US_MI",
    externalId: "cr-eligible-2",
    eligibleCriteria: {
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        supervisionLevel: "MAXIMUM",
        mediumIsLowestSupervisionLevelAllowed: null,
      },
      usMiPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
      usMiSixMonthsPastLastClassificationReviewDate: {
        eligibleDate: "2019-01-12",
      },
    },
    ineligibleCriteria: {},
    metadata: { recommendedSupervisionLevel: "MEDIUM" },
  };

  expect(() => schema.parse(rawRecord)).toThrow();
});
