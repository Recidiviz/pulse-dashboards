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

import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { useReentryQuestionnaire } from "../../../hooks/useReentryQuestionnaire";
import { useQuestionnaireFlow } from "./hooks/useQuestionnaireFlow";
import { QuestionnaireCancelModal } from "./QuestionnaireCancelModal/QuestionnaireCancelModal";
import { QuestionnaireCompletion } from "./QuestionnaireCompletion/QuestionnaireCompletion";
import { QuestionnaireForm } from "./QuestionnaireForm/QuestionnaireForm";
import { QuestionnaireIntro } from "./QuestionnaireIntro/QuestionnaireIntro";
import { QuestionnaireLayout } from "./QuestionnaireLayout/QuestionnaireLayout";
import { QuestionnaireReview } from "./QuestionnaireReview/QuestionnaireReview";
import { QuestionnaireDisplay } from "./types";

export const ReentryQuestionnaire = ({
  questions,
  sections,
}: QuestionnaireDisplay) => {
  const { t } = useUsMaTranslations();

  const navigate = useNavigate();
  const routeParams = useTypedParams(State.Resident);

  const exit = () =>
    navigate(State.Resident.UsMaReentry.Overview.buildPath(routeParams));

  const goToChecklist = () =>
    navigate(State.Resident.UsMaReentry.Checklist.buildPath(routeParams));

  const { status, answers, save, isSaving } = useReentryQuestionnaire();
  const screen = useQuestionnaireFlow({
    questions,
    sections,
    status,
    storedAnswers: answers,
    save,
    onExit: exit,
    onGoToChecklist: goToChecklist,
  });

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
        return (
          <QuestionnaireCompletion
            onGoToChecklist={goToChecklist}
            onClose={exit}
          />
        );
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
