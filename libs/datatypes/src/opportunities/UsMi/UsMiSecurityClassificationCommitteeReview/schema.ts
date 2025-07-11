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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod/date/dateStringSchema";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const possiblyIneligibleCriteria = z
  .object({
    usMiPastSecurityClassificationCommitteeReviewDate: z.object({
      // TODO(#8767): Make optional once hydrated
      facilitySolitaryStartDate: dateStringSchema.nullish(),
      latestSccReviewDate: dateStringSchema.nullable(),
      nextSccDate: dateStringSchema.nullable(),
    }),
  })
  .partial()
  .passthrough();

export const usMiSecurityClassificationCommitteeReviewSchema =
  opportunitySchemaBase.extend({
    eligibleCriteria: possiblyIneligibleCriteria.extend({
      housingUnitTypeIsSolitaryConfinement: z.object({
        solitaryStartDate: dateStringSchema,
      }),
    }),
    ineligibleCriteria: possiblyIneligibleCriteria,
    formInformation: z.object({
      segregationType: z.string(),
      segregationClassificationDate: dateStringSchema.nullable(),
      prisonerNumber: z.string(),
      prisonerName: z.string(),
      maxReleaseDate: dateStringSchema.nullish(),
      minReleaseDate: dateStringSchema.nullish(),
      facility: z.string(),
      lock: z.string(),
      STG: z.string().optional(),
      bondableOffensesWithin6Months: z.string().nullish(),
      nonbondableOffensesWithin1Year: z.string().optional(),
      adSegStaysAndReasonsWithin3Yrs: z.array(z.string()).optional(),
    }),
    metadata: z.object({
      daysInCollapsedSolitarySession: z.coerce.number(),
      recentBondableOffenses: z.string().nullish(),
      recentNonbondableOffenses: z.string().optional(),
      adSegStaysAndReasonsWithin3Yrs: z.array(z.string()).optional(),
      lessThan24MonthsFromErd: z.boolean().optional(),
      neededProgramming: z.string().optional(),
      completedProgramming: z.string().optional(),
    }),
    isOverdue: z.boolean(),
  });

export type usMiSecurityClassificationCommitteeReviewRecord = ParsedRecord<
  typeof usMiSecurityClassificationCommitteeReviewSchema
>;
