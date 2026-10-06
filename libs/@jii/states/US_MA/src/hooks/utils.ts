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

import type { ReentryQuestionnaireQuestionFormat } from "~@jii/configs";

import { ReentryQuestionnaireStatus } from "../components/Reentry/types";

/**
 * Derives the resident's questionnaire status from their latest Reentry
 * Questionnaire record. `null` (no record found) and a record with no answers
 * yet are both "NOT_STARTED".
 */
export function getQuestionnaireStatus(
  questionnaire: {
    completedAt: Date | null;
    answers: Record<string, unknown>;
  } | null,
): ReentryQuestionnaireStatus {
  if (!questionnaire || Object.keys(questionnaire.answers).length === 0)
    return "NOT_STARTED";
  return questionnaire.completedAt ? "COMPLETED" : "IN_PROGRESS";
}

/**
 * Returns the answers in the shape they're stored in: a single string for RADIO
 * questions and a list for CHECKBOX ones, leaving out unanswered questions.
 */
export function toStoredAnswers(
  questions: { id: string; format: ReentryQuestionnaireQuestionFormat }[],
  answers: Record<string, string[]>,
): Record<string, string | string[]> {
  const storedAnswers: Record<string, string | string[]> = {};

  for (const question of questions) {
    const value = answers[question.id];
    if (value?.length) {
      storedAnswers[question.id] =
        question.format === "RADIO" ? value[0] : value;
    }
  }

  return storedAnswers;
}
