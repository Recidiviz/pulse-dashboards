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

import {
  reentryQuestionnaireConfig,
  reentryQuestionnaireQuestionIds,
} from "~@jii/configs";
import { useUsMaTranslations } from "~@jii/translation";

import { ReentryQuestionnaire } from "../Reentry/Questionnaire/ReentryQuestionnaire";
import { buildQuestionnaireDisplay } from "../Reentry/Questionnaire/utils";

export const PageUsMaReentryQuestionnaire = () => {
  const { t } = useUsMaTranslations();

  const { domainCopy, questionCopy, optionCopy, standardOptionCopy } = t(
    ($) => $.reentry.questionnaire,
    { returnObjects: true },
  );
  // Widened so the config's option ids (plain strings) can index the copy.
  // A question with no optionCopy entry uses standardOptionCopy's labels.
  const questionOptionCopy: Partial<Record<string, Record<string, string>>> =
    optionCopy;
  const standardOptionLabels: Record<string, string> = standardOptionCopy;

  const questionnaire = buildQuestionnaireDisplay({
    questionIds: reentryQuestionnaireQuestionIds,
    config: reentryQuestionnaireConfig,
    getSectionLabel: (domain) => domainCopy[domain],
    getQuestionCopy: (questionId) => questionCopy[questionId].question,
    getOptionCopy: (questionId, optionId) =>
      (questionOptionCopy[questionId] ?? standardOptionLabels)[optionId],
  });

  return <ReentryQuestionnaire {...questionnaire} />;
};
