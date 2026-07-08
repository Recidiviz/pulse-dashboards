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
import { usNeResidentMetadataFixtures } from "./metadata/fixtures";

export const rawUsNeResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_NE",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001-ne",
    displayId: "RES001",
    personName: { middleNames: "T", givenNames: "Joseph", surname: "Gutmann" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002-ne",
    displayId: "RES002",
    personName: { middleNames: "", givenNames: "Marcus", surname: "Anderson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003-ne",
    displayId: "RES003",
    personName: { middleNames: "L", givenNames: "David", surname: "Thompson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004-ne",
    displayId: "RES004",
    personName: { middleNames: "J", givenNames: "Robert", surname: "Martinez" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES005",
    pseudonymizedId: "anonres005-ne",
    displayId: "RES005",
    personName: { middleNames: "A", givenNames: "James", surname: "Wilson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES006",
    pseudonymizedId: "anonres006-ne",
    displayId: "RES006",
    personName: {
      middleNames: "",
      givenNames: "Christopher",
      surname: "Davis",
    },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES007",
    pseudonymizedId: "anonres007-ne",
    displayId: "RES007",
    personName: { middleNames: "R", givenNames: "Michael", surname: "Johnson" },
    facilityId: "DEMOFACILITY",
  },
];

export const usNeResidentCommon = rawUsNeResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsNeResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsNeResidentCommon[0],
    recordId: "us_ne_RES001",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -3 }),
    metadata: usNeResidentMetadataFixtures[0],
  },
  {
    ...rawUsNeResidentCommon[1],
    recordId: "us_ne_RES002",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -1, months: -8 }),
    metadata: usNeResidentMetadataFixtures[1],
  },
  {
    ...rawUsNeResidentCommon[2],
    recordId: "us_ne_RES003",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -3, months: -4 }),
    metadata: usNeResidentMetadataFixtures[2],
  },
  {
    ...rawUsNeResidentCommon[3],
    recordId: "us_ne_RES004",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "C-WING",
    unitId: "C-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -7 }),
    metadata: usNeResidentMetadataFixtures[3],
  },
  {
    ...rawUsNeResidentCommon[4],
    recordId: "us_ne_RES005",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -2 }),
    metadata: usNeResidentMetadataFixtures[4],
  },
  {
    ...rawUsNeResidentCommon[5],
    recordId: "us_ne_RES006",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -5 }),
    metadata: usNeResidentMetadataFixtures[5],
  },
  {
    ...rawUsNeResidentCommon[6],
    recordId: "us_ne_RES007",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: [],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -1 }),
    metadata: usNeResidentMetadataFixtures[6],
  },
];

export const usNeResidents = rawUsNeResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
