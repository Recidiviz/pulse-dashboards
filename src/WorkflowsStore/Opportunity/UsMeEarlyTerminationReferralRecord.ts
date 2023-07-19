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

import { TransformFunction } from "../subscriptions";
import {
  caseNotesSchema,
  dateStringSchema,
  NullCoalesce,
  opportunitySchemaBase,
} from "./schemaHelpers";

const criteria = z.object({
  usMePaidAllOwedRestitution: NullCoalesce(
    {},
    z.object({ amountOwed: z.number().optional() })
  ).optional(),
  noConvictionWithin6Months: NullCoalesce(
    {},
    z
      .object({
        latestConvictions: z.array(z.string()).optional(),
      })
      .optional()
  ).optional(),
  usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: NullCoalesce(
    {},
    z.object({
      eligibleDate: dateStringSchema.optional(),
    })
  ).optional(),
  onMediumSupervisionLevelOrLower: z.object({ supervisionLevel: z.string() }),
  usMeNoPendingViolationsWhileSupervised: NullCoalesce(
    {},
    z
      .object({
        currentStatus: z.string().optional(),
        violationDate: dateStringSchema.optional(),
      })
      .optional()
  ).optional(),
});

const ineligibleCriteria = z.object({
  usMeNoPendingViolationsWhileSupervised: z
    .object({
      currentStatus: z.string(),
      violationDate: dateStringSchema,
    })
    .nullable()
    .optional(),
});

export const usMeEarlyTerminationSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: criteria,
    ineligibleCriteria: criteria
      .pick({
        usMePaidAllOwedRestitution: true,
        usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: true,
      })
      .merge(ineligibleCriteria),
  })
  .merge(caseNotesSchema);

export type UsMeEarlyTerminationReferralRecord = z.infer<
  typeof usMeEarlyTerminationSchema
>;

export type UsMeEarlyTerminationReferralRecordRaw = z.input<
  typeof usMeEarlyTerminationSchema
>;

export const transformReferral: TransformFunction<
  UsMeEarlyTerminationReferralRecord
> = (record) => {
  return usMeEarlyTerminationSchema.parse(record);
};
