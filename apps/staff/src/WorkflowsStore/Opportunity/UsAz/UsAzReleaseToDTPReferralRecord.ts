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

const zodNullableObject = z.object({}).nullable();

const possiblyIneligibleCriteria = z
  .object({
    usAzNoActiveFelonyDetainers: zodNullableObject,
    usAzEnrolledInOrMeetsMandatoryLiteracy: zodNullableObject,
    usAzWithin6MonthsOfRecidivizDtpDate: z.object({
      recidivizDtpDate: dateStringSchema,
    }),
  })
  .partial();

export const usAzReleaseToDTPSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.union([
      z.object({}),
      possiblyIneligibleCriteria
        .extend({
          usAzNoSexualArsonOrDangerousCrimesAgainstChildren: zodNullableObject,
          custodyLevelIsMinimumOrMedium: zodNullableObject,
          usAzNoUnsatisfactoryProgramRatingsWithin3Months: zodNullableObject,
          usAzNotServingFlatSentence: zodNullableObject,
          usAzNoViolationsAndEligibleLegalStatus: zodNullableObject,
          usAzNoAcisDtpOrTprDateSet: zodNullableObject,
          usAzOnlyDrugOffenseConvictions: zodNullableObject,
          usAzNoDomesticViolenceConviction: zodNullableObject,
          usAzNoSexualExploitationOfChildrenConviction: zodNullableObject,
          usAzNoViolentConviction: zodNullableObject,
          usAzNoDtpDenialOrPreviousDtpRelease: zodNullableObject,
          usAzNoDtpRemovalsFromSelfImprovementPrograms: zodNullableObject,
        })
        .passthrough(),
    ]),
    ineligibleCriteria: z.union([
      z.object({
        usAzIncarcerationPastAcisDtpDate: z.object({
          recidivizDtpDate: dateStringSchema,
        }),
      }),
      possiblyIneligibleCriteria.passthrough(),
    ]),
    metadata: z
      .object({
        tabName: z.string().optional(),
        tabDescription: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type UsAzReleaseToDTPReferralRecordRaw = z.input<
  typeof usAzReleaseToDTPSchema
>;
export type UsAzReleaseToDTPReferralRecord = z.infer<
  typeof usAzReleaseToDTPSchema
>;
