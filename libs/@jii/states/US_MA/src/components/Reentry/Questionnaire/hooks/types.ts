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

import type { SaveAnswers } from "../../../../hooks/types";
import type { ReentryQuestionnaireStatus } from "../../types";
import type { QuestionnaireCancelModalProps } from "../QuestionnaireCancelModal/QuestionnaireCancelModal";
import type { QuestionnaireFormProps } from "../QuestionnaireForm/QuestionnaireForm";
import type { QuestionnaireIntroProps } from "../QuestionnaireIntro/QuestionnaireIntro";
import type { QuestionnaireReviewProps } from "../QuestionnaireReview/QuestionnaireReview";
import type { SectionProgressProps } from "../SectionProgress/SectionProgress";
import type {
  QuestionAnswerValue,
  QuestionnaireAnswers,
  QuestionnaireQuestion,
  QuestionnaireSectionDisplay,
} from "../types";

export type EditSession = {
  startQuestionId: string;
};

export type UseQuestionnaireFlowParams = {
  questions: QuestionnaireQuestion[];
  sections: QuestionnaireSectionDisplay[];
  status: ReentryQuestionnaireStatus;
  storedAnswers: Record<string, unknown>;
  save: SaveAnswers;
  onExit: () => void;
  onGoToChecklist: () => void;
};

export type QuestionnaireHeaderAction = {
  kind: "close" | "saveAndExit";
  onClick: () => void;
};

type ScreenBase = {
  headerAction: QuestionnaireHeaderAction | null;
};

export type IntroScreen = ScreenBase & {
  kind: "intro";
  props: QuestionnaireIntroProps;
};

export type QuestionScreen = ScreenBase & {
  kind: "question";
  props: QuestionnaireFormProps;
  cancelDialog: QuestionnaireCancelModalProps;
  sectionProgress: Omit<SectionProgressProps, "sections">;
};

export type ReviewScreen = ScreenBase & {
  kind: "review";
  props: QuestionnaireReviewProps;
};

export type CompletionScreen = ScreenBase & {
  kind: "completion";
};

export type QuestionnaireScreen =
  | IntroScreen
  | QuestionScreen
  | ReviewScreen
  | CompletionScreen;

export type GetQuestionPositionParams = {
  visibleQuestions: QuestionnaireQuestion[];
  questionId: string;
  answers: QuestionnaireAnswers;
  sections: QuestionnaireSectionDisplay[];
  editSession: EditSession | null;
};

export type QuestionPosition = {
  question: QuestionnaireQuestion;
  answer: QuestionAnswerValue | undefined;
  previousQuestion: QuestionnaireQuestion | undefined;
  upcomingQuestion: QuestionnaireQuestion | undefined;
  isLastQuestionBeforeReview: boolean;
  sectionIndex: number;
};
