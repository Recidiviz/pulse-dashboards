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

import { addDays } from "date-fns";
import { z } from "zod";

import { dateStringSchema } from "~datatypes";

import { baseUsMoOverdueRestrictiveHousingSchema } from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingReferralRecord";

const usMoPastLatestScheduledReviewDate = z
  .object({
    nextReviewDate: dateStringSchema,
    dueDateInferred: z.boolean(),
  })
  .nullish();

const eligibleCriteria =
  baseUsMoOverdueRestrictiveHousingSchema.shape.eligibleCriteria.extend({
    usMoPastLatestScheduledReviewDate,
    usMoHearingAfterRestrictiveHousingStart: z.object({
      latestRestrictiveHousingHearingDate: dateStringSchema,
      restrictiveHousingStartDate: dateStringSchema,
    }),
  });

const ineligibleCriteria =
  baseUsMoOverdueRestrictiveHousingSchema.shape.ineligibleCriteria.extend({
    usMoPastLatestScheduledReviewDate,
  });

export const usMoOverdueRestrictiveHousingReviewHearingSchema =
  baseUsMoOverdueRestrictiveHousingSchema
    .extend({
      eligibleCriteria,
      ineligibleCriteria,
    })
    .transform((record) => {
      if (record.ineligibleCriteria?.usMoPastLatestScheduledReviewDate !== null)
        return record;

      const rectifiedUsMoPastLatestScheduledReviewDate = {
        nextReviewDate: addDays(
          record.eligibleCriteria.usMoHearingAfterRestrictiveHousingStart
            .latestRestrictiveHousingHearingDate,
          30,
        ),
        dueDateInferred: true,
      };

      return {
        ...record,
        ineligibleCriteria: {
          ...record.ineligibleCriteria,
          usMoPastLatestScheduledReviewDate:
            rectifiedUsMoPastLatestScheduledReviewDate,
        },
      };
    });

export type UsMoOverdueRestrictiveHousingReviewHearingReferralRecord = z.infer<
  typeof usMoOverdueRestrictiveHousingReviewHearingSchema
>;

export type UsMoOverdueRestrictiveHousingReviewHearingReferralRecordRaw =
  z.input<typeof usMoOverdueRestrictiveHousingReviewHearingSchema>;
