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

import { relativeFixtureDate } from "../../utils/fixtureDates";
import { makeRecordFixture } from "../utils/makeRecordFixture";
import { FixtureMapping } from "../utils/types";
import { UsMeSCCPRecord, usMeSCCPSchema } from "./schema";

export const usMeSccpFixtures = {
  eligibleWithinMonthsRemainingWindow: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES002",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: {
        custodyLevel: "MINIMUM",
      },
      usMeNoClassAOrBViolationFor90Days: null,
      usMeNoDetainersWarrantsOrOther: null,
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({ months: 2 }),
        xPortionServed: "2/3",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -4 }),
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Employment Training": [
        {
          eventDate: relativeFixtureDate({ days: -14 }),
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
  }),
  fullyEligibleTwoThirdsPortion: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES006",
    ineligibleCriteria: {},
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: { custodyLevel: "COMMUNITY" },
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({ months: -10 }),
        xPortionServed: "2/3",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -4 }),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    caseNotes: {
      "Employment Training": [
        {
          eventDate: relativeFixtureDate({ days: -14 }),
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
  }),
  fullyEligibleHalfPortion: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES004",
    ineligibleCriteria: {},
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: { custodyLevel: "COMMUNITY" },
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({
          months: -3,
        }),
        xPortionServed: "1/2",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -6 }),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    caseNotes: {
      "Employment Training": [
        {
          eventDate: relativeFixtureDate({ days: -14 }),
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
  }),
  almostEligibleViolation: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES003",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: {
        custodyLevel: "MINIMUM",
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({ months: -3 }),
        xPortionServed: "1/2",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -6 }),
      },
    },
    ineligibleCriteria: {
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: relativeFixtureDate({ months: 2, days: 14 }),
        highestClassViol: "B",
        violType: "More than 1",
      },
    },
    caseNotes: {
      Education: [
        {
          eventDate: relativeFixtureDate({ months: -6, days: -14 }),
          noteTitle: "Graduated",
          noteBody: "Completed coding course",
        },
      ],
    },
  }),
  almostEligibleMonthsRemaining: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES001",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: {
        custodyLevel: "COMMUNITY",
      },
      usMeNoClassAOrBViolationFor90Days: null,
      usMeNoDetainersWarrantsOrOther: null,
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
        xPortionServed: "2/3",
      },
    },
    ineligibleCriteria: {
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: 5 }),
      },
    },
    caseNotes: {
      Education: [
        {
          eventDate: relativeFixtureDate({ months: -4 }),
          noteTitle: "Graduated",
          noteBody: "Completed coding course",
        },
      ],
    },
  }),
  almostEligibleXPortion: makeRecordFixture(usMeSCCPSchema, {
    stateCode: "US_ME",
    externalId: "RES005",
    ineligibleCriteria: {
      usMeServedXPortionOfSentence: {
        eligibleDate: relativeFixtureDate({ months: 5 }),
        xPortionServed: "1/2",
      },
    },
    eligibleCriteria: {
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
      usMeCustodyLevelIsMinimumOrCommunity: { custodyLevel: "COMMUNITY" },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    caseNotes: {
      "Employment Training": [
        {
          eventDate: relativeFixtureDate({ days: -14 }),
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
  }),
} satisfies FixtureMapping<UsMeSCCPRecord>;
