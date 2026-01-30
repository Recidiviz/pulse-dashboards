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

import { relativeFixtureDate } from "~datatypes";

import { ResidentFixture } from "../residents";

export const usUtResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: [],
    stateCode: "US_UT",
    personExternalId: "UT_RES001",
    displayId: "RES001",
    personName: {
      givenNames: "Jack",
      surname: "Johnson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    officerId: "OFFICER2",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    releaseDate: relativeFixtureDate({ years: 1, months: 6 }),
    metadata: {
      stateCode: "US_UT",
      paroleDate: relativeFixtureDate({ months: 10 }),
      programs: null,
    },
  },
  {
    allEligibleOpportunities: [],
    stateCode: "US_UT",
    personExternalId: "UT_RES002",
    displayId: "RES001",
    personName: {
      givenNames: "Greta",
      surname: "Brown",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    officerId: "OFFICER1",

    metadata: {
      stateCode: "US_UT",
      programs: [
        {
          program: "Anger Management",
          status: "SUCCESSFUL COMPLETION",
          completionDate: "2025-02-28",
        },
        {
          program: "Substance Abuse Program",
          status: "UNSUCCESSFUL COMPLETION",
          completionDate: "2024-10-15",
        },
      ],
      paroleDate: "2026-01-01",
    },
  },
  {
    allEligibleOpportunities: [],
    stateCode: "US_UT",
    personExternalId: "UT_RES003",
    displayId: "RES003",
    personName: {
      givenNames: "Marley",
      surname: "Jameson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    officerId: "OFFICER1",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -4 }),
    releaseDate: relativeFixtureDate({ years: 9, months: 6 }),
    metadata: {
      stateCode: "US_UT",
      paroleDate: relativeFixtureDate({ years: 1, months: 10 }),
      programs: [],
    },
  },
  {
    allEligibleOpportunities: [],
    stateCode: "US_UT",
    personExternalId: "UT_RES004",
    displayId: "RES004",
    personName: {
      givenNames: "Joseph",
      surname: "Ford",
    },
    officerId: "OFFICER2",
    gender: "FEMALE",
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY2",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -10 }),
    releaseDate: relativeFixtureDate({ years: 1, months: 6 }),
    metadata: {
      stateCode: "US_UT",
      programs: [
        {
          program: "Anger Management",
          status: "SUCCESSFUL COMPLETION",
          completionDate: "2025-02-28",
        },
        {
          program: "Substance Abuse Program",
          status: "SUCCESSFUL COMPLETION",
          completionDate: "2024-10-15",
        },
      ],
      paroleDate: "2026-01-01",
    },
  },
];
