// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { relativeFixtureDate } from "../../utils/fixtureDates";
import { makeRecordFixture } from "../../utils/makeRecordFixture";
import { ParsedRecord } from "../../utils/types";
import { residentRecordSchema } from "./schema";

export const usMeResidents: Array<ParsedRecord<typeof residentRecordSchema>> = [
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES001",
    displayId: "dRES001",
    gender: "MALE",
    personName: {
      givenNames: "First",
      surname: "Resident",
    },
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -8, months: -1 }),
    releaseDate: relativeFixtureDate({ months: 35 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -1 }),
    portionServedNeeded: "2/3" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES002",
    displayId: "dRES002",
    personName: {
      givenNames: "Second",
      surname: "Resident",
    },
    gender: "FEMALE",

    pseudonymizedId: "anonres002",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -46, days: 1 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    portionServedNeeded: "2/3" as const,
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 2 }),
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES003",
    displayId: "dRES003",
    personName: {
      givenNames: "Third",
      surname: "Resident",
    },
    gender: "TRANS_FEMALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -2, months: -6, days: 2 }),
    releaseDate: relativeFixtureDate({ years: 2 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -3 }),
    portionServedNeeded: "1/2" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES004",
    gender: "INTERNAL_UNKNOWN",
    displayId: "dRES004",
    personName: {
      givenNames: "Fourth",
      surname: "Resident",
    },
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -31, days: 2 }),
    releaseDate: relativeFixtureDate({ months: 25 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({
      months: -3,
    }),
    portionServedNeeded: "1/2" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES005",
    displayId: "dRES005",
    personName: {
      givenNames: "Fifth",
      surname: "Resident",
    },
    gender: "TRANS",
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 5 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 5 }),
    portionServedNeeded: "1/2" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES006",
    displayId: "dRES006",
    personName: {
      givenNames: "Sixth",
      surname: "Resident",
    },
    gender: "TRANS",
    pseudonymizedId: "anonres006",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -9, months: 26 }),
    releaseDate: relativeFixtureDate({ months: 26 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -10 }),
    portionServedNeeded: "2/3" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES007",
    displayId: "dRES007",
    personName: {
      givenNames: "Seventh",
      surname: "Resident",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres007",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ months: -30 }),
    releaseDate: relativeFixtureDate({ months: 24 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -3 }),
    portionServedNeeded: "1/2" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES008",
    displayId: "dRES008",
    personName: {
      givenNames: "Eighth",
      surname: "Resident",
    },
    gender: "TRANS",
    pseudonymizedId: "anonres008",
    facilityId: "FACILITY NAME",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: relativeFixtureDate({ years: -9, months: 32 }),
    releaseDate: relativeFixtureDate({ months: 32 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: -4 }),
    portionServedNeeded: "2/3" as const,
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES998",
    displayId: "dRES998",
    personName: {
      givenNames: "NoRelease",
      surname: "Resident",
    },
    gender: "MALE",
    pseudonymizedId: "anonres998",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
  },
  {
    officerId: "OFFICER5",
    stateCode: "US_ME",
    personExternalId: "RES999",
    displayId: "dRES999",
    personName: {
      givenNames: "Ineligible",
      surname: "Resident",
    },
    gender: "MALE",
    pseudonymizedId: "anonres999",
    facilityId: "FACILITY NAME",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -1, months: -7 }),
    releaseDate: relativeFixtureDate({ years: 2, months: 5 }),
    usMePortionNeededEligibleDate: relativeFixtureDate({ months: 5 }),
    portionServedNeeded: "1/2" as const,
  },
].map((r) => makeRecordFixture(residentRecordSchema, r));

export const allResidents = [...Object.values(usMeResidents)];
