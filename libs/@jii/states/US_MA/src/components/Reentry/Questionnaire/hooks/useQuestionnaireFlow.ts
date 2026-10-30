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

import { useEffect, useState } from "react";

import {
  getExitScreen,
  getQuestionViewed,
  isRatherNotSay,
} from "../../../../hooks/utils";
import { FlowStep, QuestionAnswerValue } from "../types";
import {
  allAnswersMatch,
  answersMatch,
  applyExclusiveOptions,
  formatAnswerText,
  fromStoredAnswers,
  getInitialStep,
  getQuestionCountRange,
  getVisibleQuestions,
  isAnswered,
  pruneHiddenAnswers,
} from "../utils";
import {
  QuestionnaireHeaderAction,
  QuestionnaireScreen,
  UseQuestionnaireFlowParams,
} from "./types";
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
  save,
  onExit,
  onGoToChecklist,
  trackEvent,
}: UseQuestionnaireFlowParams): QuestionnaireScreen {
  const [answers, setAnswers] = useState(() =>
    fromStoredAnswers(allQuestions, storedAnswers),
  );
  const [step, setStep] = useState<FlowStep>(() =>
    getInitialStep(status, allQuestions, answers),
  );
  const [isSectionListOpen, setIsSectionListOpen] = useState(false);
  // The answers as saved when the questionnaire opened, which Review marks
  // changes against.
  const [initialAnswers] = useState(answers);
  const [isSavedBannerVisible, setIsSavedBannerVisible] = useState(false);

  const edit = useEditSession();
  const editSession = edit.session;

  const isProfileCompleted = status === "COMPLETED";

  const visibleQuestions = getVisibleQuestions(allQuestions, answers);

  // The answers as last saved, which cancelling an edit reverts to.
  const getSavedAnswers = () => fromStoredAnswers(allQuestions, storedAnswers);

  const currentQuestionId =
    step.kind === "question" ? step.questionId : undefined;

  // Set only when reopening a questionnaire that was started but not submitted.
  const [resumedOn] = useState(() =>
    status === "IN_PROGRESS"
      ? {
          questionId: currentQuestionId,
          questionsAnswered: visibleQuestions.filter(({ id }) =>
            isAnswered(answers[id]),
          ).length,
          questionViewed: currentQuestionId
            ? getQuestionViewed(visibleQuestions, currentQuestionId, false)
            : undefined,
        }
      : undefined,
  );

  // Upon reopening an unfinished questionnaire, tracks questionnaire_resumed
  // and question_viewed for the question it lands on.
  useEffect(() => {
    if (!resumedOn) return;
    const { questionId, questionsAnswered, questionViewed } = resumedOn;
    trackEvent("frontend_reentry_questionnaire_resumed", {
      questionId,
      questionsAnswered,
    });
    if (questionViewed)
      trackEvent("frontend_reentry_question_viewed", questionViewed);
  }, [trackEvent, resumedOn]);

  const trackExit = (trigger: "close" | "save_and_exit" | "go_to_checklist") =>
    trackEvent("frontend_reentry_questionnaire_exited", {
      trigger,
      screen: getExitScreen(step, isProfileCompleted),
      questionId: currentQuestionId,
    });

  const exit = (trigger: "close" | "save_and_exit") => {
    trackExit(trigger);
    onExit();
  };

  const goToChecklist = () => {
    trackExit("go_to_checklist");
    onGoToChecklist();
  };

  const closeAction: QuestionnaireHeaderAction = {
    kind: "close",
    onClick: () => exit("close"),
  };

  const goToQuestion = (questionId: string) => {
    setIsSectionListOpen(false);
    setStep({ kind: "question", questionId });
    trackEvent(
      "frontend_reentry_question_viewed",
      getQuestionViewed(visibleQuestions, questionId, isProfileCompleted),
    );
  };

  const goToReview = () => {
    edit.end();
    setStep({ kind: "review" });
  };

  const backFromReview = () =>
    goToQuestion(visibleQuestions[visibleQuestions.length - 1].id);

  const start = () => {
    trackEvent("frontend_reentry_questionnaire_started", {});
    goToQuestion(visibleQuestions[0].id);
  };

  const submit = () => {
    // Clears the last failed submit's error while this one saves.
    setStep({ kind: "review", error: undefined });
    save(
      { answers, isCompleted: true },
      {
        onSuccess: () => {
          trackEvent("frontend_reentry_questionnaire_completed", {
            ratherNotSayCount: visibleQuestions.filter(({ id }) =>
              isRatherNotSay(answers[id]),
            ).length,
          });
          setStep({ kind: "completion" });
        },
        onError: () => setStep({ kind: "review", error: "submit" }),
      },
    );
  };

  const startEdit = (questionId: string) => {
    setIsSavedBannerVisible(false);
    edit.start(questionId);
    goToQuestion(questionId);
  };

  const cancelEdit = () => {
    if (allAnswersMatch(answers, getSavedAnswers())) {
      goToReview();
    } else {
      edit.askToConfirmCancel();
    }
  };

  const discardEdit = () => {
    if (editSession) {
      trackEvent("frontend_reentry_profile_edit_discarded", {
        questionId: editSession.startQuestionId,
      });
    }
    setAnswers(getSavedAnswers());
    goToReview();
  };

  switch (step.kind) {
    case "intro": {
      const { min, max } = getQuestionCountRange(allQuestions);
      return {
        kind: "intro",
        headerAction: closeAction,
        props: {
          minQuestionCount: min,
          maxQuestionCount: max,
          onStart: start,
        },
      };
    }

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
        setStep({ ...step, error: undefined });
      };

      const saveAndExitAction: QuestionnaireHeaderAction = {
        kind: "saveAndExit",
        onClick: () => {
          // Clears the last failed save's error while this one saves.
          setStep({ ...step, error: undefined });
          save(
            { answers, isCompleted: false },
            {
              onSuccess: () => exit("save_and_exit"),
              onError: () => setStep({ ...step, error: "saveAndExit" }),
            },
          );
        },
      };

      const next = () => {
        if (!isAnswered(currentAnswer)) {
          setStep({ ...step, error: "missingAnswer" });
          return;
        }
        // Clears the last failed save's error while this one saves.
        setStep({ ...step, error: undefined });

        const goToNextStep = () => {
          if (upcomingQuestion) {
            goToQuestion(upcomingQuestion.id);
          } else {
            goToReview();
          }
        };

        // An edit of a completed profile only saves once it's finished, and
        // only if an answer changed.
        const isEditingProfile = isProfileCompleted && !!editSession;
        const savedAnswers = getSavedAnswers();
        const hasChanges = !allAnswersMatch(answers, savedAnswers);
        if (isEditingProfile && (!isLastQuestionBeforeReview || !hasChanges)) {
          goToNextStep();
        } else if (isEditingProfile) {
          const changedQuestionIds = visibleQuestions
            .filter(({ id }) => !answersMatch(answers[id], savedAnswers[id]))
            .map(({ id }) => id);
          save(
            { answers, isCompleted: false },
            {
              onSuccess: () => {
                changedQuestionIds.forEach((questionId) =>
                  trackEvent("frontend_reentry_profile_edit_answer_saved", {
                    questionId,
                    ratherNotSay: isRatherNotSay(answers[questionId]),
                  }),
                );
                setIsSavedBannerVisible(true);
                goToNextStep();
              },
              onError: () => setStep({ ...step, error: "saveAndUpdate" }),
            },
          );
        } else {
          save(
            { answers, isCompleted: false },
            {
              onSuccess: () => {
                trackEvent("frontend_reentry_question_answered", {
                  questionId: question.id,
                  sectionId: question.sectionDomain,
                  ratherNotSay: isRatherNotSay(currentAnswer),
                });
                goToNextStep();
              },
              onError: () => setStep({ ...step, error: "next" }),
            },
          );
        }
      };

      const back = () => {
        trackEvent("frontend_reentry_question_back_clicked", {
          questionId: question.id,
          isEditingProfile: isProfileCompleted,
        });
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
        headerAction: isProfileCompleted ? null : saveAndExitAction,
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
          error: step.error,
          editing,
        },
      };
    }

    case "review": {
      const entries = visibleQuestions.map((question) => ({
        questionId: question.id,
        heading: question.heading,
        answerText: formatAnswerText(question, answers[question.id]),
        isUpdated:
          isProfileCompleted &&
          !answersMatch(answers[question.id], initialAnswers[question.id]),
        onEdit: () => startEdit(question.id),
      }));

      if (isProfileCompleted) {
        const savedBanner = isSavedBannerVisible
          ? {
              onDismiss: () => setIsSavedBannerVisible(false),
              onGoToChecklist: goToChecklist,
            }
          : undefined;
        return {
          kind: "review",
          headerAction: closeAction,
          props: { isEditing: true, entries, savedBanner },
        };
      }
      return {
        kind: "review",
        headerAction: closeAction,
        props: {
          entries,
          onBack: backFromReview,
          onSubmit: submit,
          saveError: step.error,
        },
      };
    }

    case "completion":
      return {
        kind: "completion",
        headerAction: closeAction,
        props: {
          onGoToChecklist: () => {
            trackEvent("frontend_reentry_questionnaire_end_cta_clicked", {
              cta: "checklist",
            });
            goToChecklist();
          },
          onClose: () => {
            trackEvent("frontend_reentry_questionnaire_end_cta_clicked", {
              cta: "home",
            });
            exit("close");
          },
        },
      };
  }
}
