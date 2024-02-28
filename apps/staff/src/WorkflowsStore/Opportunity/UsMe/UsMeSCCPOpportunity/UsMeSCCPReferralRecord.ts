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

import { TransformFunction } from "../../../subscriptions";
import {
  caseNotesSchema,
  dateStringSchema,
  MergedCriteria,
  opportunitySchemaBase,
} from "../../schemaHelpers";

// these have the same shape whether they are eligible or not
const possiblyIneligibleCriteria = z
  .object({
    usMeXMonthsRemainingOnSentence: z.object({
      eligibleDate: dateStringSchema,
    }),
    usMeServedXPortionOfSentence: z.object({
      eligibleDate: dateStringSchema,
      xPortionServed: z.enum(["1/2", "2/3"]),
    }),
  })
  .partial();

export const usMeSCCPSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: possiblyIneligibleCriteria.extend({
      // optional because it can also be ineligible, with a different shape
      usMeNoClassAOrBViolationFor90Days: z.null().optional(),
      usMeNoDetainersWarrantsOrOther: z.null(),
      usMeCustodyLevelIsMinimumOrCommunity: z.object({
        custodyLevel: z.string(),
      }),
    }),
    ineligibleCriteria: possiblyIneligibleCriteria.extend({
      usMeNoClassAOrBViolationFor90Days: z
        .object({
          eligibleDate: dateStringSchema.nullable(),
          highestClassViol: z.string(),
          violType: z.string(),
        })
        .optional(),
    }),
  })
  .merge(caseNotesSchema);

export type UsMeSCCPReferralRecord = z.infer<typeof usMeSCCPSchema>;

export type UsMeSCCPCriteria = MergedCriteria<
  UsMeSCCPReferralRecord["eligibleCriteria"],
  UsMeSCCPReferralRecord["ineligibleCriteria"]
>;

export type UsMeSCCPReferralRecordRaw = z.input<typeof usMeSCCPSchema>;

export type UsMeSCCPDraftData = {
  residentName: string;
  mdocNo: string;
  facilityHousingUnit: string;
  caseManager: string;
};

export const transformReferral: TransformFunction<UsMeSCCPReferralRecord> = (
  record,
) => {
  return usMeSCCPSchema.parse(record);
};
