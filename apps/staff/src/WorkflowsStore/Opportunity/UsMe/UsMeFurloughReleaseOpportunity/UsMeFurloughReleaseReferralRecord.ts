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

import { eligibleDateSchema } from "../../schemaHelpers";

export const usMeFurloughReleaseSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      usMeThreeYearsRemainingOnSentence: eligibleDateSchema,
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease:
        eligibleDateSchema,
      usMeNoClassAOrBViolationFor90Days: z
        .object({
          eligibleDate: dateStringSchema.nullable(),
          highestClassViol: z.string(),
          violType: z.string(),
        })
        .nullable(),
      usMeCustodyLevelIsMinimumOrCommunity: z.object({
        custodyLevel: z.string(),
      }),
      usMeNoDetainersWarrantsOrOther: z
        .object({
          detainer: z.string(),
          detainerStartDate: dateStringSchema.nullable(),
        })
        .nullable(),
      usMeServedHalfOfSentence: eligibleDateSchema.optional(),
    })
    .passthrough(),
});

export type UsMeFurloughReleaseReferralRecord = z.infer<
  typeof usMeFurloughReleaseSchema
>;

export type UsMeFurloughReleaseReferralRecordRaw = z.input<
  typeof usMeFurloughReleaseSchema
>;

export type UsMeFurloughReleaseDraftData = {
  residentName: string;
  mdocNo: string;
  facilityHousingUnit: string;
  caseManager: string;
};
