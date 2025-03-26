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

import {
  crcSharedCriteria,
  crcSharedIneligibleCriteria,
} from "../UsIdSharedCriteria";

const oldUsIdCrcWorkReleaseTimeBasedCriteriaSchema = z.object({
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

// TODO(#7697): Remove the old schema once backend changes have been deployed to prod
const oldEligibleCriteriaSchema = crcSharedCriteria
  .extend({
    usIdCrcWorkReleaseTimeBasedCriteria:
      oldUsIdCrcWorkReleaseTimeBasedCriteriaSchema,
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
  );

const incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcdSchema = z.object({
  fullTermCompletionDate: dateStringSchema,
  minTermCompletionDate: dateStringSchema,
});

const incarcerationWithin18MonthsOfFtcdOrTpdSchema = z.object({
  fullTermCompletionDate: dateStringSchema.nullable(),
  groupProjectedParoleReleaseDate: dateStringSchema.nullable(),
});

const incarcerationWithin1YearOfTpdAndLifeSentenceSchema = z.object({
  eligibleOffenses: z.array(z.string()),
  groupProjectedParoleReleaseDate: dateStringSchema,
});

// These criteria do not come directly from firestore, but are instead
// determined from the shape of usIdCrcWorkReleaseTimeBasedCriteria.
//
// The order of keys in this object matters. Specifically, we must attempt parsing
// incarcerationWithin18MonthsOfFtcdOrTpdSchema AFTER incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcdSchema
// because the former schema is permissive and will successfully parse the criteria of
// someone who is only eligible for the latter reason, even if their FTCD is more than
// 18 months away.
const derivedCriteria = {
  incarcerationWithin1YearOfTpdAndLifeSentence:
    incarcerationWithin1YearOfTpdAndLifeSentenceSchema.optional(),
  incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd:
    incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcdSchema.optional(),
  incarcerationWithin18MonthsOfFtcdOrTpd:
    incarcerationWithin18MonthsOfFtcdOrTpdSchema.optional(),
};

const newEligibleCriteriaSchema = crcSharedCriteria
  .extend({
    // Passthrough values initially instead of parsing them in order to avoid
    // trying to parse strings into Dates twice with dateStringSchema
    usIdCrcWorkReleaseTimeBasedCriteria: z.object({}).passthrough(),
  })
  .extend(derivedCriteria)
  .transform(
    ({ usIdCrcWorkReleaseTimeBasedCriteria: reasons, ...rest }, ctx) => {
      const transformedCriteria = rest;

      for (const [key, schema] of Object.entries(derivedCriteria)) {
        const parsed = schema.safeParse(reasons);
        if (parsed.success) {
          transformedCriteria[key] = parsed.data;
          return transformedCriteria;
        }
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unexpected time-based criteria for CRC Work Release: ${JSON.stringify(reasons)}`,
      });
      return z.NEVER;
    },
  );

export const usIdCRCWorkReleaseSchema = opportunitySchemaBase.extend({
  eligibleCriteria: oldEligibleCriteriaSchema.or(newEligibleCriteriaSchema),
  ineligibleCriteria: crcSharedIneligibleCriteria,
});

export type UsIdCRCWorkReleaseReferralRecord = z.infer<
  typeof usIdCRCWorkReleaseSchema
>;

export type UsIdCRCWorkReleaseReferralRecordRaw = z.input<
  typeof usIdCRCWorkReleaseSchema
>;
