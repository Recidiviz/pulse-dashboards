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
import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsNeGoodTimeRestorationRecord,
  usNeGoodTimeRestorationSchema,
} from "./schema";

export const usNeGoodTimeRestorationFixtures = {
  fullyEligible: makeRecordFixture(usNeGoodTimeRestorationSchema, {
    stateCode: "US_NE",
    externalId: "RES001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usNeHasLostRestorableGoodTime: {
        goodTimeLostDaysRestorable: 45,
      },
      housingUnitTypeIsSolitaryConfinement: null,
      usNeNotInCustodyLevel1a: null,
      noHighestSeverityIncarcerationSanctionsWithin1Year: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -2 }),
      },
      incarceratedInStatePrisonAtLeast1Year: {
        eligibleDate: relativeFixtureDate({ years: -2, months: -3 }),
      },
      usNeNoIdcMrsInPast6Months: {
        eligibleDate: relativeFixtureDate({ months: -8 }),
      },
      usNeLessThan3UdcMrsInPast6Months: null,
      usNeOver4MonthsFromTrd: {
        tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 3 }),
      },
      usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
        lastGoodTimeRestorationDate: relativeFixtureDate({ months: -2 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { isEligibleForMoreThan30Days: true },
  }),
  eligibleLowGoodTime: makeRecordFixture(usNeGoodTimeRestorationSchema, {
    stateCode: "US_NE",
    externalId: "RES002",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usNeHasLostRestorableGoodTime: {
        goodTimeLostDaysRestorable: 25,
      },
      housingUnitTypeIsSolitaryConfinement: null,
      usNeNotInCustodyLevel1a: null,
      noHighestSeverityIncarcerationSanctionsWithin1Year: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -6 }),
      },
      incarceratedInStatePrisonAtLeast1Year: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -8 }),
      },
      usNeNoIdcMrsInPast6Months: {
        eligibleDate: relativeFixtureDate({ months: -7 }),
      },
      usNeLessThan3UdcMrsInPast6Months: null,
      usNeOver4MonthsFromTrd: {
        tentativeReleaseDate: relativeFixtureDate({ years: 1, months: 6 }),
      },
      usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
        lastGoodTimeRestorationDate: relativeFixtureDate({ months: -1 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { isEligibleForMoreThan30Days: false },
  }),
  eligibleHighGoodTime: makeRecordFixture(usNeGoodTimeRestorationSchema, {
    stateCode: "US_NE",
    externalId: "RES003",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usNeHasLostRestorableGoodTime: {
        goodTimeLostDaysRestorable: 245,
      },
      housingUnitTypeIsSolitaryConfinement: null,
      usNeNotInCustodyLevel1a: null,
      noHighestSeverityIncarcerationSanctionsWithin1Year: {
        eligibleDate: relativeFixtureDate({ years: -2, months: -1 }),
      },
      incarceratedInStatePrisonAtLeast1Year: {
        eligibleDate: relativeFixtureDate({ years: -3, months: -4 }),
      },
      usNeNoIdcMrsInPast6Months: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -2 }),
      },
      usNeLessThan3UdcMrsInPast6Months: null,
      usNeOver4MonthsFromTrd: {
        tentativeReleaseDate: relativeFixtureDate({ years: 3, months: 8 }),
      },
      usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
        lastGoodTimeRestorationDate: relativeFixtureDate({ months: -3 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { isEligibleForMoreThan30Days: true },
  }),
  eligibleModerateGoodTime: makeRecordFixture(usNeGoodTimeRestorationSchema, {
    stateCode: "US_NE",
    externalId: "RES004",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usNeHasLostRestorableGoodTime: {
        goodTimeLostDaysRestorable: 120,
      },
      housingUnitTypeIsSolitaryConfinement: null,
      usNeNotInCustodyLevel1a: null,
      noHighestSeverityIncarcerationSanctionsWithin1Year: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -4 }),
      },
      incarceratedInStatePrisonAtLeast1Year: {
        eligibleDate: relativeFixtureDate({ years: -2, months: -7 }),
      },
      usNeNoIdcMrsInPast6Months: {
        eligibleDate: relativeFixtureDate({ months: -9 }),
      },
      usNeLessThan3UdcMrsInPast6Months: null,
      usNeOver4MonthsFromTrd: {
        tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 9 }),
      },
      usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
        lastGoodTimeRestorationDate: relativeFixtureDate({ days: -20 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { isEligibleForMoreThan30Days: true },
  }),
  almostEligibleRecentIdcMr: makeRecordFixture(usNeGoodTimeRestorationSchema, {
    stateCode: "US_NE",
    externalId: "RES005",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {
      usNeHasLostRestorableGoodTime: {
        goodTimeLostDaysRestorable: 85,
      },
      housingUnitTypeIsSolitaryConfinement: null,
      usNeNotInCustodyLevel1a: null,
      noHighestSeverityIncarcerationSanctionsWithin1Year: {
        eligibleDate: relativeFixtureDate({ years: -1, months: -3 }),
      },
      incarceratedInStatePrisonAtLeast1Year: {
        eligibleDate: relativeFixtureDate({ years: -2, months: -2 }),
      },
      usNeLessThan3UdcMrsInPast6Months: null,
      usNeOver4MonthsFromTrd: {
        tentativeReleaseDate: relativeFixtureDate({ years: 1, months: 11 }),
      },
      usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
        lastGoodTimeRestorationDate: relativeFixtureDate({ months: -4 }),
      },
    },
    ineligibleCriteria: {
      usNeNoIdcMrsInPast6Months: {
        eligibleDate: relativeFixtureDate({ months: 1, days: 15 }),
        latestIncidentDate: relativeFixtureDate({ months: -4, days: -15 }),
      },
    },
    metadata: { isEligibleForMoreThan30Days: false },
  }),
  almostEligibleRecentClass1Mr: makeRecordFixture(
    usNeGoodTimeRestorationSchema,
    {
      stateCode: "US_NE",
      externalId: "RES006",
      isEligible: false,
      isAlmostEligible: true,
      eligibleCriteria: {
        usNeHasLostRestorableGoodTime: {
          goodTimeLostDaysRestorable: 160,
        },
        housingUnitTypeIsSolitaryConfinement: null,
        usNeNotInCustodyLevel1a: null,
        incarceratedInStatePrisonAtLeast1Year: {
          eligibleDate: relativeFixtureDate({ years: -2, months: -5 }),
        },
        usNeNoIdcMrsInPast6Months: {
          eligibleDate: relativeFixtureDate({ months: -10 }),
        },
        usNeLessThan3UdcMrsInPast6Months: null,
        usNeOver4MonthsFromTrd: {
          tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 7 }),
        },
        usNeAtLeast2WeeksSinceLastGoodTimeRestoration: {
          lastGoodTimeRestorationDate: relativeFixtureDate({ months: -5 }),
        },
      },
      ineligibleCriteria: {
        noHighestSeverityIncarcerationSanctionsWithin1Year: {
          eligibleDate: relativeFixtureDate({ months: 1, days: 20 }),
          latestEventDate: relativeFixtureDate({ months: -10, days: -10 }),
        },
      },
      metadata: { isEligibleForMoreThan30Days: false },
    },
  ),
} satisfies FixtureMapping<UsNeGoodTimeRestorationRecord>;
