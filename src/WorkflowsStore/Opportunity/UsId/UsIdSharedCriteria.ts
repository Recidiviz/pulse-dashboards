// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { z } from "zod";

import { CopyTuple } from "../utils";

export const custodyLevelIsMinimum = z.object({
  custodyLevel: z.string(),
});

export const custodyLevelIsMinimumCopy: CopyTuple<"custodyLevelIsMinimum"> = [
  "custodyLevelIsMinimum",
  {
    text: "Currently on Minimum custody",
  },
];

export const notServingForSexualOffense = z.object({}).nullable();

export const notServingForSexualOffenseCopy: CopyTuple<"notServingForSexualOffense"> =
  [
    "notServingForSexualOffense",
    {
      text: "Not serving for a sexual offense",
    },
  ];

export const usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years = z
  .object({})
  .nullable();

export const usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy: CopyTuple<"usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years"> =
  [
    "usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years",
    {
      text: "No escape attempts in the last 10 years",
      tooltip:
        "No escape, eluding police, or absconsion offense(s) in the last 10 years",
    },
  ];

export const usIdNoDetainersForCrc = z.object({}).nullable();

export const usIdNoDetainersForCrcCopy: CopyTuple<"usIdNoDetainersForCrc"> = [
  "usIdNoDetainersForCrc",
  {
    text: "No active detainers",
    tooltip: "No active felony detainer (except notification-only)",
  },
];
