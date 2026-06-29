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
import { UsIdCRCWorkReleaseRecord, usIdCRCWorkReleaseSchema } from "./schema";

export const usIdCRCWorkReleaseFixtures = {
  eligibleFtcdOnly: makeRecordFixture(usIdCRCWorkReleaseSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES002",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcWorkReleaseTimeBasedCriteria: {
        fullTermCompletionDate: relativeFixtureDate({ months: 10 }),
        groupProjectedParoleReleaseDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  tpdRecord: makeRecordFixture(usIdCRCWorkReleaseSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES004",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcWorkReleaseTimeBasedCriteria: {
        fullTermCompletionDate: null,
        groupProjectedParoleReleaseDate: relativeFixtureDate({ months: 10 }),
        minTermCompletionDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  lifeSentence: makeRecordFixture(usIdCRCWorkReleaseSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES005",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcWorkReleaseTimeBasedCriteria: {
        eligibleOffenses: ["I00-0000", "I11-1111"],
        groupProjectedParoleReleaseDate: relativeFixtureDate({ months: 8 }),
        fullTermCompletionDate: relativeFixtureDate({ years: 100 }),
        minTermCompletionDate: relativeFixtureDate({ years: 100 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  eligibleEprdAndFtcd: makeRecordFixture(usIdCRCWorkReleaseSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES003",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdCrcWorkReleaseTimeBasedCriteria: {
        fullTermCompletionDate: relativeFixtureDate({ years: 1 }),
        minTermCompletionDate: relativeFixtureDate({ months: 5 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsIdCRCWorkReleaseRecord>;
