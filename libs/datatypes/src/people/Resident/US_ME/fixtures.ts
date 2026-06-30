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

import { relativeFixtureDate } from "../../../utils/zod/date/fixtureDates";
import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  WorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";

export const rawUsMeResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_ME",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "dRES001",
    personName: { givenNames: "First", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "dRES002",
    personName: { givenNames: "Second", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003",
    displayId: "dRES003",
    personName: { givenNames: "Third", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004",
    displayId: "dRES004",
    personName: { givenNames: "Fourth", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES005",
    pseudonymizedId: "anonres005",
    displayId: "dRES005",
    personName: { givenNames: "Fifth", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES006",
    pseudonymizedId: "anonres006",
    displayId: "dRES006",
    personName: { givenNames: "Sixth", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES007",
    pseudonymizedId: "anonres007",
    displayId: "dRES007",
    personName: { givenNames: "Seventh", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES008",
    pseudonymizedId: "anonres008",
    displayId: "dRES008",
    personName: { givenNames: "Eighth", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES009",
    pseudonymizedId: "anonres009",
    displayId: "dRES009",
    personName: { givenNames: "Ninth", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES998",
    pseudonymizedId: "anonres998",
    displayId: "dRES998",
    personName: { givenNames: "NoRelease", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
  {
    stateCode: "US_ME",
    personExternalId: "RES999",
    pseudonymizedId: "anonres999",
    displayId: "dRES999",
    personName: { givenNames: "Ineligible", surname: "Resident" },
    facilityId: "FACILITY NAME",
  },
];

export const usMeResidentCommon = rawUsMeResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsMeResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsMeResidentCommon[0],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -8, months: -1 }),
    releaseDate: relativeFixtureDate({ months: 35 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -1 }),
    portionServedNeeded: "2/3" as const,
    recordId: "us_me_001",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "2/3",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[1],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    portionServedNeeded: "2/3" as const,
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 2 }),
    recordId: "us_me_002",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "2/3",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[2],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "TRANS_FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6, days: 2 }),
    releaseDate: relativeFixtureDate({ years: 2 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -3 }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_003",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[3],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "INTERNAL_UNKNOWN",
    unitId: "UNIT A",
    custodyLevel: "COMMUNITY",
    admissionDate: relativeFixtureDate({ months: -31, days: 2 }),
    releaseDate: relativeFixtureDate({ months: 25 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -3 }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_004",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[4],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "TRANS",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 5 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 5 }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_005",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[5],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "TRANS",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -9, months: 26 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -10 }),
    portionServedNeeded: "2/3" as const,
    recordId: "us_me_006",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "2/3",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[6],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -30 }),
    releaseDate: relativeFixtureDate({ months: 24 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -3 }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_007",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[7],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "TRANS",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -9, months: 32 }),
    releaseDate: relativeFixtureDate({ months: 32 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -4 }),
    portionServedNeeded: "2/3" as const,
    recordId: "us_me_008",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "2/3",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[8],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -7 }),
    releaseDate: relativeFixtureDate({ years: 3, months: 2 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({
      years: -2,
      months: 1,
    }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_009",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[9],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "MALE",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    recordId: "us_me_998",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: null,
      sccpEligibilityDate: null,
    },
  },
  {
    ...rawUsMeResidentCommon[10],
    officerId: "OFFICER5",
    stateCode: "US_ME",
    gender: "MALE",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 3, months: 5 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 11 }),
    portionServedNeeded: "1/2" as const,
    recordId: "us_me_999",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_ME",
      portionServedNeeded: "1/2",
      sccpEligibilityDate: null,
    },
  },
];

export const usMeResidents: Array<WorkflowsResidentRecord> =
  rawUsMeResidents.map((r) => workflowsResidentRecordSchema.parse(r));
