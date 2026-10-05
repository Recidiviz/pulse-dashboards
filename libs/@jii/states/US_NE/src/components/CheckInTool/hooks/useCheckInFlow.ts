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

import assertNever from "assert-never";

import {
  CheckInFormData,
  CheckInScreen,
  SectionIntroScreen,
  WelcomeScreen,
} from "../types";
import { useUsNeCheckInContext } from "../UsNeCheckInContext";

/**
 * This hook handles the check-in's in-memory navigation,
 * and returns data about the screen to show.
 */
export function useCheckInFlow(data: CheckInFormData): CheckInScreen {
  const { hasSeenScreen } = useUsNeCheckInContext();

  const { kind } = data.status;

  if (kind === "COMPLETED") {
    return {
      screenKind: "completion",
    };
  } else if (kind === "NOT_STARTED") {
    // People who haven't started proceed through a few intro screens and then arrive
    // at the first question screen. Return the first intro screen they haven't seen.
    const firstSectionId = data.status.firstQuestion.sectionId;

    const introScreens: (WelcomeScreen | SectionIntroScreen)[] = [
      {
        screenKind: "welcome",
      },
      {
        screenKind: "sectionIntro",
        sectionId: firstSectionId,
      },
    ];

    const firstQuestionScreen: CheckInScreen = {
      screenKind: "question",
      ...data.status.firstQuestion,
    };

    return introScreens.find((s) => !hasSeenScreen(s)) ?? firstQuestionScreen;
  } else if (kind === "QUESTION") {
    // People who are on a question might see that question, or the intro
    // to the section that contains the question.
    const { question, isFirstQuestionOfSection } = data.status;

    const sectionIntro: SectionIntroScreen = {
      screenKind: "sectionIntro",
      sectionId: question.sectionId,
    };

    if (isFirstQuestionOfSection && !hasSeenScreen(sectionIntro)) {
      return sectionIntro;
    }

    return {
      screenKind: "question",
      ...question,
    };
  } else {
    return assertNever(data.status);
  }
}
