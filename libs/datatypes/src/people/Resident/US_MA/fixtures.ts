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

import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  WorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";
import { rawUsMaResidentJiiDataFixtures } from "./metadata/fixtures";
import { RawUsMaResidentJiiData } from "./metadata/schema";

export const rawUsMaResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_MA",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: { givenNames: "Laurence", surname: "Baumbach" },
    facilityId: "DEMO FACILITY",
  },
  {
    stateCode: "US_MA",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: {
      givenNames: "Dan",
      middleNames: "Michael",
      surname: "Krajcik",
    },
    facilityId: "DEMO FACILITY",
  },
  {
    stateCode: "US_MA",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003",
    displayId: "RES003",
    personName: {
      givenNames: "Israel",
      middleNames: "Nixon",
      surname: "Willms",
    },
    facilityId: "DEMO FACILITY 2",
  },
  {
    stateCode: "US_MA",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004",
    displayId: "RES004",
    personName: { givenNames: "Marty", surname: "Fahey" },
    facilityId: "DEMO FACILITY 2",
  },
];

export const usMaResidentCommon = rawUsMaResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsMaResidents: Array<
  RawWorkflowsResidentRecord & { metadata: RawUsMaResidentJiiData }
> = rawUsMaResidentCommon.map((common, i) => ({
  ...common,
  stateCode: "US_MA",
  gender: "MALE",
  metadata: rawUsMaResidentJiiDataFixtures[i],
  recordId: `us_ma_${common.personExternalId}`,
  allEligibleOpportunities: [],
}));

export const usMaResidents: Array<WorkflowsResidentRecord> =
  rawUsMaResidents.map((r) => workflowsResidentRecordSchema.parse(r));
