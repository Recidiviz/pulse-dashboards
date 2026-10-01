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

  const { status, answers } = useReentryQuestionnaire();
  const screen = useQuestionnaireFlow({
    questions,
    sections,
    status,
    storedAnswers: answers,
  });

  const exit = () =>
    navigate(State.Resident.UsMaReentry.Overview.buildPath(routeParams));

  // TODO OBT-51840: save the current question's answer before exiting.
  const saveAndExit = () => exit();

  const goToChecklist = () =>
    navigate(State.Resident.UsMaReentry.Checklist.buildPath(routeParams));

  const headerActions = {
    close: {
      label: t(($) => $.reentry.questionnaire.header.close),
      onClick: exit,
    },
    saveAndExit: {
      label: t(($) => $.reentry.questionnaire.header.saveAndExit),
      onClick: saveAndExit,
    },
  };

  const renderScreen = () => {
    switch (screen.kind) {
      case "intro":
        return <QuestionnaireIntro {...screen.props} />;
      case "question":
        return (
          <>
            <QuestionnaireForm {...screen.props} />
            <QuestionnaireCancelModal {...screen.cancelDialog} />
          </>
        );
      case "review":
        return <QuestionnaireReview {...screen.props} />;
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
    ? headerActions[screen.headerAction]
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
