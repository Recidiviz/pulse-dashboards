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

export const usTnResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES001",
    displayId: "dRES001",
    personName: {
      givenNames: "Carmen",
      surname: "Reyes",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 3, days: 300 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "Jessica",
      surname: "Ren",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres002",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -4, days: -400 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    stateCode: "US_TN",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "Fei",
      surname: "Jackson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -3, days: -100 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata: {},
  },
  {
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    stateCode: "US_TN",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "Geoff",
      surname: "Zhang",
    },
    gender: "INTERNAL_UNKNOWN",
    pseudonymizedId: "anonres004",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 200 }),
    metadata: {},
  },
];
