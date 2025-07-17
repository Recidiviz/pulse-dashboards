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

export function creditDateString(...differences: Array<Duration>) {
  return formatISO(endOfMonth(parseISO(relativeFixtureDate(...differences))), {
    representation: "date",
  });
}

export const creditActivityFixture = [
  {
    creditDate: creditDateString({ months: -4 }),
    activity: "SOR Adult Secondary Education-Educ",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -4 }),
    activity: "SOR Adult Secondary Education-Prog",
    rating: "S",
    EARNEDGoodTime: 0,
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -4 }),
    activity: "Violence Reduction Program (Prog)",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -3 }),
    activity: "SOR Adult Secondary Education-Educ",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -3 }),
    activity: "SOR Adult Secondary Education-Prog",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -3 }),
    activity: "Violence Reduction Program (Prog)",
    rating: "I",
    EARNEDGoodTime: 0,
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -2 }),
    activity: "SOR Adult Secondary Education-Educ",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -2 }),
    activity: "SOR Adult Secondary Education-Prog",
    rating: "S",
    EARNEDGoodTime: "7.5",
    BOOST: null,
    COMPLETION: null,
  },
  {
    creditDate: creditDateString({ months: -2 }),
    activity: "Violence Reduction Program (Prog)",
    rating: "S",
    EARNEDGoodTime: 0,
    BOOST: 10,
    COMPLETION: 30,
  },
];

export const rawUsMaResidentMetadataFixtures: Array<RawUsMaResidentMetadata> = [
  {
    // normal case: adjustment equals credits
    stateCode: "US_MA",
    isEgtDisabled: false,
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
    creditActivity: creditActivityFixture,
  },
  {
    // no release date
    stateCode: "US_MA",
    isEgtDisabled: false,
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
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -3 }),
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -2 }),
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
    ],
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
  },
  {
    // can't earn any more time
    stateCode: "US_MA",
    isEgtDisabled: false,
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
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -3 }),
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -3 }),
        activity: "Reentry Readiness Workshop",
        rating: "S",
        EARNEDGoodTime: 5,
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -2 }),
        activity: "Institutional Employment",
        rating: "S",
        EARNEDGoodTime: "7.5",
        BOOST: null,
        COMPLETION: null,
      },
      {
        creditDate: creditDateString({ months: -2 }),
        activity: "Reentry Readiness Workshop",
        rating: "S",
        EARNEDGoodTime: 5,
        BOOST: null,
        COMPLETION: null,
      },
    ],
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
  },
  {
    // no EGT data
    stateCode: "US_MA",
    isEgtDisabled: true,
    originalMaxReleaseDate: null,
    adjustedMaxReleaseDate: null,
    rtsDate: null,
    totalCompletionCredit: null,
    totalCompletionCreditDaysCalculated: null,
    totalStateCredit: null,
    totalStateCreditDaysCalculated: null,
    lastUpdatedDate: CURRENT_DATE_STRING_FIXTURE,
    creditActivity: [],
  },
];

export const usMaResidentMetadataFixtures: Array<UsMaResidentMetadata> =
  rawUsMaResidentMetadataFixtures.map((f) =>
    usMaResidentMetadataSchema.parse(f),
  );
