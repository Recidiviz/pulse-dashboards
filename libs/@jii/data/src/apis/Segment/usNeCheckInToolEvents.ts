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

import { CheckInQuestionId, CheckInSectionId } from "~@jii/configs";

import type { NoProperties } from "./types";

/**
 * Segment event kinds and shared types for the Nebraska 120-Day Check-In Tool.
 */

export type QuestionInfo = {
  questionId: CheckInQuestionId;
  sectionId: CheckInSectionId;
};

export type WelcomeScreenKind = "welcome" | "instructions";
export type WelcomeScreen = { screenKind: WelcomeScreenKind };
export type SectionIntroScreen = {
  screenKind: "sectionIntro";
  sectionId: CheckInSectionId;
};
type QuestionScreen = { screenKind: "question" } & QuestionInfo;
type CompletionScreen = { screenKind: "completion" };

export type CheckInScreen =
  | WelcomeScreen
  | SectionIntroScreen
  | QuestionScreen
  | CompletionScreen;

export type UsNeCheckInToolEvents = {
  frontend_ne_check_in_opened: NoProperties;

  frontend_ne_check_in_page_viewed: {
    screenKind: CheckInScreen["screenKind"];
  } & Partial<QuestionInfo>;

  frontend_ne_check_in_question_answered: QuestionInfo;

  frontend_ne_check_in_exit_modal_opened: NoProperties;

  frontend_ne_check_in_exit_modal_closed: NoProperties;

  frontend_ne_check_in_exited: NoProperties;
};

export type TrackUsNeCheckInToolEvent = <
  Name extends keyof UsNeCheckInToolEvents,
>(
  name: Name,
  properties: UsNeCheckInToolEvents[Name],
) => void;
