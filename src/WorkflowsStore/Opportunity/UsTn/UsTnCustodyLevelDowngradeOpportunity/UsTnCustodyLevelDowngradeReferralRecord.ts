/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";
import { z } from "zod";

import type { AssessmentQuestionNumber } from "../../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import {
  caseNotesSchema,
  dateStringSchema,
  opportunitySchemaBase,
} from "../../schemaHelpers";

const realUsTnCustodyLevelDowngradeSchema = opportunitySchemaBase
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
    ineligibleCriteria: z.object({}),
    formInformation: z.object({
      currentOffenses: z.string().array().optional(),
      lastCafDate: dateStringSchema.optional(),
      lastCafTotal: z.string().optional(),
      latestClassificationDecisionDate: dateStringSchema.optional(),
      levelOfCare: z.string().optional(),
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
            detainerFelonyFlag: z
              .string()
              .nullable()
              .transform((raw) => raw === "X"),
            detainerMisdemeanorFlag: z
              .string()
              .nullable()
              .transform((raw) => raw === "X"),
          })
        )
      ),
    }),
  })
  .merge(caseNotesSchema)
  .transform((r) => {
    const out = cloneDeep(r);
    if (!out.caseNotes["ASSAULTIVE DISCIPLINARIES"])
      out.caseNotes["ASSAULTIVE DISCIPLINARIES"] = [];
    return out;
  });

export const usTnCustodyLevelDowngradeSchema = z.preprocess(
  // TODO: I will move these fields around upstream (recidiviz-data #21658)
  // and then delete this ugly preprocess step.
  (obj) => {
    const out: any = cloneDeep(obj);
    if (out.caseNotesAssaultiveDisciplinaries) {
      out.caseNotes["ASSAULTIVE DISCIPLINARIES"] =
        out.caseNotesAssaultiveDisciplinaries;
    }
    [
      "currentOffenses",
      "lastCafDate",
      "lastCafTotal",
      "latestClassificationDecisionDate",
      "levelOfCare",
    ].forEach((k) => {
      if (out[k]) out.formInformation[k] = out[k];
    });

    return out;
  },
  realUsTnCustodyLevelDowngradeSchema
);

export type UsTnCustodyLevelDowngradeReferralRecordRaw = z.input<
  typeof realUsTnCustodyLevelDowngradeSchema
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
  date: string;
  lastCafDate: string;
  lastCafTotal: string;
  latestClassificationDecisionDate: string;
  levelOfCare: string;
} & DraftDataSelections &
  DraftDataNotes;
