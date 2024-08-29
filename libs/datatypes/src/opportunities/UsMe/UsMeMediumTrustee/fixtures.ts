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

import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import { UsMeMediumTrusteeRecord, usMeMediumTrusteeSchema } from "./schema";

export const usMeMediumTrusteeFixtures = {
  fullyEligible: makeRecordFixture(usMeMediumTrusteeSchema, {
    stateCode: "US_ME",
    externalId: "RES002",
    eligibleCriteria: {
      usMeCustodyLevelIsMedium: {
        supervisionLevel: "MEDIUM",
      },
      usMeFiveOrMoreYearsRemainingOnSentence: {},
      usMeNoViolationFor5Years: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Case Plan Goals": [
        {
          eventDate: null,
          noteBody: "Maintain good health",
          noteTitle: "In progress",
        },
      ],
    },
  }),
  fullyEligibleWithLifeSentence: makeRecordFixture(usMeMediumTrusteeSchema, {
    stateCode: "US_ME",
    externalId: "RES006",
    eligibleCriteria: {
      usMeCustodyLevelIsMedium: {
        supervisionLevel: "MEDIUM",
      },
      usMeFiveOrMoreYearsRemainingOnSentence: {},
      usMeNoViolationFor5Years: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Case Plan Goals": [
        {
          eventDate: null,
          noteBody: "Maintain good health",
          noteTitle: "In progress",
        },
      ],
    },
  }),
} satisfies FixtureMapping<UsMeMediumTrusteeRecord>;
