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

import { caseNotesSchema, dateStringSchema } from "~datatypes";

import { opportunitySchemaBase } from "../../schemaHelpers";
import {
  custodyLevelIsMinimum,
  notServingForSexualOffense,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
  usIdNoDetainersForXcrcAndCrc,
} from "../UsIdSharedCriteria";

const usIdCrcWorkReleaseTimeBasedCriteria = z.object({
  reasons: z.array(
    z.discriminatedUnion("criteriaName", [
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD",
        ),
        fullTermCompletionDate: dateStringSchema.nullable(),
        tentativeParoleDate: dateStringSchema.nullable(),
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD",
        ),
        fullTermCompletionDate: dateStringSchema,
        minTermCompletionDate: dateStringSchema,
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE",
        ),
        tentativeParoleDate: dateStringSchema,
      }),
    ]),
  ),
});

export const usIdCRCWorkReleaseSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        custodyLevelIsMinimum,
        notServingForSexualOffense,
        usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years,
        usIdNoDetainersForXcrcAndCrc,
        usIdCrcWorkReleaseTimeBasedCriteria,
        // The three criteria below do not come directly from firestore
        // but are instead derived from usIdCrcWorkReleaseTimeBasedCriteria
        usIdIncarcerationWithin18MonthsOfFtcdOrTpd: z
          .object({
            fullTermCompletionDate: dateStringSchema.nullable(),
            tentativeParoleDate: dateStringSchema.nullable(),
          })
          .optional(),
        usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd: z
          .object({
            fullTermCompletionDate: dateStringSchema,
            minTermCompletionDate: dateStringSchema,
          })
          .optional(),
        usIdIncarcerationWithin1YearOfTpdAndLifeSentence: z
          .object({
            tentativeParoleDate: dateStringSchema,
          })
          .optional(),
      })
      .transform(
        ({ usIdCrcWorkReleaseTimeBasedCriteria: timeCriteria, ...rest }) => {
          const transformedCriteria = { ...rest };
          const criteriaPriority = [
            "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD",
            "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD",
            "US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE",
          ];

          const criteriaFound = timeCriteria.reasons.reduce(
            (acc: any, { criteriaName, ...otherReasons }: any) => {
              acc[criteriaName] = otherReasons;
              return acc;
            },
            {},
          );

          for (const criteria of criteriaPriority) {
            if (criteriaFound[criteria]) {
              switch (criteria) {
                case "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD":
                  transformedCriteria.usIdIncarcerationWithin18MonthsOfFtcdOrTpd =
                    criteriaFound[criteria];
                  break;
                case "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD":
                  transformedCriteria.usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd =
                    criteriaFound[criteria];
                  break;
                case "US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE":
                  transformedCriteria.usIdIncarcerationWithin1YearOfTpdAndLifeSentence =
                    criteriaFound[criteria];
                  break;
                default:
                  throw new Error(
                    `Unexpected time-based criteria for CRC Work Release: ${criteria}`,
                  );
              }
              break;
            }
          }

          return transformedCriteria;
        },
      ),
    ineligibleCriteria: z.object({}),
  })
  .merge(caseNotesSchema);

export type UsIdCRCWorkReleaseReferralRecord = z.infer<
  typeof usIdCRCWorkReleaseSchema
>;

export type UsIdCRCWorkReleaseReferralRecordRaw = z.input<
  typeof usIdCRCWorkReleaseSchema
>;
