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

import { isFollowUpOf } from "../utils";
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

  // During an edit from Review, Back and Next only move through the edited
  // questions and their follow-ups, skipping any questions in between.
  const previousQuestion = editSession
    ? earlierQuestions.findLast(({ id }) => editSession.questionIds.has(id))
    : earlierQuestions.at(-1);
  const upcomingQuestion = editSession
    ? laterQuestions.find((later) =>
        isFollowUpOf(later, editSession.questionIds),
      )
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
