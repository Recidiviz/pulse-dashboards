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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { NullCoalesce } from "../../schemaHelpers";

const usMePaidAllOwedRestitution = NullCoalesce(
  {},
  z.object({ amountOwed: z.number().optional() }),
).optional();

const eligibleCriteria = z.object({
  usMePaidAllOwedRestitution,
  noConvictionWithin6Months: NullCoalesce(
    {},
    z
      .object({
        latestConvictions: z.array(z.string()).optional(),
      })
      .optional(),
  ).optional(),
  usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: z.object({
    eligibleDate: dateStringSchema,
  }),
  usMeNoPendingViolationsWhileSupervised: NullCoalesce(
    {},
    z
      .object({
        currentStatus: z.string().optional(),
        violationDate: dateStringSchema.optional(),
      })
      .optional(),
  ).optional(),
  supervisionLevelIsMediumOrLower: z.object({
    supervisionLevel: z.string(),
  }),
});

const ineligibleCriteria = z.object({
  usMePaidAllOwedRestitution,
  usMeNoPendingViolationsWhileSupervised: z
    .object({
      currentStatus: z.string(),
      violationDate: dateStringSchema,
    })
    .nullable()
    .optional(),
});

export const usMeEarlyTerminationSchema = opportunitySchemaBase.extend({
  eligibleCriteria,
  ineligibleCriteria,
});

export type UsMeEarlyTerminationReferralRecord = z.infer<
  typeof usMeEarlyTerminationSchema
>;

export type UsMeEarlyTerminationReferralRecordRaw = z.input<
  typeof usMeEarlyTerminationSchema
>;
