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
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import type { MergedCriteria } from "../../utils/types";
import {
  custodyLevelReason,
  eligibleDateReason,
  eligibleDateReasonSchema,
  noABViolation90DaysSchema,
  noDetainersWarrantsSchema,
  nullableEligibleDateReasonSchema,
  usMeDenialMetadataSchema,
} from "../common";

/**
 * represents either half-time date or two-thirds-time date
 */
export const usMeXPortionServedEnum = z.enum(["1/2", "2/3"]);

function custodyLevelCriterion() {
  return custodyLevelReason("usMeCustodyLevelIsMinimumOrCommunity");
}

function monthsRemainingCriterion() {
  return eligibleDateReason("usMeXMonthsRemainingOnSentence");
}

function xPortionCriterion() {
  const criterionId = "usMeServedXPortionOfSentence";

  const xPortionServedReason = { xPortionServed: usMeXPortionServedEnum };

  return {
    eligible: {
      [criterionId]: eligibleDateReasonSchema.extend(xPortionServedReason),
    },
    ineligible: {
      [criterionId]: nullableEligibleDateReasonSchema
        .unwrap()
        .extend(xPortionServedReason)
        .nullable(),
    },
  };
}

export const usMeSCCPSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      ...xPortionCriterion().eligible,
      ...monthsRemainingCriterion().eligible,
      ...custodyLevelCriterion().eligible,
      ...noABViolation90DaysSchema.eligible,
      ...noDetainersWarrantsSchema.eligible,
    })
    .partial()
    .passthrough(),
  ineligibleCriteria: z
    .object({
      ...xPortionCriterion().ineligible,
      ...monthsRemainingCriterion().ineligible,
      ...custodyLevelCriterion().ineligible,
      ...noABViolation90DaysSchema.ineligible,
      ...noDetainersWarrantsSchema.ineligible,
    })
    .partial()
    .passthrough(),
  metadata: z.object({
    denial: usMeDenialMetadataSchema,
  }),
});

export type UsMeSCCPRecord = ParsedRecord<typeof usMeSCCPSchema>;

export type UsMeSCCPCriteria = MergedCriteria<
  UsMeSCCPRecord["output"]["eligibleCriteria"],
  UsMeSCCPRecord["output"]["ineligibleCriteria"]
>;
