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
import { RawResidentRecord, residentRecordSchema } from "../schema";

export const rawUsCoResidents: Array<RawResidentRecord> = [
  {
    displayId: "RES001",
    admissionDate: relativeFixtureDate({ years: -1, days: -97 }),
    gender: "MALE",
    personName: {
      givenNames: "John",
      middleNames: "Michael",
      surname: "Smith",
    },
    personExternalId: "RES001",
    recordId: "us_co_RES001",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres001",
    facilityId: "CO_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_CO",
    metadata: {},
  },
  {
    displayId: "RES002",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    gender: "FEMALE",
    personName: {
      givenNames: "Jane",
      middleNames: "Marie",
      surname: "Johnson",
    },
    personExternalId: "RES002",
    recordId: "us_co_RES002",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres002",
    facilityId: "CO_DEMO_FACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: [],
    unitId: null,
    stateCode: "US_CO",
    metadata: {},
  },
];

export const usCoResidents = rawUsCoResidents.map((r) =>
  residentRecordSchema.parse(r),
);
