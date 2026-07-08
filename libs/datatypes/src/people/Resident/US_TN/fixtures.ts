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

import { relativeFixtureDate } from "../../../utils/zod";
import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";
import { usTnResidentMetadata } from "./metadata/fixtures";

export const rawUsTnResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_TN",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "dRES001",
    personName: { givenNames: "Carmen", surname: "Reyes" },
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
  },
  {
    stateCode: "US_TN",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "dRES002",
    personName: { givenNames: "Jessica", surname: "Ren" },
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
  },
  {
    stateCode: "US_TN",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003",
    displayId: "dRES003",
    personName: { givenNames: "Fei", surname: "Jackson" },
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
  },
  {
    stateCode: "US_TN",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004",
    displayId: "dRES004",
    personName: { givenNames: "Geoff", surname: "Zhang" },
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
  },
];

export const usTnResidentCommon = rawUsTnResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsTnResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsTnResidentCommon[0],
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    recordId: "us_tn_res001",
    gender: "MALE",

    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 3, days: 300 }),
    metadata: usTnResidentMetadata,
  },
  {
    ...rawUsTnResidentCommon[1],
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    recordId: "us_tn_res002",
    gender: "FEMALE",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -4, days: -400 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata: usTnResidentMetadata,
  },
  {
    ...rawUsTnResidentCommon[2],
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    recordId: "us_tn_res003",
    gender: "MALE",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -3, days: -100 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata: usTnResidentMetadata,
  },
  {
    ...rawUsTnResidentCommon[3],
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    recordId: "us_tn_res004",
    gender: "INTERNAL_UNKNOWN",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 200 }),
    metadata: usTnResidentMetadata,
  },
];

export const usTnResidents = rawUsTnResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
