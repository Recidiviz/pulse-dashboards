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

import { ReentryQuestionnaireStatus } from "../components/Reentry/types";

/**
 * Derives the resident's questionnaire status from their latest Reentry
 * Questionnaire record. `null` (no record found) and a record with no answers
 * yet are both "NOT_STARTED" - a blank record only exists once the resident
 * has actually opened the questionnaire (see `getOrCreateReentryQuestionnaire`).
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

// TODO OBT-51840: derive from the real questionnaire config (#15660)
// and the showIf evaluator once both exist. Placeholder empty list for now -
// unblocks building the form shell against this hook.
export function getVisibleQuestions(
  _answers: Record<string, unknown>,
): string[] {
  return [];
}

export function getAnswer(
  // TODO OBT-51840: type this per question format once the real questionnaire config exists.
  answers: Record<string, unknown>,
  questionId: string,
): unknown {
  return answers[questionId];
}

// TODO OBT-51840: resolve from the real questionnaire config, including
// the "STANDARD" options sentinel, once it exists.
export function getQuestionOptions(_questionId: string): string[] {
  return [];
}
