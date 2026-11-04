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

import { RawUsNycResidentJiiData } from "~@jii/schemas";
import { relativeFixtureDate } from "~datatypes";

export const usNycResidentJiiDataFixtures: RawUsNycResidentJiiData[] = [
  {
    stateCode: "US_NYC",
    lastUpdatedDate: relativeFixtureDate(),
    housingFacility: "Demo Detention Center",
    commissaryBalance: 42.5,
    emergencyContactFullName: {
      givenNames: "Sam",
      middleNames: null,
      surname: "Rivera",
    },
    emergencyContactAddress: {
      addressLine1: "123 Example Street",
      addressLine2: "Apt 4B",
      addressCity: "New York",
      addressState: "NY",
    },
    legalStatus: "Pre-sentence",
    preSentenceDockets: [
      {
        docketNumber: "CR-000101-26NY",
        nextCourtDate: relativeFixtureDate({ weeks: 2 }),
        nextCourtLocation: "Demo Criminal Court",
        nextCourtBorough: "N",
      },
      {
        docketNumber: "CR-000102-26NY",
        nextCourtDate: null,
        nextCourtLocation: null,
        nextCourtBorough: null,
      },
    ],
    sentencedDate: null,
    projectedDischargeDate: null,
  },
  {
    stateCode: "US_NYC",
    lastUpdatedDate: relativeFixtureDate(),
    housingFacility: "Demo Detention Center",
    commissaryBalance: 0,
    emergencyContactFullName: {
      givenNames: "Taylor",
      middleNames: null,
      surname: "Chen",
    },
    emergencyContactAddress: {
      addressLine1: "456 Sample Avenue",
      addressLine2: null,
      addressCity: "Brooklyn",
      addressState: "NY",
    },
    legalStatus: "Sentenced",
    preSentenceDockets: [],
    sentencedDate: relativeFixtureDate({ months: -3 }),
    projectedDischargeDate: relativeFixtureDate({ months: 5 }),
  },
];
