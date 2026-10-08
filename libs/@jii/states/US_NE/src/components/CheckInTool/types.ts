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
  CheckInAnswer,
  CheckInQuestionId,
  CheckInSectionId,
} from "~@jii/configs";
import {
  JiiResidentAppRouterInputs,
  JiiResidentAppRouterOutputs,
} from "~@jii/trpc-types";

export type CheckInFormResult =
  JiiResidentAppRouterOutputs["state"]["usNe"]["getCheckIn"];

export type CheckInFormData = NonNullable<CheckInFormResult>;

export type CheckInMutationInput =
  JiiResidentAppRouterInputs["state"]["usNe"]["updateCheckIn"];

export type QuestionInfo = {
  questionId: CheckInQuestionId;
  sectionId: CheckInSectionId;
};

export type WelcomeScreen = { screenKind: "welcome" };
export type SectionIntroScreen = {
  screenKind: "sectionIntro";
  sectionId: CheckInSectionId;
};
export type QuestionScreen = { screenKind: "question" } & QuestionInfo;
export type CompletionScreen = { screenKind: "completion" };

export type CheckInScreen =
  | WelcomeScreen
  | SectionIntroScreen
  | QuestionScreen
  | CompletionScreen;

export type QuestionScreenProps = {
  id: CheckInQuestionId;
  saveAnswer: (answer: CheckInAnswer) => void;
  saveIsPending: boolean;
  footerProps: {
    infoText: string;
    buttonText: string;
    isError: boolean;
  };
};

export type SelectQuestionScreenProps = QuestionScreenProps & {
  answers: readonly string[];
};
