// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  CheckInQuestionId,
  checkInQuestionIds,
  CheckInSectionId,
} from "./usNeCheckInToolSpec";

export const supportSystemContactSchema = z.object({
  name: z.string(),
  relationship: z.string().optional(),
});

export type SupportSystemContact = z.output<typeof supportSystemContactSchema>;

export const checkInAnswerSchema = z
  .string()
  .or(z.array(z.string()))
  .or(z.array(supportSystemContactSchema))
  .nullable();

export type CheckInAnswer = z.output<typeof checkInAnswerSchema>;

export function isNonemptyStringArray(
  ans: CheckInAnswer | undefined,
): ans is string[] {
  return Boolean(
    ans && Array.isArray(ans) && ans.length > 0 && typeof ans[0] === "string",
  );
}

export const usNeCheckInSchema = z.record(
  z.enum(checkInQuestionIds),
  checkInAnswerSchema,
);

export type UsNeCheckInAnswers = z.output<typeof usNeCheckInSchema>;

export type CheckInQuestionInfo = {
  questionId: CheckInQuestionId;
  sectionId: CheckInSectionId;
};

export type CheckInStatus =
  | {
      kind: "NOT_STARTED";
      firstQuestion: CheckInQuestionInfo;
    }
  | {
      kind: "QUESTION";
      question: CheckInQuestionInfo;
      isFirstQuestionOfSection: boolean;
    }
  | {
      kind: "COMPLETED";
    };
