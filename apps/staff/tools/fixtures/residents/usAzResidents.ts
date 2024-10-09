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

export const usAzResidents: Omit<
  WorkflowsResidentRecord,
  "personType" | "recordId"
>[] = [
  {
    // TODO($6489): Look at relaxing typing to be string[]
    // @ts-expect-error
    allEligibleOpportunities: ["usAzReleaseToTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES001",
    displayId: "RES001",
    personName: {
      givenNames: "ELINOR",
      middleNames: "MAJA",
      surname: "SLOAN",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    officerId: "OFFICER1",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: {},
  },
  {
    // @ts-expect-error
    allEligibleOpportunities: ["usAzReleaseToTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES002",
    displayId: "RES002",
    personName: {
      givenNames: "MICHAEL",
      middleNames: "JAMES",
      surname: "MOONEY",
    },
    gender: "MALE",
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY2",
    unitId: "UNIT A",
    officerId: "OFFICER2",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2026-01-07",
    metadata: {},
  },
  {
    // @ts-expect-error
    allEligibleOpportunities: ["usAzReleaseToTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES003",
    displayId: "RES003",
    personName: {
      givenNames: "SEBASTIEN",
      middleNames: "HARRY",
      surname: "BOSE",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-05-17",
    releaseDate: "2025-07-24",
    metadata: {},
  },
  {
    // @ts-expect-error
    allEligibleOpportunities: ["usAzReleaseToTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES004",
    displayId: "RES004",
    personName: {
      givenNames: "SASHA",
      middleNames: "GIDEON",
      surname: "BURCH",
    },
    gender: "MALE",
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-09-17",
    releaseDate: "2023-09-16",
    metadata: {},
  },
];
