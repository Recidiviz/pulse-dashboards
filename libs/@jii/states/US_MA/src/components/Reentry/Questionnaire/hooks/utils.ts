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

import { getEditQuestionIds } from "../utils";
import { GetQuestionPositionParams, QuestionPosition } from "./types";

/**
 * Returns where the resident is among the visible questions, and where Back and
 * Next lead from there.
 */
export function getQuestionPosition({
  visibleQuestions,
  questionId,
  answers,
  sections,
  editSession,
}: GetQuestionPositionParams): QuestionPosition {
  const index = visibleQuestions.findIndex(
    (question) => question.id === questionId,
  );
  const question = visibleQuestions[index];
  const earlierQuestions = visibleQuestions.slice(0, index);
  const laterQuestions = visibleQuestions.slice(index + 1);

  // During an edit from Review, Back and Next only move through the questions
  // the edit covers, skipping any questions in between.
  const editQuestionIds =
    editSession &&
    getEditQuestionIds(visibleQuestions, editSession.startQuestionId);
  const previousQuestion = editQuestionIds
    ? earlierQuestions.findLast(({ id }) => editQuestionIds.has(id))
    : earlierQuestions.at(-1);
  const upcomingQuestion = editQuestionIds
    ? laterQuestions.find(({ id }) => editQuestionIds.has(id))
    : laterQuestions[0];

  return {
    question,
    answer: answers[question.id],
    previousQuestion,
    upcomingQuestion,
    isLastQuestionBeforeReview: !upcomingQuestion,
    sectionIndex: sections.findIndex(
      (section) => section.domain === question.sectionDomain,
    ),
  };
}
