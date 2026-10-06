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

import type {
  ReentryQuestionnaireDomainId,
  ReentryQuestionnaireQuestionConfig,
  ReentryQuestionnaireQuestionFormat,
  ShowIf,
} from "~@jii/configs";

export type QuestionAnswerOption = {
  value: string;
  label: string;
  exclusive?: boolean;
};

export type QuestionDisplay = {
  id: string;
  format: ReentryQuestionnaireQuestionFormat;
  heading: string;
  options: QuestionAnswerOption[];
  showIf?: ShowIf;
};

export type QuestionnaireSectionDisplay = {
  domain: string;
  label: string;
};

export type QuestionAnswerValue = string[];

export type QuestionnaireAnswers = Record<string, QuestionAnswerValue>;

export type QuestionnaireQuestion = QuestionDisplay & {
  sectionDomain: string;
};

export type QuestionnaireDisplay = {
  questions: QuestionnaireQuestion[];
  sections: QuestionnaireSectionDisplay[];
};

export type FlowStep =
  | { kind: "intro" }
  | { kind: "question"; questionId: string }
  | { kind: "review" }
  | { kind: "completion" };

export type QuestionnaireReviewEntry = {
  questionId: string;
  heading: string;
  answerText: string;
  onEdit: () => void;
};

export type GetQuestionCopy<QuestionId extends string> = (
  questionId: QuestionId,
) => string;

export type GetOptionCopy<QuestionId extends string> = (
  questionId: QuestionId,
  optionId: string,
) => string;

export type BuildQuestionnaireDisplayParams<QuestionId extends string> = {
  questionIds: readonly QuestionId[];
  config: Record<QuestionId, ReentryQuestionnaireQuestionConfig>;
  getSectionLabel: (domain: ReentryQuestionnaireDomainId) => string;
  getQuestionCopy: GetQuestionCopy<QuestionId>;
  getOptionCopy: GetOptionCopy<QuestionId>;
};
