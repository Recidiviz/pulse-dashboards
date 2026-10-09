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

import { CheckInQuestionId, CheckInSectionId } from "~@jii/configs";

export type SupportSystemContact = {
  name: string;
  relationship?: string;
};

export type SuccessPlannerAnswerValue =
  | string
  | string[]
  | SupportSystemContact[];

export type SuccessPlannerAnswers = Partial<
  Record<CheckInQuestionId, SuccessPlannerAnswerValue | null>
>;

type SuccessPlannerAnswerState = "unreached" | "skipped" | "answered";

export type SuccessPlanner = {
  id: string;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  answers: SuccessPlannerAnswers;
};

export type SuccessPlannerStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

type SuccessPlannerAnswerType = "text" | "table";

export type SuccessPlannerQuestion = {
  id: CheckInQuestionId;
  label: string;
  answerType: SuccessPlannerAnswerType;
};

export type SuccessPlannerSection = {
  id: CheckInSectionId;
  navLabel: string;
  heading: string;
  questions: SuccessPlannerQuestion[];
};

export function getAnswerState(
  answers: SuccessPlannerAnswers,
  questionId: CheckInQuestionId,
): SuccessPlannerAnswerState {
  if (!(questionId in answers)) return "unreached";
  return answers[questionId] === null ? "skipped" : "answered";
}
