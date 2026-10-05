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

/**
 * Configuration and types relating to the 120-Day Check-In Tool form
 * for Nebraska.
 *
 * This file should only contain internal identifiers, not copy. All copy should be
 * in the @jii/translation library.
 */

// The Check-In Tool form is a sequence of questions, each shown on its own page.
// Questions are grouped into sections and must be answered consecutively.
export type CheckInSectionId =
  | "sectionHousing"
  | "sectionEducationWork"
  | "sectionTransportation"
  | "sectionHobbiesLeisure"
  | "sectionMoney"
  | "sectionWellness"
  | "sectionPhysicalHealth"
  | "sectionSupportSystem"
  | "sectionStrengthsSkills"
  | "sectionEnd";

export type CheckInSectionSpec = {
  id: CheckInSectionId;
  questions: CheckInQuestionId[];
};

export const checkInToolSpec: CheckInSectionSpec[] = [
  {
    id: "sectionHousing",
    questions: [
      "WHERE_WILL_YOU_LIVE",
      "HOUSING_BACKUP_PLAN",
      "HOUSING_SUCCESS",
    ],
  },
  {
    id: "sectionWellness",
    questions: ["HELPFUL_SUPPORT"],
  },
];

export const checkInStandardRadioAnswers = ["YES", "NO"] as const;

type SelectAnswerFormat = "RADIO" | "CHECKBOX";
type TextEntryAnswerFormat = "FREE_TEXT"; // TODO(OBT-47841): Add "Support Systems" format

type SharedQuestionConfigFields = {
  optional?: boolean;
  // TODO(OBT-47841): Add support for branching/show-if questions
};
export type QuestionConfigWithAnswerOptions = SharedQuestionConfigFields & {
  format: SelectAnswerFormat;
  answers: readonly string[];
};
type QuestionConfigWithoutAnswerOptions = SharedQuestionConfigFields & {
  format: TextEntryAnswerFormat;
};

export type CheckInQuestionConfig =
  | QuestionConfigWithAnswerOptions
  | QuestionConfigWithoutAnswerOptions;

export type CheckInQuestionId =
  | "WHERE_WILL_YOU_LIVE"
  | "HOUSING_BACKUP_PLAN"
  | "HOUSING_SUCCESS"
  | "HELPFUL_SUPPORT";

export const checkInQuestionConfig: Record<
  CheckInQuestionId,
  CheckInQuestionConfig
> = {
  WHERE_WILL_YOU_LIVE: {
    format: "RADIO",
    answers: [
      "FAMILY_OR_FRIENDS",
      "OWN_PLACE",
      "TRANSITIONAL",
      "FIGURING_IT_OUT",
    ],
  },
  HOUSING_BACKUP_PLAN: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  HOUSING_SUCCESS: {
    format: "FREE_TEXT",
  },
  HELPFUL_SUPPORT: {
    format: "CHECKBOX",
    answers: [
      "SUPPORT_GROUP",
      "COUNSELOR",
      "MEDICATION",
      "RESIDENTIAL_TREATMENT",
      "PEER_SUPPORT",
      "OTHER",
    ],
    optional: true,
  },
};
