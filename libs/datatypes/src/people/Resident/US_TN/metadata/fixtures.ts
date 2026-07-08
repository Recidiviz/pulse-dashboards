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

import { relativeFixtureDate } from "../../../../utils/zod";
import { RawUsTnResidentCommon, RawUsTnResidentJiiData } from "./schema";

const commonMetadata: RawUsTnResidentCommon = {
  stateCode: "US_TN",
};

export const usTnResidentJiiDataFixture: RawUsTnResidentJiiData = {
  ...commonMetadata,
  expirationDate: relativeFixtureDate({ years: 1, days: 249 }),
  expirationDateOriginal: relativeFixtureDate({ years: 3, days: 300 }),
  fileUpdateDate: relativeFixtureDate({ days: -1 }),
  releaseEligibilityDate: relativeFixtureDate({ days: 222 }),
  sentenceEffectiveDate: relativeFixtureDate({ years: -2, days: -222 }),
  creditActivity: [
    {
      creditDate: relativeFixtureDate({ months: -11 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -11 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -10 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -10 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -9 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -9 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -8 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -8 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -7 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -7 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -6 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -6 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -5 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -4 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -3 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -3 }),
      creditType: "REMOVAL" as const,
      creditsEarned: -10,
    },
    {
      creditDate: relativeFixtureDate({ months: -2 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -1 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
  ],
};

export const usTnResidentMetadata = {
  ...usTnResidentJiiDataFixture,
  latestClassificationDate: relativeFixtureDate({ days: -172 }),
};
