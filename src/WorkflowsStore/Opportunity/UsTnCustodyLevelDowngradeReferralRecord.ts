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

import type { AssessmentQuestionNumber } from "../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import { dateStringSchema, opportunitySchemaBase } from "./schemaHelpers";

export const usTnCustodyLevelDowngradeSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z.object({
    custodyLevelHigherThanRecommended: z.object({
      custodyLevel: z.string(),
      recommendedCustodyLevel: z.string(),
    }),
    custodyLevelIsNotMax: z.null(),
    usTnAtLeast6MonthsSinceMostRecentIncarcerationIncident: z.null(),
    usTnHasHadAtLeast1IncarcerationIncidentPastYear: z.object({
      latestIncarcerationIncidentDate: dateStringSchema,
    }),
  }),
  ineligibleCriteria: z.object({}),
  formInformation: z.object({
    q1Score: z.coerce.number(),
    q2Score: z.coerce.number(),
    q3Score: z.coerce.number(),
    q4Score: z.coerce.number(),
    q5Score: z.coerce.number(),
    q6Score: z.coerce.number(),
    q7Score: z.coerce.number(),
    q8Score: z.coerce.number(),
    q9Score: z.coerce.number(),
    q6Notes: z.optional(
      z.array(
        z.object({
          eventDate: dateStringSchema,
          noteBody: z.string(),
        })
      )
    ),
    q7Notes: z.optional(
      z.array(
        z.object({
          eventDate: dateStringSchema,
          noteBody: z.string(),
        })
      )
    ),
    q8Notes: z.optional(
      z.array(
        z.object({
          detainerReceivedDate: dateStringSchema,
          detainerFelonyFlag: z.string().transform((raw) => raw === "X"),
          detainerMisdemeanorFlag: z.string().transform((raw) => raw === "X"),
        })
      )
    ),
  }),
});

export type UsTnCustodyLevelDowngradeReferralRecordRaw = z.input<
  typeof usTnCustodyLevelDowngradeSchema
>;

export type UsTnCustodyLevelDowngradeReferralRecord = z.infer<
  typeof usTnCustodyLevelDowngradeSchema
>;

type DraftDataSelections = {
  [I in AssessmentQuestionNumber as `q${I}Selection`]: number;
};

type DraftDataNotes = {
  [I in AssessmentQuestionNumber as `q${I}Note`]: string;
};

export type UsTnCustodyLevelDowngradeDraftData = {
  institutionName: string;
  residentFullName: string;
  omsId: string;
} & DraftDataSelections &
  DraftDataNotes;
