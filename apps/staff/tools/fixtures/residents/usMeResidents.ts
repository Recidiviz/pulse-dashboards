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

import { WorkflowsResidentRecord } from "../../../src/FirestoreStore";

export const usMeResidents: Omit<
  WorkflowsResidentRecord,
  "personType" | "recordId"
>[] = [
  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
      "usMeReclassificationReview",
    ],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES001",
    displayId: "dRES001",
    personName: {
      givenNames: "LUIS",
      surname: "GRANT",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -8, months: -1 }),
    releaseDate: relativeFixtureDate({ months: 35 }),
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: 5 }),
      portionServedNeeded: "2/3",
    },
  },
  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
      "usMeReclassificationReview",
      "usMeMediumTrustee",
    ],

    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "KARL",
      surname: "KLEIN",
    },
    gender: "MALE",
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: 2 }),
      portionServedNeeded: "2/3",
    },
  },
  {
    allEligibleOpportunities: [
      "usMeSCCP",
      "usMeWorkRelease",
      "usMeFurloughRelease",
    ],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "NICO",
      surname: "SCOTT",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6, days: 2 }),
    releaseDate: relativeFixtureDate({ years: 2 }),
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: -3 }),
      portionServedNeeded: "1/2",
    },
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "FRANK",
      surname: "HILL",
    },
    gender: "MALE",
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -31, days: 2 }),
    releaseDate: relativeFixtureDate({ months: 25 }),
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: -3 }),
      portionServedNeeded: "1/2",
    },
  },
  {
    allEligibleOpportunities: ["usMeSCCP"],

    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES005",
    displayId: "dRES005",
    personName: {
      givenNames: "DAVID",
      surname: "MOORE",
    },
    gender: "MALE",
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 5 }),
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: 5 }),
      portionServedNeeded: "1/2",
    },
  },
  {
    allEligibleOpportunities: ["usMeMediumTrustee"],

    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES006",
    displayId: "dRES006",
    personName: {
      givenNames: "MARILEE",
      surname: "POSDALE",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres006",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: "9999-12-01",
    metadata: {
      stateCode: "US_ME",
      sccpEligibilityDate: relativeFixtureDate({ months: 5 }),
      portionServedNeeded: "1/2",
    },
  },
];
