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

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { useReentryAnalytics } from "../../../hooks/useReentryAnalytics";
import { useReentryQuestionnaire } from "../../../hooks/useReentryQuestionnaire";
import { useReentryQuestionnaireDisplay } from "../../../hooks/useReentryQuestionnaireDisplay";
import { useQuestionnaireFlow } from "./hooks/useQuestionnaireFlow";
import { QuestionnaireCancelModal } from "./QuestionnaireCancelModal/QuestionnaireCancelModal";
import { QuestionnaireCompletion } from "./QuestionnaireCompletion/QuestionnaireCompletion";
import { QuestionnaireForm } from "./QuestionnaireForm/QuestionnaireForm";
import { QuestionnaireIntro } from "./QuestionnaireIntro/QuestionnaireIntro";
import { QuestionnaireLayout } from "./QuestionnaireLayout/QuestionnaireLayout";
import { QuestionnaireReview } from "./QuestionnaireReview/QuestionnaireReview";

export const ReentryQuestionnaire = () => {
  const { t } = useUsMaTranslations();
  const { questions, sections } = useReentryQuestionnaireDisplay();

  const navigate = useNavigate();
  const routeParams = useTypedParams(State.Resident);

  const exit = () =>
    navigate(State.Resident.UsMaReentry.Overview.buildPath(routeParams));

  const goToChecklist = () =>
    navigate(State.Resident.UsMaReentry.Checklist.buildPath(routeParams));

  const trackEvent = useReentryAnalytics();
  const { status, answers, save, isSaving } = useReentryQuestionnaire();
  const screen = useQuestionnaireFlow({
    questions,
    sections,
    status,
    storedAnswers: answers,
    save,
    onExit: exit,
    onGoToChecklist: goToChecklist,
    trackEvent,
  });

  // Each new screen starts at the top.
  const screenId =
    screen.kind === "question" ? screen.props.question.id : screen.kind;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screenId]);

  const headerActionLabels = {
    close: t(($) => $.reentry.questionnaire.header.close),
    saveAndExit: t(($) => $.reentry.questionnaire.header.saveAndExit),
  };

  const renderScreen = () => {
    switch (screen.kind) {
      case "intro":
        return <QuestionnaireIntro {...screen.props} />;
      case "question":
        return (
          <>
            <QuestionnaireForm
              key={screen.props.question.id}
              {...screen.props}
              isSaving={isSaving}
            />
            <QuestionnaireCancelModal {...screen.cancelDialog} />
          </>
        );
      case "review":
        return <QuestionnaireReview {...screen.props} isSaving={isSaving} />;
      case "completion":
        return <QuestionnaireCompletion {...screen.props} />;
    }
  };

  const headerAction = screen.headerAction
    ? {
        label: headerActionLabels[screen.headerAction.kind],
        onClick: screen.headerAction.onClick,
        disabled: isSaving,
      }
    : undefined;
  const sectionProgressProps =
    screen.kind === "question"
      ? { sections, ...screen.sectionProgress }
      : undefined;

  return (
    <QuestionnaireLayout
      headerAction={headerAction}
      sectionProgress={sectionProgressProps}
    >
      {renderScreen()}
    </QuestionnaireLayout>
  );
};
