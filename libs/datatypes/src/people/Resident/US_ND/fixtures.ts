// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { usNdResidentMetadataFixtures } from "./metadata/fixtures";

export const rawUsNdResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_ND",
    personExternalId: "ND_RES003",
    pseudonymizedId: "anonres003",
    displayId: "RES003",
    personName: { givenNames: "Dakota", surname: "Johnson" },
    facilityId: "ND_DEMO_FACILITY",
  },
  {
    stateCode: "US_ND",
    personExternalId: "ND_RES004",
    pseudonymizedId: "anonres004",
    displayId: "RES004",
    personName: { givenNames: "Casey", surname: "Thompson" },
    facilityId: "ND_DEMO_FACILITY",
  },
  {
    stateCode: "US_ND",
    personExternalId: "ND_RES005",
    pseudonymizedId: "anonres005",
    displayId: "RES005",
    personName: { givenNames: "Riley", surname: "Martinez" },
    facilityId: "ND_DEMO_FACILITY",
  },
];

export const usNdResidentCommon = rawUsNdResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsNdResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsNdResidentCommon[0],
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    recordId: "us_nd_nd_res003",
    gender: "MALE",
    unitId: "UNIT A",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    releaseDate: relativeFixtureDate({ years: 1, months: 6 }),
    metadata: usNdResidentMetadataFixtures[0],
  },
  {
    ...rawUsNdResidentCommon[1],
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    recordId: "us_nd_nd_res004",
    officerId: "OFFICER3",
    gender: "FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -8 }),
    releaseDate: relativeFixtureDate({ months: 10 }),
    metadata: usNdResidentMetadataFixtures[1],
  },
  {
    ...rawUsNdResidentCommon[2],
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    recordId: "us_nd_nd_res005",
    officerId: "OFFICER3",
    gender: "MALE",
    unitId: "UNIT C",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -3, months: -2 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 4 }),
    metadata: usNdResidentMetadataFixtures[2],
  },
];

export const usNdResidents = rawUsNdResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
