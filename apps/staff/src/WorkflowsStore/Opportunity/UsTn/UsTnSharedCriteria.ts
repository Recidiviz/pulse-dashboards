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

import {
  coverSheetInformationSchema,
  dateStringSchema,
  UsTnCoverSheetSharedDraftData,
} from "~datatypes";

import { AssessmentQuestionNumber } from "../../../core/Paperwork/US_TN/CustodyReclassification/assessmentQuestions";

const eventNote = z.object({
  eventDate: dateStringSchema,
  noteBody: z.string(),
});

export const formInformationSchema = coverSheetInformationSchema.merge(
  z.object({
    currentOffenses: z.string().array().optional(),
    lastCafDate: dateStringSchema.optional(),
    lastCafTotal: z.string().optional(),
    latestClassificationDate: dateStringSchema.optional(),
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
  }),
);

type DraftDataSelections = {
  [I in AssessmentQuestionNumber as `q${I}Selection`]: number;
};

type DraftDataNotes = {
  [I in AssessmentQuestionNumber as `q${I}Note`]: string;
};

export type UsTnSharedReclassificationDraftData = {
  lastCafDate: string;
  lastCafTotal: string;
  latestClassificationDate: string;
  levelOfCare: string;
  hearingDate: string;
  hearingLocation: string;
} & DraftDataSelections &
  UsTnCoverSheetSharedDraftData &
  DraftDataNotes;
