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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsIdCRCResidentWorkerRecord,
  usIdCRCResidentWorkerSchema,
} from "./schema";

export const usIdCRCResidentWorkerFixtures = {
  eligibleLifeSentence: makeRecordFixture(usIdCRCResidentWorkerSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES003",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcResidentWorkerTimeBasedCriteria: {
        eligibleOffenses: ["DUI"],
        groupProjectedParoleReleaseDate: relativeFixtureDate({ years: 2 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  pedAndPhd: makeRecordFixture(usIdCRCResidentWorkerSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES005",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcResidentWorkerTimeBasedCriteria: {
        fullTermCompletionDate: relativeFixtureDate({ years: 8 }),
        paroleEligibilityDate: relativeFixtureDate({ months: -20 }),
        nextParoleHearingDate: relativeFixtureDate({ months: -18 }),
        groupProjectedParoleReleaseDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  eligibleFtcdOrTpd: makeRecordFixture(usIdCRCResidentWorkerSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES004",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcResidentWorkerTimeBasedCriteria: {
        fullTermCompletionDate: relativeFixtureDate({ years: 5 }),
        groupProjectedParoleReleaseDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsIdCRCResidentWorkerRecord>;
