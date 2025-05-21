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

import { Duration, endOfMonth, formatISO, parseISO } from "date-fns";

import {
  CURRENT_DATE_STRING_FIXTURE,
  relativeFixtureDate,
} from "../../../../utils/zod";
import {
  RawUsMaResidentMetadata,
  UsMaResidentMetadata,
  usMaResidentMetadataSchema,
} from "./schema";

function creditDateString(...differences: Array<Duration>) {
  return formatISO(endOfMonth(parseISO(relativeFixtureDate(...differences))), {
    representation: "date",
  });
}

export const rawUsMaResidentMetadataFixtures: Array<RawUsMaResidentMetadata> = [
  {
    // normal case: adjustment equals credits
    originalMaxReleaseDate: relativeFixtureDate({ years: 5, months: 2 }),
    // other release dates calculated relative to the original,
    // using number of days since that's how the policies are applied
    adjustedMaxReleaseDate: relativeFixtureDate(
      { years: 5, months: 2 },
      { days: -63 },
    ),
    rtsDate: relativeFixtureDate(
      { years: 5, months: 2 },
      { days: -63 },
      { days: -30 },
    ),
    totalCompletionCredit: 30,
    totalCompletionCreditDaysCalculated: 30,
    totalStateCredit: 63,
    totalStateCreditDaysCalculated: 63,
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
    creditActivity: [
      {
        creditDate: creditDateString({ months: -4 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "EDUC",
        activity: "SOR Adult Secondary Education-Educ",
        activityType: "Education Release Activity",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -4 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: 0,
        activityCode: "PROG",
        activity: "SOR Adult Secondary Education-Prog",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -4 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "PROG",
        activity: "Violence Reduction Program (Prog)",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "EDUC",
        activity: "SOR Adult Secondary Education-Educ",
        activityType: "Education Release Activity",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "PROG",
        activity: "SOR Adult Secondary Education-Prog",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: 0,
        activityCode: "PROG",
        activity: "Violence Reduction Program (Prog)",
        activityType: "Institutional Programs",
        rating: "I",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "EDUC",
        activity: "SOR Adult Secondary Education-Educ",
        activityType: "Education Release Activity",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "PROG",
        activity: "SOR Adult Secondary Education-Prog",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: 0,
        activityCode: "PROG",
        activity: "Violence Reduction Program (Prog)",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "BOOST",
        creditsEarned: 10,
        activityCode: "PROG",
        activity: "Violence Reduction Program (Prog) (BOOST)",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "COMPLETION",
        creditsEarned: 30,
        activityCode: "PROG",
        activity: "Violence Reduction Program (Prog) (COMPLETION)",
        activityType: "Institutional Programs",
        rating: "S",
      },
    ],
  },
  {
    // no release date
    rtsDate: null,
    adjustedMaxReleaseDate: null,
    originalMaxReleaseDate: null,
    totalCompletionCredit: 80,
    totalCompletionCreditDaysCalculated: null,
    totalStateCredit: 988,
    totalStateCreditDaysCalculated: null,
    creditActivity: [
      {
        creditDate: creditDateString({ months: -4 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
    ],
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
  },
  {
    // can't earn any more time
    originalMaxReleaseDate: relativeFixtureDate({
      years: 2,
      months: -1,
      days: -12,
    }),
    // other release dates calculated relative to the original,
    // using number of days since that's how the policies are applied
    adjustedMaxReleaseDate: relativeFixtureDate(
      { years: 2, months: -1, days: -12 },
      { days: -1 },
    ),
    rtsDate: null,
    totalCompletionCredit: null,
    totalCompletionCreditDaysCalculated: null,
    totalStateCredit: 133,
    totalStateCreditDaysCalculated: 1,
    creditActivity: [
      {
        creditDate: creditDateString({ months: -4 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -3 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: 5,
        activityCode: "PROG",
        activity: "Reentry Readiness Workshop",
        activityType: "Institutional Programs",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: "7.5",
        activityCode: "WORK",
        activity: "Institutional Employment",
        activityType: "Institutional Work",
        rating: "S",
      },
      {
        creditDate: creditDateString({ months: -2 }),
        creditType: "EARNED_GOOD_TIME",
        creditsEarned: 5,
        activityCode: "PROG",
        activity: "Reentry Readiness Workshop",
        activityType: "Institutional Programs",
        rating: "S",
      },
    ],
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
  },
];

export const usMaResidentMetadataFixtures: Array<UsMaResidentMetadata> =
  rawUsMaResidentMetadataFixtures.map((f) =>
    usMaResidentMetadataSchema.parse(f),
  );
