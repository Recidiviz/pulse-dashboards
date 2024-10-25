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

export const usIdResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: ["usIdExpandedCRC"],
    stateCode: "US_ID",
    personExternalId: "ID_RES001",
    displayId: "RES001",
    personName: {
      givenNames: "Andre",
      middleNames: "Isaiah",
      surname: "Hall",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2020-03-12",
      crcFacility: "CRC Facility 1",
    },
  },
  {
    allEligibleOpportunities: ["usIdCRCWorkRelease"],
    stateCode: "US_ID",
    personExternalId: "ID_RES002",
    displayId: "RES002",
    personName: {
      givenNames: "Antonio",
      surname: "Martin",
    },
    gender: "MALE",
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-01-12",
    releaseDate: "2026-07-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2021-03-12",
      crcFacility: "CRC Facility 1",
    },
  },
  {
    allEligibleOpportunities: ["usIdCRCWorkRelease", "usIdCRCResidentWorker"],
    stateCode: "US_ID",
    personExternalId: "ID_RES003",
    displayId: "RES003",
    personName: {
      givenNames: "Walter",
      surname: "Brown",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2017-07-12",
    releaseDate: "2027-06-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2026-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2018-05-18",
      crcFacility: "CRC Facility 1",
    },
  },
  {
    allEligibleOpportunities: ["usIdCRCResidentWorker"],
    stateCode: "US_ID",
    personExternalId: "ID_RES004",
    displayId: "RES004",
    personName: {
      givenNames: "Nathan",
      surname: "Torres",
    },
    gender: "MALE",
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-07-12",
    releaseDate: "2027-06-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-09-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2023-03-12",
      crcFacility: "CRC Facility 1",
    },
  },
];
