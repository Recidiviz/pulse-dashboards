// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { dateStringSchema } from "~datatypes";

import { usAzReleaseToTransitionProgramSchemaBase } from "../UsAzReleaseToTransitionProgramBaseSchema";

export const usAzReleaseToDTPSchema = usAzReleaseToTransitionProgramSchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        usAzIncarcerationWithin6MonthsOfAcisDtpDate: z.object({
          acisDtpDate: dateStringSchema,
        }),
      })
      .passthrough()
      .or(
        z
          .object({
            usAzWithin7DaysOfRecidivizDtpDate: z.object({
              recidivizDtpDate: dateStringSchema,
            }),
          })
          .passthrough(),
      ),
  })
  .or(
    usAzReleaseToTransitionProgramSchemaBase.extend({
      ineligibleCriteria: z
        .object({
          usAzWithin7DaysOfRecidivizDtpDate: z.object({
            recidivizDtpDate: dateStringSchema,
          }),
        })
        .passthrough(),
    }),
  );

export type UsAzReleaseToDTPReferralRecordRaw = z.input<
  typeof usAzReleaseToDTPSchema
>;
export type UsAzReleaseToDTPReferralRecord = z.infer<
  typeof usAzReleaseToDTPSchema
>;
