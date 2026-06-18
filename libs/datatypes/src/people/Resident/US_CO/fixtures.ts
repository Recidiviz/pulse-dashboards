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
import { RawResidentRecord, residentRecordSchema } from "../schema";

export const rawUsCoResidents: Array<RawResidentRecord> = [
  {
    displayId: "RES001",
    admissionDate: relativeFixtureDate({ years: -1, days: -97 }),
    gender: "MALE",
    personName: {
      givenNames: "John",
      middleNames: "Michael",
      surname: "Smith",
    },
    personExternalId: "RES001",
    recordId: "us_co_RES001",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres001",
    facilityId: "CO_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_CO",
    metadata: {
      stateCode: "US_CO",
      incarcerationStartDate: relativeFixtureDate({ years: -1, days: -97 }),
      pedTent: relativeFixtureDate({ years: 1, months: 3 }),
      mrdTent: relativeFixtureDate({ years: 2 }),
      sddTent: null,
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
    displayId: "RES002",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    gender: "FEMALE",
    personName: {
      givenNames: "Jane",
      middleNames: "Marie",
      surname: "Johnson",
    },
    personExternalId: "RES002",
    recordId: "us_co_RES002",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres002",
    facilityId: "CO_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_CO",
    metadata: {
      stateCode: "US_CO",
      incarcerationStartDate: relativeFixtureDate({ years: -2, months: -6 }),
      pedTent: relativeFixtureDate({ months: 8 }),
      mrdTent: relativeFixtureDate({ years: 1, months: 6 }),
      sddTent: relativeFixtureDate({ years: 3 }),
      creditActivity: [],
      lastUpdatedDate: relativeFixtureDate({ days: -3 }),
    },
  },
];

export const usCoResidents = rawUsCoResidents.map((r) =>
  residentRecordSchema.parse(r),
);
