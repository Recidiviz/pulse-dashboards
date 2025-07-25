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

import {
  crcSharedCriteria,
  crcSharedIneligibleCriteria,
} from "../UsIdSharedCriteria";

export const usIdExpandedCRCSchema = opportunitySchemaBase.extend({
  eligibleCriteria: crcSharedCriteria.extend({
    usIdIncarcerationWithin6MonthsOfFtcdOrPedOrEprd: z.object({
      fullTermCompletionDate: dateStringSchema.nullable(),
      paroleEligibilityDate: dateStringSchema.nullable(),
    }),
    usIdInCrcFacilityOrPwccUnit1: z.object({
      crcStartDate: dateStringSchema,
      facilityName: z.string(),
    }),
    usIdInCrcFacilityOrPwccUnit1For60Days: z
      .object({
        sixtyDaysInCrcFacilityDate: dateStringSchema,
      })
      .optional(),
  }),
  ineligibleCriteria: crcSharedIneligibleCriteria.extend({
    usIdInCrcFacilityOrPwccUnit1For60Days: z
      .object({
        sixtyDaysInCrcFacilityDate: dateStringSchema,
      })
      .optional(),
  }),
});

export type UsIdExpandedCRCReferralRecord = z.infer<
  typeof usIdExpandedCRCSchema
>;

export type UsIdExpandedCRCReferralRecordRaw = z.input<
  typeof usIdExpandedCRCSchema
>;
