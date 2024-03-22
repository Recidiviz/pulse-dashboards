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

import { dateStringSchema, defaultOnNull } from "../schemaHelpers";
import { CopyTuple } from "../utils/criteriaUtils";

export const sentenceTypeSchema = z.enum(["PROBATION", "PAROLE", "DUAL"]);

export const eligibleCriteriaLsuED = z.object({
  negativeUaWithin90Days: defaultOnNull(
    z.object({
      latestUaDates: z.array(dateStringSchema),
      latestUaResults: z.array(z.boolean()),
    }),
    { latestUaDates: [], latestUaResults: [] },
  ),
  noFelonyWithin24Months: z
    .null()
    .transform((output) => (output === null ? true : output)),
  // optional because it could be in the ineligible criteria; it shouldn't just be randomly missing
  usIdIncomeVerifiedWithin3Months: z
    .object({
      incomeVerifiedDate: dateStringSchema,
    })
    .optional(),
});

export const ineligibleCriteriaLsuED = z
  .object({
    // this will only be here if the verification is missing, which is why it can only be null;
    // however, it's easier to reason about downstream if it's a truthy value
    usIdIncomeVerifiedWithin3Months: z.null().transform(() => true),
  })
  .partial();

export type LSUEarnedDischargeEligibleCriteria = z.infer<
  typeof eligibleCriteriaLsuED
>;

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

export const usIdNoDetainersForXcrcAndCrc = z.object({}).nullable();

export const usIdNoDetainersForXcrcAndCrcCopy: CopyTuple<"usIdNoDetainersForXcrcAndCrc"> =
  [
    "usIdNoDetainersForXcrcAndCrc",
    {
      text: "No active felony detainers or holds",
      tooltip: "Cannot have any felony detainers or holds",
    },
  ];
