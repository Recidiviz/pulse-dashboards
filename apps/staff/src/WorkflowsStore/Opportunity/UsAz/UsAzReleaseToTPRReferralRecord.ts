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

import { opportunitySchemaBase } from "~datatypes";

const zodNullableObject = z.object({}).nullable();

const possiblyIneligibleCriteria = z
  .object({
    usAzNoActiveFelonyDetainers: zodNullableObject,
    usAzMeetsFunctionalLiteracy: zodNullableObject,
  })
  .partial()
  .passthrough();

export const usAzReleaseToTPRSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: possiblyIneligibleCriteria
      .extend({
        usAzTime90DaysBeforeRelease: zodNullableObject,
        usAzNoSexualOffenseConviction: zodNullableObject,
        usAzNoArsonConviction: zodNullableObject,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          zodNullableObject,
        usAzNoActiveFelonyDetainers: zodNullableObject.optional(),
        custodyLevelIsMinimumOrMedium: zodNullableObject,
        noNonviolentIncarcerationViolationWithin6Months: zodNullableObject,
        usAzNoMajorViolentViolationDuringIncarceration: zodNullableObject,
        usAzAtLeast24MonthsSinceLastCsed: zodNullableObject,
        usAzIsUsCitizenOrLegalPermanentResident: zodNullableObject,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: zodNullableObject,
        usAzNoDangerousCrimesAgainstChildrenConviction: zodNullableObject,
        usAzMeetsFunctionalLiteracy: zodNullableObject.optional(),
        usAzNoTprDenialInCurrentIncarceration: zodNullableObject,
        usAzNoTprRemovalsFromSelfImprovementPrograms: zodNullableObject,
      })
      .passthrough(),
    ineligibleCriteria: possiblyIneligibleCriteria,
    metadata: z
      .object({
        tabName: z.string().optional(),
        tabDescription: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type UsAzReleaseToTPRReferralRecordRaw = z.input<
  typeof usAzReleaseToTPRSchema
>;
export type UsAzReleaseToTPRReferralRecord = z.infer<
  typeof usAzReleaseToTPRSchema
>;
