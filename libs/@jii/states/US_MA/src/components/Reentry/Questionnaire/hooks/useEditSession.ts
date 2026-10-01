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

import { isEqual } from "lodash-es";
import { useState } from "react";

import { QuestionnaireAnswers } from "../types";
import { EditSession } from "./types";

/**
 * The state of an edit started from Review: which questions it covers and the
 * answers to restore if the resident cancels.
 */
export function useEditSession() {
  const [session, setSession] = useState<EditSession | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // TODO OBT-51840: stop snapshotting answers here once saves refetch them;
  // compare against and revert to the stored answers instead.
  const start = (questionId: string, answers: QuestionnaireAnswers) =>
    setSession({
      startQuestionId: questionId,
      questionIds: new Set([questionId]),
      answersBeforeEdit: answers,
    });

  const continueToFollowUp = (questionId: string) =>
    setSession(
      (current) =>
        current && {
          ...current,
          questionIds: new Set(current.questionIds).add(questionId),
        },
    );

  const end = () => {
    setSession(null);
    setIsConfirmingCancel(false);
  };

  const hasChanges = (answers: QuestionnaireAnswers) =>
    !!session && !isEqual(answers, session.answersBeforeEdit);

  const askToConfirmCancel = () => setIsConfirmingCancel(true);

  const closeCancelConfirm = () => setIsConfirmingCancel(false);

  return {
    session,
    isConfirmingCancel,
    start,
    continueToFollowUp,
    end,
    hasChanges,
    askToConfirmCancel,
    closeCancelConfirm,
  };
}
