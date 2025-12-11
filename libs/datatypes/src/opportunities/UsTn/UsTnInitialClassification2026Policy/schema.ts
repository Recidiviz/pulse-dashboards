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

export const usTnInitialClassification2026Schema = opportunitySchemaBase.extend(
  {
    eligibleCriteria: z
      .object({
        custodyLevelIsNotMax: z.null(),
        notHasInitialClassificationInStatePrisonCustody: z.null(),
      })
      .partial()
      .passthrough(),
    ineligibleCriteria: z
      .object({
        custodyLevelIsNotMax: z.object({}).passthrough(),
        notHasInitialClassificationInStatePrisonCustody: z
          .object({})
          .passthrough(),
      })
      .partial()
      .passthrough(),
    formInformation: z
      .object({
        calculatedTotalScore: z.coerce.number(),
        classificationType: z.string(),
        gangAffiliationId: z.string().nullable(),
        healthClassification: z.string(),
        lastCafDate: dateStringSchema.nullable(),
        lastCafTotal: z.coerce.number().nullable(),
        latestClassificationDate: dateStringSchema.nullable(),
        latestOverrideReason: z.string().nullable(),
        latestVantageCompletedDate: dateStringSchema.nullable(),
        latestVantageRiskLevel: z.string().nullable(),
        levelOfCare: z.string().nullable(),
        q1Score: z.coerce.number().nullable(),
        q2Score: z.coerce.number().nullable(),
        q3Score: z.coerce.number().nullable(),
        q4Score: z.coerce.number().nullable(),
        q5Score: z.coerce.number().nullable(),
        q6Score: z.coerce.number().nullable(),
        sentenceEffectiveDate: dateStringSchema,
        sentenceExpirationDate: dateStringSchema,
        sentenceFullExpirationDate: dateStringSchema,
        sentenceReleaseEligibilityDate: dateStringSchema,
        sentenceSafetyValveDate: dateStringSchema,
        statusAtHearingSeg: z.string().nullable(),
      })
      .passthrough(),
  },
);

export type UsTnInitialClassification2026ReferralRecord = ParsedRecord<
  typeof usTnInitialClassification2026Schema
>;
