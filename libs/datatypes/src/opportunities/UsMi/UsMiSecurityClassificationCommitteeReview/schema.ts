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

import { dateStringSchema } from "../../../utils/dateStringSchema";
import { ParsedRecord } from "../../../utils/types";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const possiblyIneligibleCriteria = z
  .object({
    usMiPastSecurityClassificationCommitteeReviewDate: z.object({
      facilitySolitaryStartDate: dateStringSchema.nullable(),
      latestSccReviewDate: dateStringSchema.nullable(),
      nextSccDate: dateStringSchema.nullable(),
      numberOfExpectedReviews: z.number().nullable(),
      numberOfReviews: z.number().nullable(),
    }),
  })
  .partial();

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
      OPT: z.boolean(),
      STG: z.string(),
      bondableOffensesWithin6Months: z.string().nullish(),
      nonbondableOffensesWithin1Year: z.string().optional(),
      adSegStaysAndReasonsWithin3Years: z.array(z.string()).optional(),
    }),
    metadata: z.object({
      daysInCollapsedSolitarySession: z.coerce.number(),
    }),
  });

export type usMiSecurityClassificationCommitteeReviewRecord = ParsedRecord<
  typeof usMiSecurityClassificationCommitteeReviewSchema
>;
