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

import { differenceInDays, isBefore, startOfToday } from "date-fns";
import { z } from "zod";

import { FeatureGateError, OpportunityValidationError } from "../../errors";
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
      // TODO(#3454): remove usMoHasUpcomingHearing
      usMoHasUpcomingHearing: z
        .object({
          nextReviewDate: dateStringSchema,
        })
        .optional(), // will be replaced with overdueForHearing
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
          nextReviewDate: dateStringSchema.nullable(),
        })
        .optional(),
    }),
  })
  .transform((record) => {
    // remove ineligibleCriteria from the type for now so we don't get confused when it's there.
    const { ineligibleCriteria, ...recordCopy } = record;

    const nextReviewDate =
      record.ineligibleCriteria.usMoOverdueForHearing?.nextReviewDate;
    if (nextReviewDate) {
      const daysUntilNextReviewDate = differenceInDays(
        nextReviewDate,
        // startOfToday is important here because eligibility dates don't have times, so they're
        // parsed as midnight. differenceInDays rounds down, so we need to compare with today's
        // midnight so we don't end up off by one.
        startOfToday()
      );
      if (daysUntilNextReviewDate <= 7) {
        // The previous version of this opportunity looked for upcoming hearings within a week, so
        // transform the new version to match.
        recordCopy.eligibleCriteria.usMoHasUpcomingHearing = { nextReviewDate };
      }
    }
    return recordCopy;
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
  // If the opportunity doesn't have `usMoHasUpcomingHearing`, it's because the resident is overdue
  // or has no hearing date. We don't handle that in the UI yet, but will eventually, so ignore
  // these records for the time being.
  // TODO(#3454): remove this validation.
  if (!record.eligibleCriteria.usMoHasUpcomingHearing) {
    throw new FeatureGateError(
      "Ignoring criteria that are not handled in the UI yet"
    );
  }
  const nextReviewDate =
    record.eligibleCriteria.usMoHasUpcomingHearing?.nextReviewDate;

  if (
    nextReviewDate &&
    isBefore(
      nextReviewDate,
      // startOfToday is important here because eligibility dates don't have times, so they're
      // parsed as midnight. If we used new Date(), we would exclude today.
      startOfToday()
    )
  ) {
    throw new OpportunityValidationError("Next review date is in the past");
  }
};
