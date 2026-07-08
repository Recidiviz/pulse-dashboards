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
import { usArResidentMetadataFixtures } from "./metadata/fixtures";

export const rawUsArResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: {
      givenNames: "Sandra",
      middleNames: "Wynona",
      surname: "French",
    },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: {
      givenNames: "Clayton",
      middleNames: "Milton",
      surname: "Hamilton",
    },
    facilityId: "FACILITY2",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES003",
    pseudonymizedId: "anonres003",
    displayId: "RES003",
    personName: {
      givenNames: "Robert",
      middleNames: "Terence",
      surname: "Bradley",
    },
    facilityId: "FACILITY2",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES004",
    pseudonymizedId: "anonres004",
    displayId: "RES004",
    personName: {
      givenNames: "Alice",
      middleNames: "Marie",
      surname: "Johnson",
    },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES005",
    pseudonymizedId: "anonres005",
    displayId: "RES005",
    personName: { givenNames: "John", middleNames: "Edward", surname: "Smith" },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES006",
    pseudonymizedId: "anonres006",
    displayId: "RES006",
    personName: {
      givenNames: "Maria",
      middleNames: "Elena",
      surname: "Torres",
    },
    facilityId: "FACILITY1",
  },
];

export const usArResidentCommon = rawUsArResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsArResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsArResidentCommon[0],
    recordId: "us_ar_res001",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: usArResidentMetadataFixtures[0],
  },
  {
    ...rawUsArResidentCommon[1],
    recordId: "us_ar_res002",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2026-01-07",
    metadata: usArResidentMetadataFixtures[1],
  },
  {
    ...rawUsArResidentCommon[2],
    recordId: "us_ar_res003",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-05-17",
    releaseDate: "2025-07-24",
    metadata: usArResidentMetadataFixtures[2],
  },
  {
    ...rawUsArResidentCommon[3],
    recordId: "us_ar_res004",
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: "2021-01-15",
    releaseDate: "2026-01-15",
    metadata: usArResidentMetadataFixtures[3],
  },
  {
    ...rawUsArResidentCommon[4],
    recordId: "us_ar_res005",
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT C",
    custodyLevel: "MAXIMUM",
    admissionDate: "2018-11-20",
    releaseDate: "2024-05-10",
    metadata: usArResidentMetadataFixtures[4],
  },
  {
    ...rawUsArResidentCommon[5],
    recordId: "us_ar_res006",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2025-03-10",
    releaseDate: "2027-03-10",
    metadata: usArResidentMetadataFixtures[5],
  },
];

export const usArResidents = rawUsArResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
