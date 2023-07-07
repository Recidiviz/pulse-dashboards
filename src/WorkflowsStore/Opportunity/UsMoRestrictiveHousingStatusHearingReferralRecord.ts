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

import { isAfter, startOfToday } from "date-fns";
import { z } from "zod";

import { OpportunityValidationError } from "../../errors";
import { ValidateFunction } from "../subscriptions";
import {
  dateStringSchema,
  opportunitySchemaBase,
  stringToIntSchema,
} from "./schemaHelpers";

const cdvSchema = z.object({
  cdvDate: dateStringSchema,
  cdvRule: z.string(),
});

export const usMoRestrictiveHousingStatusHearingSchema = opportunitySchemaBase
  .extend({
    metadata: z.object({
      mostRecentHearingDate: dateStringSchema,
      mostRecentHearingType: z.string(),
      mostRecentHearingFacility: z.string(),
      mostRecentHearingComments: z.string(),
      currentFacility: z.string(),
      restrictiveHousingStartDate: dateStringSchema,
      bedNumber: z.string(),
      roomNumber: z.string(),
      complexNumber: z.string(),
      buildingNumber: z.string(),
      housingUseCode: z.string(),
      majorCdvs: z.array(cdvSchema),
      cdvsSinceLastHearing: z.array(cdvSchema),
      numMinorCdvsBeforeLastHearing: stringToIntSchema,
    }),
    eligibleCriteria: z.object({
      usMoOverdueForHearing: z
        .object({
          nextReviewDate: dateStringSchema,
        })
        .optional(), // can be almost eligible without this
      usMoInRestrictiveHousing: z.object({
        confinementType: z.string(),
      }),
    }),
    ineligibleCriteria: z.object({
      usMoOverdueForHearing: z
        .object({
          nextReviewDate: dateStringSchema
            .nullable()
            .transform((nullableDate) =>
              // Transform nulls into undefineds just to make typing a bit more convenient elsewhere
              nullableDate === null ? undefined : nullableDate
            ),
        })
        .optional(),
    }),
  })
  .transform((record) => {
    // If someone is almost eligible and our exports are stale,
    // we could end up in a situation where someone goes from upcoming
    // to overdue without their raw data actually being updated.
    // Here, we check to make sure all ineligible dates are in the future
    // and move the reason to the eliglble blob if it's in the past
    if (
      !record.ineligibleCriteria.usMoOverdueForHearing?.nextReviewDate ||
      record.ineligibleCriteria.usMoOverdueForHearing.nextReviewDate >=
        startOfToday()
    ) {
      return record;
    }
    const { eligibleCriteria, ineligibleCriteria, ...rest } = record;
    // @ts-expect-error The if-clause above guarantees nextReviewDate is defined
    eligibleCriteria.usMoOverdueForHearing =
      ineligibleCriteria.usMoOverdueForHearing;
    return {
      ...rest,
      eligibleCriteria,
      ineligibleCriteria: {},
    };
  });

export type UsMoRestrictiveHousingStatusHearingReferralRecord = z.infer<
  typeof usMoRestrictiveHousingStatusHearingSchema
>;

export type UsMoRestrictiveHousingStatusHearingReferralRecordRaw = z.input<
  typeof usMoRestrictiveHousingStatusHearingSchema
>;

export const validateReferral: ValidateFunction<
  UsMoRestrictiveHousingStatusHearingReferralRecord
> = (record) => {
  if (
    record.eligibleCriteria.usMoOverdueForHearing &&
    isAfter(
      record.eligibleCriteria.usMoOverdueForHearing?.nextReviewDate,
      // startOfToday is important here because eligibility dates don't have times, so they're
      // parsed as midnight. If we used new Date(), we would exclude today.
      startOfToday()
    )
  ) {
    throw new OpportunityValidationError(
      "Overdue review date is not in the past"
    );
  }
};
