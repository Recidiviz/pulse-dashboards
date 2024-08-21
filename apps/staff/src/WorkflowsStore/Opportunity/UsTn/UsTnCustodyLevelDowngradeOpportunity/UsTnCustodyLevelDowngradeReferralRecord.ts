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

import { cloneDeep } from "lodash";
import { z } from "zod";

import { opportunitySchemaBase } from "~datatypes";

import { formInformationSchema as formInformation } from "../UsTnSharedCriteria";

export const usTnCustodyLevelDowngradeSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.object({
      custodyLevelHigherThanRecommended: z.object({
        custodyLevel: z.string(),
        recommendedCustodyLevel: z.string(),
      }),
      custodyLevelIsNotMax: z.null(),
      usTnLatestCafAssessmentNotOverride: z.object({
        overrideReason: z.string().nullable(),
      }),
      usTnIneligibleForAnnualReclassification: z.object({
        ineligibleCriteria: z.array(z.string()),
      }),
    }),
    formInformation,
  })
  .transform((r) => {
    const out = cloneDeep(r);
    if (!out.caseNotes["ASSAULTIVE DISCIPLINARIES"])
      out.caseNotes["ASSAULTIVE DISCIPLINARIES"] = [];
    return out;
  });

export type UsTnCustodyLevelDowngradeReferralRecordRaw = z.input<
  typeof usTnCustodyLevelDowngradeSchema
>;

export type UsTnCustodyLevelDowngradeReferralRecord = z.infer<
  typeof usTnCustodyLevelDowngradeSchema
>;
