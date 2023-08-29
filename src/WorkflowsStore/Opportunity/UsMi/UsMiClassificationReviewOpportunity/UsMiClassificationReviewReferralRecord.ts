/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { z } from "zod";

import {
  caseNotesSchema,
  eligibleDateSchema,
  opportunitySchemaBase,
} from "../../schemaHelpers";

export const usMiClassificationReviewSchemaForSupervisionLevelFormatter = (
  formatter: (raw: string) => string = (s) => s
) =>
  opportunitySchemaBase
    .extend({
      eligibleCriteria: z
        .object({
          usMiNotAlreadyOnLowestEligibleSupervisionLevel: z
            .object({
              supervisionLevel: z.string().transform(formatter).nullable(),
              requiresSoRegistration: z.boolean().nullable(),
            })
            .nullable(),
        })
        .and(
          // this tells zod (and typescript) that we expect exactly one of these fields to be set
          z.union([
            z.object({
              usMiPastInitialClassificationReviewDate: eligibleDateSchema,
              usMiSixMonthsPastLastClassificationReviewDate: z.undefined(),
            }),
            z.object({
              usMiPastInitialClassificationReviewDate: z.undefined(),
              usMiSixMonthsPastLastClassificationReviewDate: eligibleDateSchema,
            }),
          ])
        )
        .transform(
          ({
            usMiPastInitialClassificationReviewDate,
            usMiSixMonthsPastLastClassificationReviewDate,
            ...rest
          }) => ({
            usMiClassificationReviewPastDueDate:
              usMiPastInitialClassificationReviewDate ??
              usMiSixMonthsPastLastClassificationReviewDate,
            ...rest,
          })
        ),
    })
    .merge(caseNotesSchema);

export type UsMiClassificationReviewReferralRecordRaw = z.input<
  ReturnType<typeof usMiClassificationReviewSchemaForSupervisionLevelFormatter>
>;
export type UsMiClassificationReviewReferralRecord = z.infer<
  ReturnType<typeof usMiClassificationReviewSchemaForSupervisionLevelFormatter>
>;
