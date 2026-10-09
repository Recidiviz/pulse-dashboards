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

import { z } from "zod";

import { dateStringSchema, usTnResidentCommonSchema } from "~datatypes";

const usTnJiiCreditsSchema = z.object({
  creditDate: dateStringSchema,
  creditType: z
    .enum([
      "60_DAY_ED_CREDIT",
      "60_DAY_TREATMENT",
      "BEHAVIOR",
      "BONUS_BEHAVIOR",
      "DRUG_ALCOHOL",
      "GED",
      "PROGRAM",
      "BONUS_PROGRAM",
      "REMOVAL",
    ])
    .nullable(),
  creditsEarned: z.number().nullable(),
});

export const usTnStateDataSchema = usTnResidentCommonSchema.extend({
  expirationDate: dateStringSchema.nullable(),
  expirationDateOriginal: dateStringSchema.nullable(),
  releaseEligibilityDate: dateStringSchema.nullable(),
  creditActivity: z.array(usTnJiiCreditsSchema),
  fileUpdateDate: dateStringSchema,
});
export type UsTnResidentJiiData = z.infer<typeof usTnStateDataSchema>;
export type RawUsTnResidentJiiData = z.input<typeof usTnStateDataSchema>;

export type UsTnCreditActivity = z.output<typeof usTnJiiCreditsSchema>;
export type UsTnCreditType = NonNullable<UsTnCreditActivity["creditType"]>;
