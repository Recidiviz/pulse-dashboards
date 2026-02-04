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
import { RawResidentRecord, residentRecordSchema } from "../schema";

export const rawUsNcResidents: Array<RawResidentRecord> = [
  {
    displayId: "RES001",
    admissionDate: relativeFixtureDate({ years: -1, days: -97 }),
    gender: "MALE",
    personName: {
      givenNames: "Albert",
      middleNames: "Ross",
      surname: "Garry",
    },
    personExternalId: "RES001",
    recordId: "us_nc_RES001",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres001",
    facilityId: "NC_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_NC",
    metadata: {
      rnaDueDate: relativeFixtureDate({ days: -3 }),
    },
  },
  {
    displayId: "RES002",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    gender: "FEMALE",
    personName: {
      givenNames: "Sabrina",
      middleNames: "Alysa",
      surname: "Johnston",
    },
    personExternalId: "RES002",
    recordId: "us_nc_RES002",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres002",
    facilityId: "NC_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_NC",
    metadata: {
      rnaDueDate: relativeFixtureDate({ days: 22 }),
    },
  },
];

export const usNcResidents = rawUsNcResidents.map((r) =>
  residentRecordSchema.parse(r),
);
