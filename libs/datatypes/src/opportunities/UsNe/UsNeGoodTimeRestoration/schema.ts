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

import { z } from "zod";

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const mrCriteria = z
  .object({
    latestEligibleDate: dateStringSchema,
  })
  .optional();

export const usNeGoodTimeRestorationSchema = opportunitySchemaBase.extend({
  ineligibleCriteria: z
    .object({
      usNeNoIdcMrsInPast6Months: mrCriteria,
      usNeLessThan3UdcMrsInPast6Months: mrCriteria,
      usNeNoClass1MrsInLastYear: mrCriteria,
    })
    .passthrough(),
  metadata: z
    .object({
      almostEligibleForJiiApp: z.boolean(),
      numberOfDaysEligibleFor: z
        .string()
        .transform((val) => parseInt(val))
        .or(z.number()),
      nextMonthAfterLatestGoodTimeRestorationOrDenialDate:
        dateStringSchema.optional(),
    })
    .passthrough(),
});

export type UsNeGoodTimeRestorationRecord = ParsedRecord<
  typeof usNeGoodTimeRestorationSchema
>;
