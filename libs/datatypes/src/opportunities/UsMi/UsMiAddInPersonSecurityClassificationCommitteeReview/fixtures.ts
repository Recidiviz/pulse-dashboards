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

import { relativeFixtureDate } from "../../../utils/zod/date/fixtureDates";
import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  usMiAddInPersonSecurityClassificationCommitteeReviewRecord,
  usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
} from "./schema";

export const usMiAddInPersonSecurityClassificationCommitteeReviewFixtures = {
  fullyEligible1: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES019",
      eligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -20 }),
          latestAddInPersonSccReviewDate: relativeFixtureDate({ days: -15 }),
          nextSccDate: relativeFixtureDate({ days: 5 }),
        },
        usMiInSolitaryConfinementAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ days: -20 }),
        },
      },
      formInformation: {
        segregationType: "ADMINISTRATIVE_SOLITARY_CONFINEMENT",
        segregationClassificationDate: relativeFixtureDate({ days: -20 }),
        maxReleaseDate: relativeFixtureDate({ months: 20 }),
        minReleaseDate: relativeFixtureDate({ months: 10 }),
        prisonerName: "First Resident",
        prisonerNumber: "RES019",
        facility: "FACILITY1",
        lock: "LOCKID1",
        STG: "1",
        bondableOffensesWithin6Months: "(423, 2023-12-27)",
        nonbondableOffensesWithin1Year: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: [
          "(2021-11-03,014,)",
          "(2022-03-02,014,)",
          "(2021-08-02,030,)",
          "(2023-10-12,003,014,029,)",
          "(2022-05-16,014,)",
          "(2022-04-30,012,)",
        ],
      },
      ineligibleCriteria: {},
      metadata: {
        daysInCollapsedSolitarySession: 25,
        recentBondableOffenses: "(423, 2023-12-27)",
        recentNonbondableOffenses: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: [
          "(2021-11-03,014,)",
          "(2022-03-02,014,)",
          "(2021-08-02,030,)",
          "(2023-10-12,003,014,029,)",
          "(2022-05-16,014,)",
          "(2022-04-30,012,)",
        ],
        neededProgramming: "101",
        completedProgramming: "105",
      },
      isOverdue: true,
      isEligible: true,
      isAlmostEligible: false,
    },
  ),
  fullyEligible2: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      isOverdue: false,
      externalId: "RES020",
      eligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestAddInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
        },
        usMiInSolitaryConfinementAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
        segregationClassificationDate: relativeFixtureDate({ days: -50 }),
        maxReleaseDate: relativeFixtureDate({ months: 30 }),
        minReleaseDate: relativeFixtureDate({ months: 5 }),
        prisonerName: "Second Resident",
        prisonerNumber: "RES020",
        facility: "FACILITY2",
        lock: "LOCKID2",
        STG: "2",
        bondableOffensesWithin6Months:
          "(020, 2024-02-26), (057, 2023-12-05), (057, 2024-01-31)",
        nonbondableOffensesWithin1Year: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: [],
      },
      ineligibleCriteria: {},
      metadata: {
        daysInCollapsedSolitarySession: 50,
        lessThan24MonthsFromErd: true,
        recentBondableOffenses:
          "(020, 2024-02-26), (057, 2023-12-05), (057, 2024-01-31)",
        recentNonbondableOffenses: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: [],
        neededProgramming: "101",
      },
      isEligible: true,
      isAlmostEligible: false,
    },
  ),
  almostEligible1: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      isOverdue: false,
      externalId: "RES021",
      eligibleCriteria: {
        usMiInSolitaryConfinementAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
        segregationClassificationDate: relativeFixtureDate({ days: -50 }),
        maxReleaseDate: relativeFixtureDate({ months: 30 }),
        minReleaseDate: relativeFixtureDate({ months: 15 }),
        prisonerName: "Third Resident",
        prisonerNumber: "RES021",
        facility: "FACILITY2",
        lock: "LOCKID3",
        STG: "2",
        bondableOffensesWithin6Months: "(020, 2024-02-26)",
        nonbondableOffensesWithin1Year: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: ["(2022-11-07,003,)"],
      },
      ineligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestAddInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
        },
      },
      metadata: {
        daysInCollapsedSolitarySession: 30,
        lessThan24MonthsFromErd: false,
        recentBondableOffenses: "(020, 2024-02-26)",
        recentNonbondableOffenses: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: ["(2022-11-07,003,)"],
        neededProgramming: "105",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
  ),
  almostEligible2: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      isOverdue: false,
      externalId: "RES022",
      eligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestAddInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
        segregationClassificationDate: relativeFixtureDate({ days: -50 }),
        maxReleaseDate: relativeFixtureDate({ months: 30 }),
        minReleaseDate: relativeFixtureDate({ months: 15 }),
        prisonerName: "Third Resident",
        prisonerNumber: "RES021",
        facility: "FACILITY2",
        lock: "LOCKID3",
        STG: "2",
        bondableOffensesWithin6Months: "(020, 2024-02-26)",
        nonbondableOffensesWithin1Year: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: ["(2022-11-07,003,)"],
      },
      ineligibleCriteria: {
        usMiInSolitaryConfinementAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ days: 6 }),
        },
      },
      metadata: {
        daysInCollapsedSolitarySession: 30,
        lessThan24MonthsFromErd: false,
        recentBondableOffenses: "(020, 2024-02-26)",
        recentNonbondableOffenses: "(008, 2023-05-31)",
        adSegStaysAndReasonsWithin3Yrs: ["(2022-11-07,003,)"],
        neededProgramming: "105",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
  ),
} satisfies FixtureMapping<usMiAddInPersonSecurityClassificationCommitteeReviewRecord>;
