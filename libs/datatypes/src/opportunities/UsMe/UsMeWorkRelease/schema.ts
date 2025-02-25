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

import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import { MergedCriteria } from "../../utils/types";
import {
  custodyLevelReason,
  eligibleDateReason,
  noABViolation90DaysSchema,
  noDetainersWarrantsSchema,
  usMeDenialMetadataSchema,
} from "../common";

function custodyLevelCriterion() {
  return custodyLevelReason("usMeCustodyLevelIsMinimum");
}

function yearsRemainingCriterion() {
  return eligibleDateReason("usMeThreeYearsRemainingOnSentence");
}

function served30DaysCriterion() {
  return eligibleDateReason(
    "usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease",
  );
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
  metadata: z.object({
    denial: usMeDenialMetadataSchema,
  }),
});

export type UsMeWorkReleaseRecord = z.infer<typeof usMeWorkReleaseSchema>;

export type UsMeWorkReleaseCriteria = MergedCriteria<
  UsMeWorkReleaseRecord["eligibleCriteria"],
  UsMeWorkReleaseRecord["ineligibleCriteria"]
>;

export type UsMeWorkReleaseRecordRaw = z.input<typeof usMeWorkReleaseSchema>;
