// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  caseNotesSchema,
  dateStringSchema,
  opportunitySchemaBase,
} from "../../schemaHelpers";
import {
  custodyLevelIsMinimum,
  notServingForSexualOffense,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
  usIdNoDetainersForCrc,
} from "../UsIdSharedCriteria";

const usIdCrcResidentWorkerTimeBasedCriteria = z.object({
  reasons: z.array(
    z.discriminatedUnion("criteriaName", [
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD"
        ),
        fullTermCompletionDate: dateStringSchema.nullable(),
        tentativeParoleDate: dateStringSchema.nullable(),
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD"
        ),
        fullTermCompletionDate: dateStringSchema,
        paroleEligibilityDate: dateStringSchema,
        nextParoleHearingDate: dateStringSchema,
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE"
        ),
        tentativeParoleDate: dateStringSchema,
      }),
    ])
  ),
});

export const usIdCRCResidentWorkerSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        custodyLevelIsMinimum,
        notServingForSexualOffense,
        usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
        usIdNoDetainersForCrc,
        usIdCrcResidentWorkerTimeBasedCriteria,
        // The three criteria below do not come directly from firestore
        // but are instead derived from usIdCrcResidentWorkerTimeBasedCriteria
        usIdIncarcerationWithin7YearsOfFtcdOrTpd: z
          .object({
            fullTermCompletionDate: dateStringSchema.nullable(),
            tentativeParoleDate: dateStringSchema.nullable(),
          })
          .optional(),
        usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd: z
          .object({
            fullTermCompletionDate: dateStringSchema,
            paroleEligibilityDate: dateStringSchema,
            nextParoleHearingDate: dateStringSchema,
          })
          .optional(),
        usIdIncarcerationWithin3YearsOfTpdAndLifeSentence: z
          .object({
            tentativeParoleDate: dateStringSchema,
          })
          .optional(),
      })
      .transform(
        ({ usIdCrcResidentWorkerTimeBasedCriteria: timeCriteria, ...rest }) => {
          const transformedCriteria = { ...rest };
          for (const {
            criteriaName,
            ...otherReasons
          } of timeCriteria.reasons) {
            switch (criteriaName) {
              case "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD":
                // @ts-expect-error
                transformedCriteria.usIdIncarcerationWithin7YearsOfFtcdOrTpd =
                  otherReasons;
                break;
              case "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD":
                // @ts-expect-error
                transformedCriteria.usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd =
                  otherReasons;
                break;
              case "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE":
                // @ts-expect-error
                transformedCriteria.usIdIncarcerationWithin3YearsOfTpdAndLifeSentence =
                  otherReasons;
                break;
              default:
                throw new Error(
                  `Unexpected time-based criteria for CRC Work Release: ${criteriaName}`
                );
            }
          }

          return transformedCriteria;
        }
      ),
    ineligibleCriteria: z.object({}),
  })
  .merge(caseNotesSchema);

export type UsIdCRCResidentWorkerReferralRecord = z.infer<
  typeof usIdCRCResidentWorkerSchema
>;

export type UsIdCRCResidentWorkerReferralRecordRaw = z.input<
  typeof usIdCRCResidentWorkerSchema
>;
