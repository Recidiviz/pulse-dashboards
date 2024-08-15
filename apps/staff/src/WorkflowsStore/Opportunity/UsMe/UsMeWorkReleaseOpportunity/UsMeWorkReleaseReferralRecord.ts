/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { z } from "zod";

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

const possiblyIneligibleCriteria = z.object({});

export const usMeWorkReleaseSchema = opportunitySchemaBase.extend({
  eligibleCriteria: possiblyIneligibleCriteria
    .extend({
      usMeThreeYearsRemainingOnSentence: z.object({
        eligibleDate: dateStringSchema,
      }),
      usMeNoDetainersWarrantsOrOther: z
        .object({
          detainer: z.string(),
          detainerStartDate: dateStringSchema.nullable(),
        })
        .nullable(),
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: z.object({
        eligibleDate: dateStringSchema.nullable(),
      }),
      usMeNoClassAOrBViolationFor90Days: z
        .object({
          eligibleDate: dateStringSchema.nullable(),
          highestClassViol: z.string(),
          violType: z.string(),
        })
        .nullable(),
    })
    // TODO: remove usMeCustodyLevelIsMinimumOrCommunity from code
    .and(
      z.union([
        z.object({
          usMeCustodyLevelIsMinimum: z.object({
            custodyLevel: z.string(),
          }),
          usMeCustodyLevelIsMinimumOrCommunity: z.undefined(),
        }),
        z.object({
          usMeCustodyLevelIsMinimum: z.undefined(),
          usMeCustodyLevelIsMinimumOrCommunity: z.object({
            custodyLevel: z.string(),
          }),
        }),
      ]),
    )
    .transform(({ usMeCustodyLevelIsMinimumOrCommunity, ...rest }) => {
      if (usMeCustodyLevelIsMinimumOrCommunity)
        return {
          ...rest,
          usMeCustodyLevelIsMinimum: usMeCustodyLevelIsMinimumOrCommunity,
        };
      return rest;
    }),
});

export type UsMeWorkReleaseReferralRecord = z.infer<
  typeof usMeWorkReleaseSchema
>;

export type UsMeWorkReleaseCriteria =
  UsMeWorkReleaseReferralRecord["eligibleCriteria"];

export type UsMeWorkReleaseReferralRecordRaw = z.input<
  typeof usMeWorkReleaseSchema
>;

export type UsMeWorkReleaseDraftData = {
  residentName: string;
  mdocNo: string;
  facilityHousingUnit: string;
  caseManager: string;
};

export const transformWorkReleaseReferral = usMeWorkReleaseSchema.parse;
