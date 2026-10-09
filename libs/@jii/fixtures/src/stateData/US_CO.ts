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

import { RawUsCoResidentJiiData } from "~@jii/schemas";
import {
  relativeFixtureDate,
  usCoResidentCommonDataFixtures,
} from "~datatypes";

export const usCoResidentJiiDataFixtures: RawUsCoResidentJiiData[] = [
  {
    ...usCoResidentCommonDataFixtures[0],
    sddTent: null,
    cohortLabel: "STANDARD",
    creditActivity: [
      {
        creditDate: relativeFixtureDate({ months: -1 }),
        creditType: "EARNED_TIME",
        creditsEarned: 10,
        goodTimeChangeReason: null,
        earnedTimeStatus: "ELIGIBLE",
      },
      {
        creditDate: relativeFixtureDate({ months: -1 }),
        creditType: "ACHIEVEMENT",
        creditsEarned: 15,
        goodTimeChangeReason: "Completed GED program",
        earnedTimeStatus: null,
      },
      {
        creditDate: relativeFixtureDate({ months: -2 }),
        creditType: "EARNED_TIME",
        creditsEarned: 10,
        goodTimeChangeReason: null,
        earnedTimeStatus: "ELIGIBLE",
      },
      {
        creditDate: relativeFixtureDate({ months: -2 }),
        creditType: "GOOD_TIME",
        creditsEarned: 5,
        goodTimeChangeReason: null,
        earnedTimeStatus: null,
      },
      {
        creditDate: relativeFixtureDate({ months: -3 }),
        creditType: "EARNED_TIME",
        creditsEarned: 8,
        goodTimeChangeReason: null,
        earnedTimeStatus: "ELIGIBLE",
      },
      {
        creditDate: relativeFixtureDate({ months: -3 }),
        creditType: "OTHER",
        creditsEarned: 2,
        goodTimeChangeReason: "Adjustment",
        earnedTimeStatus: null,
      },
      {
        creditDate: relativeFixtureDate({ months: -4 }),
        creditType: "EARNED_TIME",
        creditsEarned: 10,
        goodTimeChangeReason: null,
        earnedTimeStatus: "ELIGIBLE",
      },
    ],
    lastUpdatedDate: relativeFixtureDate({ days: -7 }),
  },
  {
    ...usCoResidentCommonDataFixtures[1],
    sddTent: relativeFixtureDate({ years: 3 }),
    cohortLabel: "LIFE_WITHOUT_PAROLE",
    creditActivity: [],
    lastUpdatedDate: relativeFixtureDate({ days: -3 }),
  },
];
