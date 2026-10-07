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

import {
  checkInQuestionConfig,
  CheckInQuestionId,
  CheckInQuestionInfo,
  CheckInSectionId,
  CheckInStatus,
  checkInToolSpec,
  UsNeCheckInAnswers,
} from "~@jii/configs";

/**
 * Return all the questions that should be shown to the resident.
 */
export function getVisibleQuestions(
  answers: UsNeCheckInAnswers,
): CheckInQuestionInfo[] {
  return checkInToolSpec.flatMap(({ id: sectionId, questions }) => {
    return questions.flatMap((questionId) => {
      const { showIf } = checkInQuestionConfig[questionId];

      // Show questions that don't depend on anything
      // and questions whose show-if condition was met
      if (!showIf || answers[showIf.questionId] === showIf.value) {
        return [{ questionId, sectionId }];
      }

      return [];
    });
  });
}

/**
 * Return the ordinal position of the given questionId among the questions in its section.
 */
export function positionOfQuestion(
  questionId: CheckInQuestionId,
  sectionId: CheckInSectionId,
  answers: UsNeCheckInAnswers,
): number {
  const questionsInSection = getVisibleQuestions(answers).filter(
    (q) => q.sectionId === sectionId,
  );
  return questionsInSection.findIndex((q) => q.questionId === questionId) + 1;
}

/**
 * Return the status and location of a resident within the Check-In Tool based on
 * the given answers.
 */
export function checkInStatus(answers: UsNeCheckInAnswers): CheckInStatus {
  const visibleQuestions = getVisibleQuestions(answers);

  const firstUnansweredIndex = answers
    ? visibleQuestions.findIndex(
        ({ questionId }) => answers[questionId] === undefined,
      )
    : 0;

  // The resident hasn't answered the first question
  if (firstUnansweredIndex === 0) {
    return { kind: "NOT_STARTED", firstQuestion: visibleQuestions[0] };
  }

  // The resident has answered all visible questions
  if (firstUnansweredIndex === -1) {
    return { kind: "COMPLETED" };
  }

  // The resident has answered at least one question, so show the first unanswered question
  const currentQuestion = visibleQuestions[firstUnansweredIndex];

  const isFirstQuestionOfSection =
    visibleQuestions[firstUnansweredIndex - 1].sectionId !==
    currentQuestion.sectionId;

  return {
    kind: "QUESTION",
    question: currentQuestion,
    isFirstQuestionOfSection,
  };
}
