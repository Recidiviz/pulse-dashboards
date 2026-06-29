// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { camelCase, mapKeys } from "lodash-es";
import { z } from "zod";

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema, stringToIntSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import { sentenceTypeSchema } from "../common";

const collapsedCriteriaSchema = z
  .object({
    usIdParoleDualSupervisionPastEarlyDischargeDate: z.object({
      eligibleDate: dateStringSchema,
      sentenceType: sentenceTypeSchema,
    }),
    onProbationAtLeastOneYear: z.object({
      eligibleDate: dateStringSchema,
    }),
  })
  .partial()
  .passthrough()
  .transform(
    ({
      usIdParoleDualSupervisionPastEarlyDischargeDate,
      onProbationAtLeastOneYear,
      ...rest
    }) => {
      if (onProbationAtLeastOneYear) {
        return {
          pastEarnedDischargeEligibleDate: onProbationAtLeastOneYear,
          ...rest,
        };
      }

      if (usIdParoleDualSupervisionPastEarlyDischargeDate) {
        return {
          pastEarnedDischargeEligibleDate:
            usIdParoleDualSupervisionPastEarlyDischargeDate,
          ...rest,
        };
      }

      return rest;
    },
  );

export const usIdEarnedDischargeSchema = opportunitySchemaBase.extend({
  formInformation: z
    .object({
      ncicCheckDate: dateStringSchema,
      fullTermReleaseDates: z.array(dateStringSchema),
      chargeDescriptions: z.array(z.string()),
      judgeNames: z.array(
        z
          .string()
          .transform((content) => {
            const parsedJSON = JSON.parse(content);
            return mapKeys(parsedJSON, (_v, k) => camelCase(k));
          })
          .pipe(
            z.object({
              givenNames: z.string(),
              middleNames: z.string().optional(),
              nameSuffix: z.string().optional(),
              surname: z.string(),
            }),
          ),
      ),
      countyNames: z.array(z.string()),
      sentenceMax: z.array(stringToIntSchema),
      sentenceMin: z.array(stringToIntSchema),
      caseNumbers: z.array(z.string()),
      dateImposed: z.array(dateStringSchema),
      firstAssessmentScore: stringToIntSchema,
      firstAssessmentDate: dateStringSchema,
      latestAssessmentScore: stringToIntSchema,
      latestAssessmentDate: dateStringSchema,
    })
    .partial(),
  ineligibleCriteria: collapsedCriteriaSchema,
  eligibleCriteria: z
    .object({
      noFelonyWithin24Months: z
        .null()
        .transform((output) => (output === null ? true : output)),
      usIdLsirLevelLowModerateForXDays: z.object({
        eligibleDate: dateStringSchema,
        riskLevel: z.enum(["LOW", "MODERATE"]),
      }),
    })
    .passthrough()
    .pipe(collapsedCriteriaSchema),
  eligibleStartDate: dateStringSchema.optional(),
});

export type UsIdEarnedDischargeRecord = ParsedRecord<
  typeof usIdEarnedDischargeSchema
>;
