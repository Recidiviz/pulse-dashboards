// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { relativeFixtureDate } from "../../../utils/zod";
import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";
import { usNcResidentMetadataFixtures } from "./metadata/fixtures";

export const rawUsNcResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_NC",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: { givenNames: "Albert", middleNames: "Ross", surname: "Garry" },
    facilityId: "NC_DEMO_FACILITY",
  },
  {
    stateCode: "US_NC",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: {
      givenNames: "Sabrina",
      middleNames: "Alysa",
      surname: "Johnston",
    },
    facilityId: "NC_DEMO_FACILITY",
  },
];

export const usNcResidentCommon = rawUsNcResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsNcResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsNcResidentCommon[0],
    recordId: "us_nc_RES001",
    allEligibleOpportunities: [],
    stateCode: "US_NC",
    gender: "MALE",
    custodyLevel: "MINIMUM",
    facilityUnitId: null,
    unitId: null,
    admissionDate: relativeFixtureDate({ years: -1, days: -97 }),
    metadata: usNcResidentMetadataFixtures[0],
  },
  {
    ...rawUsNcResidentCommon[1],
    recordId: "us_nc_RES002",
    allEligibleOpportunities: [],
    stateCode: "US_NC",
    gender: "FEMALE",
    custodyLevel: "MINIMUM",
    facilityUnitId: null,
    unitId: null,
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    metadata: usNcResidentMetadataFixtures[1],
  },
];

export const usNcResidents = rawUsNcResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
