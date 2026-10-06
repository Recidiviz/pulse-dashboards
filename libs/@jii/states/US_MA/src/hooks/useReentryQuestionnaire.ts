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

import { captureException } from "@sentry/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import {
  reentryQuestionnaireAnswersWriteSchema,
  reentryQuestionnaireConfig,
  reentryQuestionnaireQuestionIds,
} from "~@jii/configs";
import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

import { SaveAnswersInput } from "./types";
import { getQuestionnaireStatus, toStoredAnswers } from "./utils";

const questionFormats = reentryQuestionnaireQuestionIds.map((id) => ({
  id,
  format: reentryQuestionnaireConfig[id].format,
}));

/**
 * Returns the resident's latest Reentry Questionnaire record, or null if they
 * haven't saved any answers yet, along with its status and saved answers, and
 * a `save` that stores new answers to it. Must be rendered inside a Suspense
 * boundary (see `SuspenseQueryBoundary`).
 */
export function useReentryQuestionnaire() {
  const { personPseudoId } = useTypedParams(State.Resident);
  const {
    apiClient: { trpc, trpcQuerier },
  } = useRootStore();
  const queryClient = useQueryClient();

  const questionnaireQuery =
    trpcQuerier.state.usMa.getReentryQuestionnaire.queryOptions({
      pseudonymizedId: personPseudoId,
    });
  const { data: questionnaire } = useSuspenseQuery(questionnaireQuery);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: ({ answers, isCompleted }: SaveAnswersInput) =>
      trpc.state.usMa.upsertReentryQuestionnaireAnswers.mutate({
        pseudonymizedId: personPseudoId,
        answers: reentryQuestionnaireAnswersWriteSchema.parse(
          toStoredAnswers(questionFormats, answers),
        ),
        isCompleted,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: questionnaireQuery.queryKey }),
    onError: (error) => captureException(error),
  });

  return {
    questionnaire,
    answers: questionnaire?.answers ?? {},
    status: getQuestionnaireStatus(questionnaire),
    save,
    isSaving,
  };
}
