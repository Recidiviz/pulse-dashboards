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

import { relativeFixtureDate } from "../../../utils/zod";
import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";

export const rawUsCoResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_CO",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: {
      givenNames: "John",
      middleNames: "Michael",
      surname: "Smith",
    },
    facilityId: "CO_DEMO_FACILITY",
  },
  {
    stateCode: "US_CO",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: {
      givenNames: "Jane",
      middleNames: "Marie",
      surname: "Johnson",
    },
    facilityId: "CO_DEMO_FACILITY",
  },
];

export const usCoResidentCommon = rawUsCoResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsCoResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsCoResidentCommon[0],
    recordId: "us_co_RES001",
    allEligibleOpportunities: [],
    stateCode: "US_CO",
    gender: "MALE",
    custodyLevel: "MINIMUM",
    facilityUnitId: null,
    unitId: null,
    admissionDate: relativeFixtureDate({ years: -1, days: -97 }),
    metadata: {
      stateCode: "US_CO",
      incarcerationStartDate: relativeFixtureDate({ years: -1, days: -97 }),
      pedTent: relativeFixtureDate({ years: 1, months: 3 }),
      mrdTent: relativeFixtureDate({ years: 2 }),
      sddTent: null,
      cohortLabel: "STANDARD",
      creditActivity: [
        {
          creditDate: relativeFixtureDate({ months: -1 }),
          creditType: "EARNED_TIME",
          creditsEarned: 10,
          goodTimeChangeReason: null,
          earnedTimeStatus: "ELIGIBLE",
        },
        {
          creditDate: relativeFixtureDate({ months: -1 }),
          creditType: "ACHIEVEMENT",
          creditsEarned: 15,
          goodTimeChangeReason: "Completed GED program",
          earnedTimeStatus: null,
        },
        {
          creditDate: relativeFixtureDate({ months: -2 }),
          creditType: "EARNED_TIME",
          creditsEarned: 10,
          goodTimeChangeReason: null,
          earnedTimeStatus: "ELIGIBLE",
        },
        {
          creditDate: relativeFixtureDate({ months: -2 }),
          creditType: "GOOD_TIME",
          creditsEarned: 5,
          goodTimeChangeReason: null,
          earnedTimeStatus: null,
        },
        {
          creditDate: relativeFixtureDate({ months: -3 }),
          creditType: "EARNED_TIME",
          creditsEarned: 8,
          goodTimeChangeReason: null,
          earnedTimeStatus: "ELIGIBLE",
        },
        {
          creditDate: relativeFixtureDate({ months: -3 }),
          creditType: "OTHER",
          creditsEarned: 2,
          goodTimeChangeReason: "Adjustment",
          earnedTimeStatus: null,
        },
        {
          creditDate: relativeFixtureDate({ months: -4 }),
          creditType: "EARNED_TIME",
          creditsEarned: 10,
          goodTimeChangeReason: null,
          earnedTimeStatus: "ELIGIBLE",
        },
      ],
      lastUpdatedDate: relativeFixtureDate({ days: -7 }),
    },
  },
  {
    ...rawUsCoResidentCommon[1],
    recordId: "us_co_RES002",
    allEligibleOpportunities: [],
    stateCode: "US_CO",
    gender: "FEMALE",
    custodyLevel: "MINIMUM",
    facilityUnitId: null,
    unitId: null,
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    metadata: {
      stateCode: "US_CO",
      incarcerationStartDate: relativeFixtureDate({ years: -2, months: -6 }),
      pedTent: relativeFixtureDate({ months: 8 }),
      mrdTent: relativeFixtureDate({ years: 1, months: 6 }),
      sddTent: relativeFixtureDate({ years: 3 }),
      cohortLabel: "LIFE_WITHOUT_PAROLE",
      creditActivity: [],
      lastUpdatedDate: relativeFixtureDate({ days: -3 }),
    },
  },
];

export const usCoResidents = rawUsCoResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
