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

import { dateStringSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import { MergedCriteria } from "../../utils/types";
import {
  noABViolation90DaysSchema,
  noDetainersWarrantsSchema,
} from "../common";

function custodyLevelCriterion() {
  const reason = z.object({
    custodyLevel: z.string(),
  });

  const criterionId = "usMeCustodyLevelIsMinimum";

  return {
    eligible: { [criterionId]: reason },
    ineligible: { [criterionId]: reason.nullable() },
  };
}

function yearsRemainingCriterion() {
  const criterionId = "usMeThreeYearsRemainingOnSentence";

  return {
    eligible: {
      [criterionId]: z.object({
        eligibleDate: dateStringSchema,
      }),
    },
    ineligible: {
      [criterionId]: z
        .object({
          eligibleDate: dateStringSchema.nullable(),
        })
        .nullable(),
    },
  };
}

function served30DaysCriterion() {
  const criterionId =
    "usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease";

  return {
    eligible: {
      [criterionId]: z.object({
        eligibleDate: dateStringSchema,
      }),
    },
    ineligible: {
      [criterionId]: z
        .object({
          eligibleDate: dateStringSchema.nullable(),
        })
        .nullable(),
    },
  };
}
export const usMeWorkReleaseSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      ...custodyLevelCriterion().eligible,
      ...yearsRemainingCriterion().eligible,
      ...served30DaysCriterion().eligible,
      ...noDetainersWarrantsSchema.eligible,
      ...noABViolation90DaysSchema.eligible,
    })
    .partial()
    .passthrough(),
  ineligibleCriteria: z
    .object({
      ...custodyLevelCriterion().ineligible,
      ...yearsRemainingCriterion().ineligible,
      ...served30DaysCriterion().ineligible,
      ...noDetainersWarrantsSchema.ineligible,
      ...noABViolation90DaysSchema.ineligible,
    })
    .partial()
    .passthrough(),
});

export type UsMeWorkReleaseRecord = z.infer<typeof usMeWorkReleaseSchema>;

export type UsMeWorkReleaseCriteria = MergedCriteria<
  UsMeWorkReleaseRecord["eligibleCriteria"],
  UsMeWorkReleaseRecord["ineligibleCriteria"]
>;

export type UsMeWorkReleaseRecordRaw = z.input<typeof usMeWorkReleaseSchema>;
