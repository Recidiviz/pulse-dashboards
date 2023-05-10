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

import { transformReferral } from "../UsMeEarlyTerminationReferralRecord";

test("transform record with restitution case", () => {
  const rawRecord = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      usMePaidAllOwedRestitution: { amountOwed: 0 },
      noConvictionWithin6Months: null,
      onMediumSupervisionLevelOrLower: {
        supervisionLevel: "MEDIUM",
      },
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
        eligibleDate: "2022-01-03",
      },
    },
    ineligibleCriteria: {},
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform record without restitution case", () => {
  const rawRecord = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      usMePaidAllOwedRestitution: null,
      noConvictionWithin6Months: null,
      onMediumSupervisionLevelOrLower: {
        supervisionLevel: "MEDIUM",
      },
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
        eligibleDate: "2022-01-03",
      },
    },
    ineligibleCriteria: {},
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform record with restitution ineligibleCriteria", () => {
  const rawRecord = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      noConvictionWithin6Months: null,
      onMediumSupervisionLevelOrLower: {
        supervisionLevel: "MEDIUM",
      },
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
        eligibleDate: "2022-01-03",
      },
    },
    ineligibleCriteria: {
      usMePaidAllOwedRestitution: {
        amountOwed: 500,
      },
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform record with pending violation ineligibleCriteria", () => {
  const rawRecord = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      noConvictionWithin6Months: null,
      onMediumSupervisionLevelOrLower: {
        supervisionLevel: "MEDIUM",
      },
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
        eligibleDate: "2022-01-03",
      },
    },
    ineligibleCriteria: {
      usMeNoPendingViolationsWhileSupervised: {
        currentStatus: "Pending Violation",
        violationDate: "2022-07-13",
      },
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform record with null pending violation criteria", () => {
  const rawRecord = {
    stateCode: "US_ME",
    externalId: "abc123",
    eligibleCriteria: {
      noConvictionWithin6Months: null,
      onMediumSupervisionLevelOrLower: {
        supervisionLevel: "MEDIUM",
      },
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
        eligibleDate: "2022-01-03",
      },
      usMeNoPendingViolationsWhileSupervised: null,
    },
    ineligibleCriteria: {},
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
