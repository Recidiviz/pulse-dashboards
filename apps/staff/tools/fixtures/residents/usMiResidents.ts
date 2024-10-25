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

import { relativeFixtureDate } from "~datatypes";

import { ResidentFixture } from "../residents";

export const usMiResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: [
      "usMiReclassificationRequest",
      "usMiSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
    ],
    stateCode: "US_MI",
    personExternalId: "RES019",
    displayId: "dRES019",
    personName: {
      givenNames: "Mark",
      surname: "Carter",
    },
    gender: "MALE",
    pseudonymizedId: "anonres019",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -8, months: -1 }),
    releaseDate: relativeFixtureDate({ months: 35 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: [
      "usMiReclassificationRequest",
      "usMiSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
    ],
    stateCode: "US_MI",
    personExternalId: "RES020",
    displayId: "dRES020",
    personName: {
      givenNames: "Wendy",
      surname: "Rubins",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres020",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: [
      "usMiReclassificationRequest",
      "usMiSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
    ],
    stateCode: "US_MI",
    personExternalId: "RES021",
    displayId: "dRES021",
    personName: {
      givenNames: "Kevin",
      surname: "Butcher",
    },
    gender: "MALE",
    pseudonymizedId: "anonres021",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: [
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
    ],
    officerId: "OFFICER8",
    stateCode: "US_MI",
    personExternalId: "RES022",
    displayId: "dRES022",
    personName: {
      givenNames: "Tarek",
      surname: "Abu",
    },
    gender: "MALE",
    pseudonymizedId: "anonres022",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -20, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 3 }),
    metadata: {},
  },
];
