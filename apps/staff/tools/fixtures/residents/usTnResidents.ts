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

import { WorkflowsResidentRecord } from "../../../src/FirestoreStore";

export const usTnResidents: Omit<
  WorkflowsResidentRecord,
  "personType" | "recordId"
>[] = [
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES001",
    displayId: "dRES001",
    personName: {
      givenNames: "CARMEN",
      surname: "REYES",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "JESSICA",
      surname: "REN",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres002",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT B",
    facilityUnitId: "BLEDSOE_CC‡UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2024-11-27",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usTnAnnualReclassification"],
    stateCode: "US_TN",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "FEI",
      surname: "JACKSON",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT C",
    facilityUnitId: "BLEDSOE_CC‡UNIT C",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-08-12",
    releaseDate: "2025-01-01",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usTnAnnualReclassification"],
    stateCode: "US_TN",
    personExternalId: "RES004",
    displayId: "dRES004",
    personName: {
      givenNames: "GEOFF",
      surname: "ZHANG",
    },
    gender: "INTERNAL_UNKNOWN",
    pseudonymizedId: "anonres004",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT D",
    facilityUnitId: "BLEDSOE_CC‡UNIT D",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-08-12",
    releaseDate: "2025-12-01",
    metadata: {},
  },
];
