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

import { opportunitySchemaBase } from "~datatypes";

import { eligibleDateSchema } from "../../schemaHelpers";

export const usMiClassificationReviewSchemaForSupervisionLevelFormatter = (
  formatter: (raw: string) => string = (s) => s,
) => {
  const eligibleAndIneligibleCriteria = z
    .object({
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: z
        .object({
          supervisionLevel: z.string().transform(formatter).nullable(),
          requiresSoRegistration: z.boolean().nullable(),
        })
        .nullable(),
      usMiPastInitialClassificationReviewDate: eligibleDateSchema,
      usMiSixMonthsPastLastClassificationReviewDate: eligibleDateSchema,
    })
    .partial()
    .passthrough();

  return opportunitySchemaBase.extend({
    eligibleCriteria: eligibleAndIneligibleCriteria,
    ineligibleCriteria: eligibleAndIneligibleCriteria,
    metadata: z.object({
      recommendedSupervisionLevel: z.string().optional(),
    }),
  });
};

export type UsMiClassificationReviewReferralRecordRaw = z.input<
  ReturnType<typeof usMiClassificationReviewSchemaForSupervisionLevelFormatter>
>;
export type UsMiClassificationReviewReferralRecord = z.infer<
  ReturnType<typeof usMiClassificationReviewSchemaForSupervisionLevelFormatter>
>;
