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

// TEMPORARY - FOR REVIEW AND TESTING ONLY.
// Renders the flow against dummy data so the route can be clicked through;
// switched to the real config and copy in OBT-51840.
import {
  reentryQuestionnaireConfig,
  reentryQuestionnaireQuestionIds,
} from "~@jii/configs";

import {
  domainLabels,
  domainOrder,
  optionCopy,
  questionCopy,
} from "../Reentry/Questionnaire/dummyQuestionnaireData";
import { ReentryQuestionnaire } from "../Reentry/Questionnaire/ReentryQuestionnaire";
import { buildQuestionnaireDisplay } from "../Reentry/Questionnaire/utils";

export const PageUsMaReentryQuestionnaire = () => {
  const questionnaire = buildQuestionnaireDisplay({
    questionIds: reentryQuestionnaireQuestionIds,
    config: reentryQuestionnaireConfig,
    sectionDomains: domainOrder,
    getSectionLabel: (domain) => domainLabels[domain],
    getQuestionCopy: (questionId) => questionCopy[questionId],
    getOptionCopy: (questionId, optionId) => optionCopy[questionId][optionId],
  });

  return <ReentryQuestionnaire {...questionnaire} />;
};
