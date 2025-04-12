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

const crcWorkReleaseEligibleCriteria = crcSharedCriteria
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
  eligibleCriteria: crcWorkReleaseEligibleCriteria,
  ineligibleCriteria: crcSharedIneligibleCriteria,
});

export type UsIdCRCWorkReleaseReferralRecord = z.infer<
  typeof usIdCRCWorkReleaseSchema
>;

export type UsIdCRCWorkReleaseReferralRecordRaw = z.input<
  typeof usIdCRCWorkReleaseSchema
>;
