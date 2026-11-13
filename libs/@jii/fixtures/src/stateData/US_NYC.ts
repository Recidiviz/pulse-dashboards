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
    housingFacility: "IMS",
    commissaryBalance: 42.5,
    emergencyContactFullName: {
      givenNames: "Sam",
      middleNames: null,
      surname: "Rivera",
    },
    emergencyContactAddress: {
      addressLine1: "123 EXAMPLE STREET",
      addressLine2: "APT 4B",
      addressCity: "NEW YORK",
      addressState: "NY",
    },
    legalStatus: "Pre-sentence",
    preSentenceDockets: [
      {
        docketNumber: "CR-000101-26NY",
        nextCourtDate: relativeFixtureDate({ weeks: 2 }),
        nextCourtLocation: "FKA3",
        nextCourtBorough: "K",
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
    housingFacility: "AMKC",
    commissaryBalance: 0,
    emergencyContactFullName: {
      givenNames: "Taylor",
      middleNames: null,
      surname: "Chen",
    },
    emergencyContactAddress: {
      addressLine1: "456 SAMPLE AVENUE",
      addressLine2: null,
      addressCity: "BROOKLYN",
      addressState: "NY",
    },
    legalStatus: "Sentenced",
    preSentenceDockets: [],
    sentencedDate: relativeFixtureDate({ months: -3 }),
    projectedDischargeDate: relativeFixtureDate({ months: 5 }),
  },
  {
    stateCode: "US_NYC",
    lastUpdatedDate: relativeFixtureDate(),
    housingFacility: "RESH",
    commissaryBalance: 15.25,
    emergencyContactFullName: null,
    emergencyContactAddress: null,
    legalStatus: "Sentenced",
    preSentenceDockets: [],
    sentencedDate: null,
    projectedDischargeDate: relativeFixtureDate({ months: 2 }),
  },
  {
    stateCode: "US_NYC",
    lastUpdatedDate: relativeFixtureDate(),
    housingFacility: "WF",
    commissaryBalance: 0,
    emergencyContactFullName: {
      givenNames: "Casey",
      middleNames: null,
      surname: "Patel",
    },
    emergencyContactAddress: {
      addressLine1: "321 FIXTURE LANE",
      addressLine2: "UNIT 2",
      addressCity: "BRONX",
      addressState: "NY",
    },
    legalStatus: "Sentenced",
    preSentenceDockets: [],
    sentencedDate: relativeFixtureDate({ months: -1 }),
    projectedDischargeDate: null,
  },
  {
    stateCode: "US_NYC",
    lastUpdatedDate: relativeFixtureDate(),
    housingFacility: "UNFA",
    commissaryBalance: 27.75,
    emergencyContactFullName: {
      givenNames: "Riley",
      middleNames: null,
      surname: "Nguyen",
    },
    emergencyContactAddress: {
      addressLine1: "654 MOCK BOULEVARD",
      addressLine2: null,
      addressCity: "STATEN ISLAND",
      addressState: "NY",
    },
    legalStatus: "Sentenced",
    preSentenceDockets: [
      {
        docketNumber: "CR-000105-26NY",
        nextCourtDate: relativeFixtureDate({ weeks: 3 }),
        nextCourtLocation: "SQC3",
        nextCourtBorough: "Q",
      },
    ],
    sentencedDate: relativeFixtureDate({ months: -2 }),
    projectedDischargeDate: relativeFixtureDate({ months: 4 }),
  },
];
