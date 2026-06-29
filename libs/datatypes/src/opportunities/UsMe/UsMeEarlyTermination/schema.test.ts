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

import { omit } from "lodash-es";

import { usMeEarlyTerminationFixturesRaw } from "./fixtures";
import {
  UsMeEarlyTerminationRecord,
  usMeEarlyTerminationSchema,
} from "./schema";

test.each(
  Object.keys(usMeEarlyTerminationFixturesRaw) as Array<
    keyof typeof usMeEarlyTerminationFixturesRaw
  >,
)("schema for %s", (key) => {
  expect(
    usMeEarlyTerminationSchema.parse(usMeEarlyTerminationFixturesRaw[key]),
  ).toMatchSnapshot();
});

const defaultEligibleCriteria: UsMeEarlyTerminationRecord["input"]["eligibleCriteria"] =
  {
    usMePaidAllOwedRestitution: null,
    noConvictionWithin6Months: null,
    supervisionLevelIsMediumOrLower: { supervisionLevel: "MEDIUM" },
    usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: {
      eligibleDate: "2022-01-03",
    },
  };

const defaultRawRecord: UsMeEarlyTerminationRecord["input"] = {
  stateCode: "US_ME",
  externalId: "abc123",
  eligibleCriteria: defaultEligibleCriteria,
  ineligibleCriteria: {},
  isEligible: true,
  isAlmostEligible: false,
  metadata: {},
};

test("transform record with restitution case", () => {
  expect(
    usMeEarlyTerminationSchema.parse({
      ...defaultRawRecord,
      eligibleCriteria: {
        ...defaultEligibleCriteria,
        usMePaidAllOwedRestitution: { amountOwed: 0 },
      },
    }),
  ).toMatchSnapshot();
});

test("transform record without restitution case", () => {
  expect(usMeEarlyTerminationSchema.parse(defaultRawRecord)).toMatchSnapshot();
});

test("transform record with restitution ineligibleCriteria", () => {
  expect(
    usMeEarlyTerminationSchema.parse({
      ...defaultRawRecord,
      eligibleCriteria: omit(
        defaultEligibleCriteria,
        "usMePaidAllOwedRestitution",
      ),
      ineligibleCriteria: { usMePaidAllOwedRestitution: { amountOwed: 500 } },
      isEligible: false,
      isAlmostEligible: true,
    }),
  ).toMatchSnapshot();
});

test("transform record with pending violation ineligibleCriteria", () => {
  expect(
    usMeEarlyTerminationSchema.parse({
      ...defaultRawRecord,
      ineligibleCriteria: {
        usMeNoPendingViolationsWhileSupervised: {
          currentStatus: "Pending Violation",
          violationDate: "2022-07-13",
        },
      },
      isEligible: false,
      isAlmostEligible: true,
    }),
  ).toMatchSnapshot();
});

test("transform record with null pending violation criteria", () => {
  expect(
    usMeEarlyTerminationSchema.parse({
      ...defaultRawRecord,
      eligibleCriteria: {
        ...defaultEligibleCriteria,
        usMeNoPendingViolationsWhileSupervised: null,
      },
    }),
  ).toMatchSnapshot();
});
