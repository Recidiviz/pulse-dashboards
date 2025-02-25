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

import { mapValues } from "lodash";

import { relativeFixtureDate } from "../../../utils/zod";
import { UsMeWorkReleaseRecordRaw, usMeWorkReleaseSchema } from "./schema";

export const usMeWorkReleaseFixturesRaw = {
  RES001Eligible: {
    stateCode: "US_ME",
    externalId: "RES001",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      usMeNoClassAOrBViolationFor90Days: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      Education: [
        {
          eventDate: "2022-06-02",
          noteTitle: "Graduated",
          noteBody: "Completed coding course",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  },
  RES002Eligible: {
    stateCode: "US_ME",
    externalId: "RES002",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ months: -6, days: -11 }),
      },
      usMeNoClassAOrBViolationFor90Days: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Employment Training": [
        {
          eventDate: "2021-12-02",
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  },
  RES003AlmostEligibleViolation: {
    stateCode: "US_ME",
    externalId: "RES003",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ years: -1 }),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ years: -1 }),
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
      "Employment Training": [
        {
          eventDate: "2021-12-02",
          noteTitle: "Graduated",
          noteBody: "Completed course",
        },
      ],
    },
    isEligible: false,
    isAlmostEligible: true,
    metadata: {},
  },
  RES004IneligibleCommunity: {
    stateCode: "US_ME",
    externalId: "RES004",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -11 }),
      },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ months: -18 }),
      },
    },
    ineligibleCriteria: {
      usMeCustodyLevelIsMinimum: { custodyLevel: "COMMUNITY" },
    },
    isEligible: false,
    isAlmostEligible: false,
    metadata: {},
  },
  RES005Eligible: {
    stateCode: "US_ME",
    externalId: "RES005",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -7 }),
      },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ days: -10 }),
      },
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  },
  RES006Eligible: {
    stateCode: "US_ME",
    externalId: "RES006",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -10 }),
      },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ days: -45 }),
      },
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  },

  RES007AlmostEligibleViolationPending: {
    stateCode: "US_ME",
    externalId: "RES007",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ years: -1 }),
      },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ months: -2 }),
      },
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
    },
    ineligibleCriteria: {
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: null,
        highestClassViol: "B",
        violType: `Pending since ${relativeFixtureDate({ months: -3, days: -10 })}`,
      },
    },
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  },
  RES008Ineligible30Days: {
    stateCode: "US_ME",
    externalId: "RES008",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: -4 }),
      },

      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
    },
    ineligibleCriteria: {
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ days: 15 }),
      },
    },
    isEligible: false,
    isAlmostEligible: false,
    metadata: {},
  },
  RES009AlmostEligibleYearsRemaining: {
    stateCode: "US_ME",
    externalId: "RES009",
    eligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ days: -15 }),
      },
    },
    ineligibleCriteria: {
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: 2 }),
      },
    },
    isEligible: false,
    isAlmostEligible: true,
    metadata: {},
  },
  RES999Ineligible: {
    stateCode: "US_ME",
    externalId: "RES999",
    eligibleCriteria: {},
    ineligibleCriteria: {
      usMeNoDetainersWarrantsOrOther: {
        detainer: "Interstate Active Detainer",
        detainerStartDate: relativeFixtureDate({ years: -2 }),
      },
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: null,
        highestClassViol: "B",
        violType: `Pending since ${relativeFixtureDate({ months: -3, days: -10 })}`,
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: relativeFixtureDate({ months: 5 }),
      },

      usMeCustodyLevelIsMinimum: { custodyLevel: "MEDIUM" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: relativeFixtureDate({ days: 7 }),
      },
    },
    isEligible: false,
    isAlmostEligible: false,
    metadata: {},
  },
} satisfies Record<string, UsMeWorkReleaseRecordRaw>;

export const usMeWorkReleaseFixtures = mapValues(
  usMeWorkReleaseFixturesRaw,
  (r) => usMeWorkReleaseSchema.parse(r),
);
