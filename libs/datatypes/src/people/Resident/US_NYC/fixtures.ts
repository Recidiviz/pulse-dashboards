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

import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";

export const rawUsNycResidentCommon: RawResidentCommon[] = [
  {
    stateCode: "US_NYC",
    personExternalId: "NYC_RES001",
    pseudonymizedId: "anonres_nyc_001",
    displayId: "RES001",
    personName: { givenNames: "Alex", surname: "Rivera" },
    facilityId: "NYC_DEMO_FACILITY",
  },
  {
    stateCode: "US_NYC",
    personExternalId: "NYC_RES002",
    pseudonymizedId: "anonres_nyc_002",
    displayId: "RES002",
    personName: { givenNames: "Jordan", surname: "Chen" },
    facilityId: "NYC_DEMO_FACILITY",
  },
];

export const usNycResidentCommon = rawUsNycResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsNycResidents: RawWorkflowsResidentRecord[] = [
  {
    stateCode: "US_NYC",
    personExternalId: "NYC_RES001",
    pseudonymizedId: "anonres_nyc_001",
    displayId: "RES001",
    personName: { givenNames: "Alex", surname: "Rivera" },
    facilityId: "NYC_DEMO_FACILITY",
    recordId: "us_nyc_nyc_res001",
    allEligibleOpportunities: [],
    metadata: { stateCode: "US_NYC" },
  },
  {
    stateCode: "US_NYC",
    personExternalId: "NYC_RES002",
    pseudonymizedId: "anonres_nyc_002",
    displayId: "RES002",
    personName: { givenNames: "Jordan", surname: "Chen" },
    facilityId: "NYC_DEMO_FACILITY",
    recordId: "us_nyc_nyc_res002",
    allEligibleOpportunities: [],
    metadata: { stateCode: "US_NYC" },
  },
];

export const usNycResidents = rawUsNycResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
