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

import { omit } from "lodash";

import {
  UsMeEarlyTerminationReferralRecordRaw,
  usMeEarlyTerminationSchema,
} from "..";

const defaultEligibleCriteria = {
  usMeSupervisionIsNotIcIn: null,
  usMePaidAllOwedRestitution: null,
  noConvictionWithin6Months: null,
  supervisionLevelIsMediumOrLower: {
    supervisionLevel: "MEDIUM",
  },
  usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: {
    eligibleDate: "2022-01-03",
  },
};

test("transform record with restitution case", () => {
  const rawRecord: UsMeEarlyTerminationReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      ...defaultEligibleCriteria,
      usMePaidAllOwedRestitution: { amountOwed: 0 },
    },
    ineligibleCriteria: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  };

  expect(usMeEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record without restitution case", () => {
  const rawRecord: UsMeEarlyTerminationReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: defaultEligibleCriteria,
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  };

  expect(usMeEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record with restitution ineligibleCriteria", () => {
  const rawRecord: UsMeEarlyTerminationReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: omit(
      defaultEligibleCriteria,
      "usMePaidAllOwedRestitution",
    ),
    ineligibleCriteria: {
      usMePaidAllOwedRestitution: {
        amountOwed: 500,
      },
    },
    isEligible: false,
    isAlmostEligible: true,
    metadata: {},
  };

  expect(usMeEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record with pending violation ineligibleCriteria", () => {
  const rawRecord: UsMeEarlyTerminationReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: omit(
      defaultEligibleCriteria,
      "usMeNoPendingViolationsWhileSupervised",
    ),
    ineligibleCriteria: {
      usMeNoPendingViolationsWhileSupervised: {
        currentStatus: "Pending Violation",
        violationDate: "2022-07-13",
      },
    },
    isEligible: false,
    isAlmostEligible: true,
    metadata: {},
  };

  expect(usMeEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record with null pending violation criteria", () => {
  const rawRecord: UsMeEarlyTerminationReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      ...defaultEligibleCriteria,
      usMeNoPendingViolationsWhileSupervised: null,
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  };

  expect(usMeEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});
