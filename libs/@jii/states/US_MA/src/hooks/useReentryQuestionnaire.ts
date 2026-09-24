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

import { useSuspenseQuery } from "@tanstack/react-query";

import {
  getAnswer,
  getQuestionnaireStatus,
  getQuestionOptions,
  getVisibleQuestions,
} from "./utils";

// TODO OBT-51840: swap for the real fetch (trpcQuerier.state.usMa.getReentryQuestionnaire)
// once that router merges. Stubbed as always-blank so this hook's shape and
// consumers can be built and reviewed independently in the meantime.
function useStubbedQuestionnaire() {
  return useSuspenseQuery({
    queryKey: ["stub-reentry-questionnaire"],
    queryFn: async () =>
      null as {
        completedAt: Date | null;
        answers: Record<string, unknown>;
      } | null,
  });
}

/**
 * Returns the resident's latest Reentry Questionnaire record, or null if they
 * haven't opened the questionnaire yet, along with the status and form data
 * derived from it. Must be rendered inside a Suspense boundary (see
 * `SuspenseQueryBoundary`).
 */
export function useReentryQuestionnaire() {
  const { data: questionnaire } = useStubbedQuestionnaire();
  const answers = questionnaire?.answers ?? {};

  return {
    questionnaire,
    status: getQuestionnaireStatus(questionnaire),
    visibleQuestions: getVisibleQuestions(answers),
    getAnswer: (questionId: string) => getAnswer(answers, questionId),
    getOptions: getQuestionOptions,
  };
}
