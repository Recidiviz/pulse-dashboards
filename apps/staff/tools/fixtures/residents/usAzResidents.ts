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

import { ResidentFixture } from "../residents";

export const usAzResidents: ResidentFixture[] = [
  {
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
  {
    allEligibleOpportunities: ["usAzOverdueForACISTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES005",
    displayId: "RES005",
    personName: {
      givenNames: "TRAVIS",
      middleNames: "MORGAN",
      surname: "SHAH",
    },
    gender: "MALE",
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-07-17",
    releaseDate: "2025-09-24",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usAzOverdueForACISTPR"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES006",
    displayId: "RES006",
    personName: {
      givenNames: "ILYAS",
      middleNames: "STEVEN",
      surname: "BAKER",
    },
    gender: "MALE",
    pseudonymizedId: "anonres006",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-03-17",
    releaseDate: "2025-11-16",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usAzOverdueForACISDTP"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES007",
    displayId: "RES007",
    personName: {
      givenNames: "BENJAMIN",
      middleNames: "WALTER",
      surname: "KNOX",
    },
    gender: "MALE",
    pseudonymizedId: "anonres007",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER1",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-07-17",
    releaseDate: "2025-09-24",
    metadata: {},
  },
  {
    allEligibleOpportunities: ["usAzOverdueForACISDTP"],
    stateCode: "US_AZ",
    personExternalId: "AZ_RES008",
    displayId: "RES008",
    personName: {
      givenNames: "ELIF",
      middleNames: "JAMES",
      surname: "CARTER",
    },
    gender: "MALE",
    pseudonymizedId: "anonres008",
    facilityId: "FACILITY2",
    unitId: "UNIT B",
    officerId: "OFFICER1",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-03-17",
    releaseDate: "2025-11-16",
    metadata: {},
  },
];
