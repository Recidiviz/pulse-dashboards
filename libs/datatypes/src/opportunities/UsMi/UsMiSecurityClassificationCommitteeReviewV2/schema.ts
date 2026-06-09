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

import { z } from "zod";

import { solitarySessionType } from "../../../people/Resident/US_MI/metadata/schema";
import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod/date/dateStringSchema";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const possiblyIneligibleCriteria = z
  .object({
    usMiPastAdSegSecurityClassificationCommitteeReviewDate: z.object({
      facilitySolitaryStartDate: dateStringSchema.nullish(),
      latestSccReviewDate: dateStringSchema.nullish(),
      nextSccDueDate: dateStringSchema.nullable(),
    }),
    usMiPastTempSegSecurityClassificationCommitteeReviewDate: z.object({
      facilitySolitaryStartDate: dateStringSchema.nullish(),
      latestSccReviewDate: dateStringSchema.nullish(),
      nextSccDueDate: dateStringSchema.nullable(),
    }),
  })
  .partial()
  .passthrough();

const jsonAdSegStaySchema = z.object({
  stayStartDate: dateStringSchema,
  stayEndDate: dateStringSchema,
  stayOffenses: z.string(),
});

const jsonRecentBondableOffenseSchema = z.object({
  bondableOffense: z.string(),
  bondableIncidentDate: dateStringSchema,
});

const jsonRecentNonbondableOffenseSchema = z.object({
  nonbondableOffense: z.string(),
  nonbondableIncidentDate: dateStringSchema,
});

const jsonProgrammingSchema = z.object({
  endDate: dateStringSchema.nullable(),
  program: z.string(),
  programEndReason: z.string().nullable(),
  programStatus: z.string().nullable(),
  referralDate: dateStringSchema.nullable(),
  startDate: dateStringSchema.nullable(),
});

export type UsMiSolitarySessionType = z.output<typeof solitarySessionType>;
export type ProgrammingMetadata = z.output<typeof jsonProgrammingSchema>;

export const usMiSecurityClassificationCommitteeReviewV2Schema =
  opportunitySchemaBase.extend({
    eligibleCriteria: possiblyIneligibleCriteria,
    ineligibleCriteria: possiblyIneligibleCriteria,
    formInformation: z
      .object({
        segregationType: z.string().optional(),
        segregationClassificationDate: dateStringSchema.nullable(),
        prisonerNumber: z.string(),
        prisonerName: z.string(),
        maxReleaseDate: dateStringSchema.nullish(),
        minReleaseDate: dateStringSchema.nullish(),
        facility: z.string().optional(),
        lock: z.string().optional(),
        lockDate: dateStringSchema.nullish(),
        OPT: z.boolean().optional(),
        SMI: z.boolean(),
        STG: z.string().optional(),
        bondableOffensesWithin6Months: z.string().nullish(),
        nonbondableOffensesWithin1Year: z.string().optional(),
        adSegStaysAndReasonsWithin3Yrs: z.array(z.string()).optional(),
        nMisconductReportsSinceLatestReview: z.string(),
      })
      .transform(({ nMisconductReportsSinceLatestReview, ...rest }) => ({
        ...rest,
        // We started auto-filling this field AFTER launch and it was already an
        // editable form field, so we will rename the data field to avoid having
        // to migrate the form update field.
        reportsSinceReview: nMisconductReportsSinceLatestReview,
      })),
    metadata: z.object({
      latestSccReviewDate: dateStringSchema.optional(),
      programming: z.array(jsonProgrammingSchema),
      daysInSolitarySession: z.coerce.number(),
      lessThan24MonthsFromErd: z.boolean().optional(),
      neededProgramming: z.string().optional(),
      completedProgramming: z.string().optional(),
      solitarySessionStartDate: dateStringSchema.optional(),
      solitarySessionType: solitarySessionType,
      jsonAdSegStaysAndReasonsWithin3Yrs: z
        .array(jsonAdSegStaySchema)
        .default([]),
      jsonRecentBondableOffenses: z
        .array(jsonRecentBondableOffenseSchema)
        .default([]),
      jsonRecentNonbondableOffenses: z
        .array(jsonRecentNonbondableOffenseSchema)
        .default([]),
      nextSccDate: dateStringSchema.optional(),
      tabName: z.string(),
    }),
  });

export type usMiSecurityClassificationCommitteeReviewV2Record = ParsedRecord<
  typeof usMiSecurityClassificationCommitteeReviewV2Schema
>;
