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

import { z } from "zod";

import { dateStringSchema } from "~datatypes";

import { defaultOnNull } from "../schemaHelpers";

export const sentenceTypeSchema = z.enum(["PROBATION", "PAROLE", "DUAL"]);

export const eligibleCriteriaLsuED = z
  .object({
    negativeDaWithin90Days: defaultOnNull(
      z.object({
        latestUaDates: z.array(dateStringSchema),
        latestUaResults: z.array(z.boolean()),
      }),
      { latestUaDates: [], latestUaResults: [] },
    ),
    noFelonyWithin24Months: z
      .null()
      .transform((output) => (output === null ? true : output)),
  })
  .passthrough();

export const ineligibleCriteriaLsuED = z.object({}).passthrough();

export type LSUEarnedDischargeEligibleCriteria = z.infer<
  typeof eligibleCriteriaLsuED
>;

export const crcSharedCriteria = z
  .object({
    custodyLevelIsMinimum: z.object({
      custodyLevel: z.string(),
    }),
    notServingForSexualOffense: z.object({}).nullable(),
    notServingForViolentOffense: z.object({}).nullable().optional(),
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: z
      .object({})
      .nullable(),
    usIdNoDetainersForXcrcAndCrc: z.object({}).nullable(),
  })
  .passthrough();

export const crcSharedIneligibleCriteria = crcSharedCriteria.pick({
  notServingForViolentOffense: true,
});
