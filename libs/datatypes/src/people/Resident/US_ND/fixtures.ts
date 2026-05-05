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

export const rawUsNdResidents: Array<RawResidentRecord> = [
  {
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    personExternalId: "ND_RES003",
    recordId: "us_nd_nd_res003",
    displayId: "RES003",
    personName: {
      givenNames: "Dakota",
      surname: "Johnson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "ND_DEMO_FACILITY",
    unitId: "UNIT A",
    officerId: "OFFICER3",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6 }),
    releaseDate: relativeFixtureDate({ years: 1, months: 6 }),
    metadata: {
      stateCode: "US_ND",
    },
  },
  {
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    personExternalId: "ND_RES004",
    recordId: "us_nd_nd_res004",
    displayId: "RES004",
    personName: {
      givenNames: "Casey",
      surname: "Thompson",
    },
    officerId: "OFFICER3",
    gender: "FEMALE",
    pseudonymizedId: "anonres004",
    facilityId: "ND_DEMO_FACILITY",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -8 }),
    releaseDate: relativeFixtureDate({ months: 10 }),
    metadata: {
      stateCode: "US_ND",
      initialReviewDate: relativeFixtureDate({ months: 2 }),
      paroleReviewDate: relativeFixtureDate({ months: 4 }),
      EIGHTYFIVEPercentDate: relativeFixtureDate({ months: 5, days: 14 }),
      goodTimeDate: relativeFixtureDate({ months: 7 }),
      finalSentExpDate: relativeFixtureDate({ months: 10 }),
    },
  },
  {
    allEligibleOpportunities: ["usNdTransferToMinFacility"],
    stateCode: "US_ND",
    personExternalId: "ND_RES005",
    recordId: "us_nd_nd_res005",
    displayId: "RES005",
    personName: {
      givenNames: "Riley",
      surname: "Martinez",
    },
    officerId: "OFFICER3",
    gender: "MALE",
    pseudonymizedId: "anonres005",
    facilityId: "ND_DEMO_FACILITY",
    unitId: "UNIT C",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -3, months: -2 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 4 }),
    metadata: {
      stateCode: "US_ND",
      paroleReviewDate: relativeFixtureDate({ months: 10 }),
    },
  },
];

export const usNdResidents = rawUsNdResidents.map((r) =>
  residentRecordSchema.parse(r),
);
