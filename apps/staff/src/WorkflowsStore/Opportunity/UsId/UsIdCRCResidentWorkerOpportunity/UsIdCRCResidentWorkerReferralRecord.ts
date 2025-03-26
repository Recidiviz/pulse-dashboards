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
          "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD",
        ),
        fullTermCompletionDate: dateStringSchema.nullable(),
        tentativeParoleDate: dateStringSchema.nullable(),
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD",
        ),
        fullTermCompletionDate: dateStringSchema,
        paroleEligibilityDate: dateStringSchema,
        nextParoleHearingDate: dateStringSchema,
      }),
      z.object({
        criteriaName: z.literal(
          "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE",
        ),
        tentativeParoleDate: dateStringSchema,
      }),
    ]),
  ),
});

// TODO(#7697): Remove the old schema once backend changes have been deployed to prod
const oldEligibleCriteria = crcSharedCriteria
  .extend({
    usIdCrcResidentWorkerTimeBasedCriteria:
      oldUsIdCrcWorkReleaseTimeBasedCriteriaSchema,
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
      const criteriaPriority = [
        "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD",
        "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD",
        "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE",
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
            case "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD":
              transformedCriteria.usIdIncarcerationWithin7YearsOfFtcdOrTpd =
                criteriaFound[criteria];
              break;
            case "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD":
              transformedCriteria.usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd =
                criteriaFound[criteria];
              break;
            case "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE":
              transformedCriteria.usIdIncarcerationWithin3YearsOfTpdAndLifeSentence =
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

const incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcdSchema = z.object({
  fullTermCompletionDate: dateStringSchema,
  paroleEligibilityDate: dateStringSchema,
  nextParoleHearingDate: dateStringSchema,
});

const incarcerationWithin3YearsOfTpdAndLifeSentenceSchema = z.object({
  eligibleOffenses: z.array(z.string()),
  groupProjectedParoleReleaseDate: dateStringSchema,
});

const incarcerationWithin7YearsOfFtcdOrTpdSchema = z.object({
  fullTermCompletionDate: dateStringSchema.nullable(),
  groupProjectedParoleReleaseDate: dateStringSchema.nullable(),
});

// These criteria do not come directly from firestore, but are instead
// determined from the shape of usIdCrcResidentWorkerTimeBasedCriteria.
//
// The order of keys in this object matters. Specifically, we must attempt parsing
// incarcerationWithin7YearsOfFtcdOrTpd AFTER incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd
// because the former schema is permissive and will successfully parse the criteria of
// someone who is only eligible for the latter reason, even if their FTCD is more than
// 7 years away.
const derivedCriteria = {
  incarcerationWithin3YearsOfTpdAndLifeSentence:
    incarcerationWithin3YearsOfTpdAndLifeSentenceSchema.optional(),
  incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd:
    incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcdSchema.optional(),
  incarcerationWithin7YearsOfFtcdOrTpd:
    incarcerationWithin7YearsOfFtcdOrTpdSchema.optional(),
};

const newEligibleCriteria = crcSharedCriteria
  .extend({
    // Passthrough values initially instead of parsing them in order to avoid
    // trying to parse strings into Dates twice with dateStringSchema
    usIdCrcResidentWorkerTimeBasedCriteria: z.object({}).passthrough(),
  })
  .extend(derivedCriteria)
  .transform(
    ({ usIdCrcResidentWorkerTimeBasedCriteria: reasons, ...rest }, ctx) => {
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
        message: `Unexpected time-based criteria for CRC Resident Worker: ${JSON.stringify(reasons)}`,
      });
      return z.NEVER;
    },
  );

export const usIdCRCResidentWorkerSchema = opportunitySchemaBase.extend({
  eligibleCriteria: oldEligibleCriteria.or(newEligibleCriteria),
  ineligibleCriteria: crcSharedIneligibleCriteria,
});

export type UsIdCRCResidentWorkerReferralRecord = z.infer<
  typeof usIdCRCResidentWorkerSchema
>;

export type UsIdCRCResidentWorkerReferralRecordRaw = z.input<
  typeof usIdCRCResidentWorkerSchema
>;
