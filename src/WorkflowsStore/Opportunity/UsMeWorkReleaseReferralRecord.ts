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

import {
  caseNotesSchema,
  dateStringSchema,
  opportunitySchemaBase,
} from "./schemaHelpers";

const possiblyIneligibleCriteria = z.object({});

export const usMeWorkReleaseSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: possiblyIneligibleCriteria.extend({
      usMeMinimumOrCommunityCustody: z.object({ custodyLevel: z.string() }),
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
    }),
    ineligibleCriteria: z.object({}),
  })
  .merge(caseNotesSchema);

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

export const transformReferral = usMeWorkReleaseSchema.parse;
