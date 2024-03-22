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

import { z } from "zod";

import {
  caseNotesSchema,
  dateStringSchema,
  defaultOnNull,
  opportunitySchemaBase,
  stringToIntSchema,
} from "../../schemaHelpers";
import {
  eligibleCriteriaLsuED,
  ineligibleCriteriaLsuED,
} from "../UsIdSharedCriteria";

export const usIdLsuSchema = opportunitySchemaBase
  .extend({
    formInformation: z
      .object({
        chargeDescriptions: z.array(z.string()),
        currentAddress: z.string(),
        currentPhoneNumber: z.string(),
        assessmentDate: z.string(),
        assessmentScore: stringToIntSchema,
        emailAddress: z.string(),
        employerName: z.string(),
        employerAddress: z.string(),
        employmentStartDate: z.string(),
        employmentDateVerified: z.string(),
        latestNegativeDrugScreenDate: z.string(),
        ncicReviewDate: z.string(),
        ncicNoteTitle: z.string(),
        ncicNoteBody: z.string(),
        txDischargeDate: z.string(),
        txNoteTitle: z.string(),
        txNoteBody: z.string(),
        caseNumbers: z.array(z.string()),
      })
      .partial(),
    eligibleCriteria: eligibleCriteriaLsuED.extend({
      usIdNoActiveNco: defaultOnNull(
        z.object({
          activeNco: z.boolean(),
        }),
        { activeNco: false },
      ),
      usIdLsirLevelLowFor90Days: z.object({
        eligibleDate: dateStringSchema,
        riskLevel: z.literal("LOW"),
      }),
      onSupervisionAtLeastOneYear: z
        .object({
          eligibleDate: dateStringSchema,
        })
        .partial()
        .optional(),
    }),
    ineligibleCriteria: ineligibleCriteriaLsuED
      .extend({
        onSupervisionAtLeastOneYear: z
          .object({
            eligibleDate: dateStringSchema,
          })
          .partial(),
      })
      .partial(),
    eligibleStartDate: dateStringSchema,
  })
  .merge(caseNotesSchema);

export type LSUReferralRecord = z.infer<typeof usIdLsuSchema>;
export type LSUReferralRecordRaw = z.input<typeof usIdLsuSchema>;

export type LSUDraftData = {
  clientName: string;
  chargeDescriptions: string;
  contactInformation: string;
  employmentInformation: string;
  assessmentInformation: string;
  substanceTest: string;
  courtFinesAndRestitution: string;
  costOfSupervision: string;
  iletsReviewDate: string;
  courtOrderDate: string;
  treatmentCompletionDate: string;
  specialConditionsCompletedDates: string;
  pendingSpecialConditions: string;
  ncicCheck: string;
  currentClientGoals: string;
  clientSummary: string;
};
