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

import { useState } from "react";

import { FlowStep, QuestionAnswerValue } from "../types";
import {
  applyExclusiveOptions,
  formatAnswerText,
  getInitialAnswers,
  getInitialStep,
  getVisibleQuestions,
  isAnswered,
  pruneHiddenAnswers,
} from "../utils";
import { QuestionnaireScreen, UseQuestionnaireFlowParams } from "./types";
import { useEditSession } from "./useEditSession";
import { getQuestionPosition } from "./utils";

/**
 * The questionnaire's in-memory navigation and in-progress answers, resolved
 * into the screen to show.
 */
export function useQuestionnaireFlow({
  questions: allQuestions,
  sections,
  status,
  storedAnswers,
}: UseQuestionnaireFlowParams): QuestionnaireScreen {
  const [answers, setAnswers] = useState(() =>
    getInitialAnswers(allQuestions, storedAnswers),
  );
  const [step, setStep] = useState<FlowStep>(() =>
    getInitialStep(status, allQuestions, answers),
  );
  const [isSectionListOpen, setIsSectionListOpen] = useState(false);

  const edit = useEditSession();
  const editSession = edit.session;

  const isProfileCompleted = status === "COMPLETED";

  const visibleQuestions = getVisibleQuestions(allQuestions, answers);

  const goToQuestion = (questionId: string) => {
    setIsSectionListOpen(false);
    setStep({ kind: "question", questionId });
  };

  const goToReview = () => {
    edit.end();
    setStep({ kind: "review" });
  };

  const start = () => goToQuestion(visibleQuestions[0].id);

  const backFromReview = () =>
    goToQuestion(visibleQuestions[visibleQuestions.length - 1].id);

  // TODO OBT-51840: submit answers and set completedAt.
  const submit = () => setStep({ kind: "completion" });

  const startEdit = (questionId: string) => {
    edit.start(questionId, answers);
    goToQuestion(questionId);
  };

  const cancelEdit = () => {
    if (edit.hasChanges(answers)) {
      edit.askToConfirmCancel();
    } else {
      goToReview();
    }
  };

  const discardEdit = () => {
    if (editSession) setAnswers(editSession.answersBeforeEdit);
    goToReview();
  };

  switch (step.kind) {
    case "intro":
      return {
        kind: "intro",
        headerAction: "close",
        props: { totalQuestionCount: allQuestions.length, onStart: start },
      };

    case "question": {
      const {
        question,
        answer: currentAnswer,
        previousQuestion,
        upcomingQuestion,
        isLastQuestionBeforeReview,
        sectionIndex,
      } = getQuestionPosition({
        visibleQuestions,
        questionId: step.questionId,
        answers,
        sections,
        editSession,
      });

      const answer = (value: QuestionAnswerValue) => {
        setIsSectionListOpen(false);
        const updatedAnswer = applyExclusiveOptions(
          question,
          currentAnswer,
          value,
        );
        const updatedAnswers = pruneHiddenAnswers(allQuestions, {
          ...answers,
          [question.id]: updatedAnswer,
        });
        setAnswers(updatedAnswers);
      };

      // TODO OBT-51840: save the current answer on Next.
      const next = () => {
        if (!upcomingQuestion) {
          goToReview();
          return;
        }
        if (editSession) edit.continueToFollowUp(upcomingQuestion.id);
        goToQuestion(upcomingQuestion.id);
      };

      const back = () => {
        if (previousQuestion) {
          goToQuestion(previousQuestion.id);
        } else {
          setStep({ kind: "intro" });
        }
      };

      const isEditStartQuestion =
        !!editSession && question.id === editSession.startQuestionId;
      // Only set when editing a completed profile from Review.
      const editing =
        isProfileCompleted && editSession
          ? { onCancel: cancelEdit, isLastQuestionBeforeReview }
          : undefined;

      return {
        kind: "question",
        headerAction: isProfileCompleted ? null : "saveAndExit",
        sectionProgress: {
          currentSectionIndex: sectionIndex,
          isOpen: isSectionListOpen,
          onToggle: () => setIsSectionListOpen(!isSectionListOpen),
        },
        cancelDialog: {
          isOpen: edit.isConfirmingCancel,
          onStay: edit.closeCancelConfirm,
          onLeave: discardEdit,
        },
        props: {
          question,
          value: currentAnswer,
          onChange: answer,
          onNext: next,
          onBack: isEditStartQuestion ? undefined : back,
          canGoNext: isAnswered(currentAnswer),
          editing,
        },
      };
    }

    case "review": {
      const entries = visibleQuestions.map((question) => ({
        questionId: question.id,
        heading: question.heading,
        answerText: formatAnswerText(question, answers[question.id]),
        onEdit: () => startEdit(question.id),
      }));

      if (isProfileCompleted) {
        return {
          kind: "review",
          headerAction: "close",
          props: { isEditing: true, entries },
        };
      }
      return {
        kind: "review",
        headerAction: "close",
        props: { entries, onBack: backFromReview, onSubmit: submit },
      };
    }

    case "completion":
      return { kind: "completion", headerAction: "close" };
  }
}
