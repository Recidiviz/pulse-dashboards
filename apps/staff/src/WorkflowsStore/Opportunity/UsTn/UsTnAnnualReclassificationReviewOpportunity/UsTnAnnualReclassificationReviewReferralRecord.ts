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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { formInformationSchema as formInformation } from "../UsTnSharedCriteria";

export const usTnAnnualReclassificationReviewSchema =
  opportunitySchemaBase.extend({
    eligibleCriteria: z
      .object({
        usTnAtLeast12MonthsSinceLatestAssessment: z.null(),
        custodyLevelIsNotMax: z.null(),
        custodyLevelComparedToRecommended: z.object({
          custodyLevel: z
            .string()
            .nullable()
            .transform((custodyLevel) => custodyLevel ?? "NOT YET CLASSIFIED"),
          recommendedCustodyLevel: z.string().nullable(),
        }),
      })
      .passthrough(),
    formInformation: formInformation.partial(),
    formReclassificationDueDate: dateStringSchema.optional(),
  });

export type UsTnAnnualReclassificationReviewReferralRecord = z.infer<
  typeof usTnAnnualReclassificationReviewSchema
>;
export type UsTnAnnualReclassificationReviewReferralRecordRaw = z.input<
  typeof usTnAnnualReclassificationReviewSchema
>;
