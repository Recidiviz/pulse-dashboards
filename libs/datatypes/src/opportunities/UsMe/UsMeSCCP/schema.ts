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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod/date/dateStringSchema";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import type { MergedCriteria } from "../../utils/types";
import {
  noABViolation90DaysSchema,
  noDetainersWarrantsSchema,
} from "../common";

/**
 * represents either half-time date or two-thirds-time date
 */
export const usMeXPortionServedEnum = z.enum(["1/2", "2/3"]);

// these are generally expected to have the same shape whether they are eligible or not.
// there are actually some edge cases where any of these may be null for ineligible residents
// (out-of-state incarceration, life sentence, weird or missing data), but we don't expect
// this to affect our tools in practice, so for simplicity we do not parse those cases for now
const possiblyIneligibleCriteria = z
  .object({
    usMeXMonthsRemainingOnSentence: z.object({
      eligibleDate: dateStringSchema,
    }),
    usMeServedXPortionOfSentence: z.object({
      eligibleDate: dateStringSchema,
      xPortionServed: usMeXPortionServedEnum,
    }),
    usMeCustodyLevelIsMinimumOrCommunity: z.object({
      custodyLevel: z.string(),
    }),
  })
  .partial()
  .passthrough();

export const usMeSCCPSchema = opportunitySchemaBase.extend({
  eligibleCriteria: possiblyIneligibleCriteria
    .extend({
      ...noABViolation90DaysSchema.eligible,
      ...noDetainersWarrantsSchema.eligible,
    })
    .partial(),
  ineligibleCriteria: possiblyIneligibleCriteria
    .extend({
      ...noABViolation90DaysSchema.ineligible,
      ...noDetainersWarrantsSchema.ineligible,
    })
    .partial(),
});

export type UsMeSCCPRecord = ParsedRecord<typeof usMeSCCPSchema>;

export type UsMeSCCPCriteria = MergedCriteria<
  UsMeSCCPRecord["output"]["eligibleCriteria"],
  UsMeSCCPRecord["output"]["ineligibleCriteria"]
>;
