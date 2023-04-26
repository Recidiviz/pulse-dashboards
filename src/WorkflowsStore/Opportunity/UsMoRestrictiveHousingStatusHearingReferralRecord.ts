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

import { isBefore, startOfToday } from "date-fns";
import { z } from "zod";

import { ValidateFunction } from "../subscriptions";
import { OpportunityValidationError } from "../utils";
import {
  dateStringSchema,
  opportunitySchemaBase,
  stringToIntSchema,
} from "./schemaHelpers";

const cdvSchema = z.object({
  cdvDate: dateStringSchema,
  cdvRule: z.string(),
});

export const usMoRestrictiveHousingStatusHearingSchema =
  opportunitySchemaBase.extend({
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
      usMoHasUpcomingHearing: z.object({
        nextReviewDate: dateStringSchema,
      }),
      usMoInRestrictiveHousing: z.object({
        confinementType: z.string(),
      }),
    }),
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
  const { nextReviewDate } = record.eligibleCriteria.usMoHasUpcomingHearing;

  if (
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
