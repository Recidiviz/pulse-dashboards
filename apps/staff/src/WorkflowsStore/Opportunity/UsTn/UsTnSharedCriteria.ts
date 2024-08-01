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

import { dateStringSchema } from "~datatypes";

import { AssessmentQuestionNumber } from "../../../core/Paperwork/US_TN/CustodyReclassification/assessmentQuestions";

const eventNote = z.object({
  eventDate: dateStringSchema,
  noteBody: z.string(),
});

export const formInformationSchema = z.object({
  activeRecommendations: z.array(
    z.object({
      Pathway: z.string(),
      PathwayName: z.string(),
      Recommendation: z.string(),
      TreatmentGoal: z.string(),
      VantagePointTitle: z.string(),
    }),
  ),
  classificationType: z.string(),
  hasIncompatibles: z.boolean(),
  incompatibleArray: z.array(
    z.object({
      incompatibleOffenderId: z.string(),
      incompatibleType: z.string(),
    }),
  ),
  currentOffenses: z.string().array().optional(),
  lastCafDate: dateStringSchema.optional(),
  lastCafTotal: z.string().optional(),
  latestClassificationDate: dateStringSchema.optional(),
  latestVantageCompletedDate: dateStringSchema.optional(),
  latestVantageRiskLevel: z.string().optional(),
  latestPreaScreeningResults: z
    .object({
      latestPreaScreeningDate: dateStringSchema,
      aggressorFindingLevelChanged: z.boolean(),
      victimFindingLevelChanged: z.boolean(),
    })
    .optional(),
  levelOfCare: z.string().optional(),
  sentenceEffectiveDate: dateStringSchema.optional(),
  sentenceReleaseEligibilityDate: dateStringSchema.optional(),
  sentenceExpirationDate: dateStringSchema.optional(),
  statusAtHearingSeg: z.string(),
  healthClassification: z.string().optional(),
  q1Score: z.coerce.number(),
  q2Score: z.coerce.number(),
  q3Score: z.coerce.number(),
  q4Score: z.coerce.number(),
  q5Score: z.coerce.number(),
  q6Score: z.coerce.number(),
  q7Score: z.coerce.number(),
  q8Score: z.coerce.number(),
  q9Score: z.coerce.number(),
  q6Notes: z.optional(z.array(eventNote)),
  q7Notes: z.optional(z.array(eventNote).or(eventNote.transform((n) => [n]))),
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
        jurisdiction: z.string().nullish(),
        description: z.string().nullish(),
        chargePending: z
          .string()
          .nullish()
          .transform((raw) => {
            if (raw === "Y") return true;
            if (raw === "N") return false;
            return undefined;
          }),
      }),
    ),
  ),
});

type DraftDataSelections = {
  [I in AssessmentQuestionNumber as `q${I}Selection`]: number;
};

type DraftDataNotes = {
  [I in AssessmentQuestionNumber as `q${I}Note`]: string;
};

export type UsTnSharedReclassificationDraftData = {
  institutionName: string;
  residentFullName: string;
  omsId: string;
  date: string;
  lastCafDate: string;
  lastCafTotal: string;
  latestClassificationDate: string;
  levelOfCare: string;
  statusAtHearing: string;
  hasIncompatibles: boolean;
  incompatiblesList: string;
  inmateWaivesNotice: boolean;
  currentCustodyLevel: string;
  recommendationFacilityAssignment: string;
  recommendationTransfer: boolean;
  recommendationCustodyLevel: string;
  recommendationOverrideType: string;
  recommendationJustification: string;
  updatedPhotoNeeded: boolean;
  emergencyContactUpdated: boolean;
  emergencyContactUpdatedDate: string;
  inmateAppeal: boolean;
  disagreementReasons: string;
  denialReasons: string;
  hearingDate: string;
  hearingLocation: string;
} & DraftDataSelections &
  DraftDataNotes;
