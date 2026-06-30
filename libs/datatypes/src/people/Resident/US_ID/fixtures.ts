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

import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";

export const rawUsIdResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_ID",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: { givenNames: "Andre", middleNames: "Isaiah", surname: "Hall" },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_ID",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: { givenNames: "Antonio", surname: "Martin" },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_ID",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003",
    displayId: "RES003",
    personName: { givenNames: "Walter", surname: "Brown" },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_ID",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004",
    displayId: "RES004",
    personName: { givenNames: "Nathan", surname: "Torres" },
    facilityId: "FACILITY1",
  },
];

export const usIdResidentCommon = rawUsIdResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsIdResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsIdResidentCommon[0],
    allEligibleOpportunities: ["usIdExpandedCRC", "usIdCustodyLevelDowngrade"],
    stateCode: "US_ID",
    recordId: "us_id_res001",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2020-03-12",
      crcFacilities: ["CRC LRC"],
    },
  },
  {
    ...rawUsIdResidentCommon[1],
    allEligibleOpportunities: [
      "usIdCRCWorkRelease",
      "usIdCustodyLevelDowngrade",
    ],
    stateCode: "US_ID",
    recordId: "us_id_res002",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-01-12",
    releaseDate: "2026-07-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2021-03-12",
      crcFacilities: ["CRC LRC", "CRC PRC"],
    },
  },
  {
    ...rawUsIdResidentCommon[2],
    allEligibleOpportunities: ["usIdCRCWorkRelease", "usIdCRCResidentWorker"],
    stateCode: "US_ID",
    recordId: "us_id_res003",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2017-07-12",
    releaseDate: "2027-06-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2026-02-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2018-05-18",
      crcFacilities: ["CRC PRC"],
    },
  },
  {
    ...rawUsIdResidentCommon[3],
    allEligibleOpportunities: ["usIdCRCResidentWorker"],
    stateCode: "US_ID",
    recordId: "us_id_res004",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2021-07-12",
    releaseDate: "2027-06-06",
    metadata: {
      stateCode: "US_ID",
      tentativeParoleDate: "2025-09-10",
      nextParoleHearingDate: "2024-09-15",
      initialParoleHearingDate: "2023-03-12",
      crcFacilities: ["CRC LRC", "CRC PRC"],
    },
  },
];

export const usIdResidents = rawUsIdResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
