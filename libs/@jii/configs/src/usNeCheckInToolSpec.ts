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

import { ShowIfCondition } from "./showIf";

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
      "HOUSING_BACKUP_PLAN_DESCRIPTION",
      "HOUSING_SUCCESS",
      "HOUSING_STEP",
    ],
  },
  {
    id: "sectionEducationWork",
    questions: [
      "EDUCATION_PLANS",
      "EDUCATION_PLANS_DESCRIPTION",
      "WORK_PLANS",
      "WORK_PLANS_DESCRIPTION",
      "EDUCATION_WORK_SUCCESS",
      "EDUCATION_WORK_STEP",
    ],
  },
  {
    id: "sectionTransportation",
    questions: [
      "TRANSPORTATION_PLAN",
      "CAR_INSURANCE_REGISTRATION",
      "TRANSPORTATION_STEP",
    ],
  },
  {
    id: "sectionHobbiesLeisure",
    questions: ["DO_FOR_FUN", "STAY_AWAY_FROM", "STAY_AWAY_FROM_DESCRIPTION"],
  },
  {
    id: "sectionMoney",
    questions: [
      "FINES_AND_FEES",
      "DEBTS",
      "SOCIAL_SECURITY",
      "CHILDREN",
      "CHILDREN_DESCRIPTION",
      "FINANCES_SUCCESS",
      "FINANCES_STEP",
    ],
  },
  {
    id: "sectionWellness",
    questions: ["WELLNESS_SUPPORT", "WELLNESS_SUPPORT_OTHER", "WELLNESS_STEP"],
  },
  {
    id: "sectionPhysicalHealth",
    questions: [
      "MEDICAL_CONCERNS",
      "MEDICAL_CONCERNS_DESCRIPTION",
      "MEDICINE",
      "MEDICINE_DESCRIPTION",
      "HEALTH_GOALS",
      "HEALTH_STEP",
    ],
  },
  {
    id: "sectionSupportSystem",
    questions: ["SUPPORT_SYSTEM"],
  },
  {
    id: "sectionStrengthsSkills",
    questions: ["STRENGTH_1", "STRENGTH_2", "SKILL_1", "SKILL_2"],
  },
  {
    id: "sectionEnd",
    questions: ["OBSTACLES", "CELEBRATION"],
  },
];
export const checkInSections = checkInToolSpec.map(({ id }) => id);
export const checkInStandardRadioAnswers = ["YES", "NO"] as const;

type SelectAnswerFormat = "RADIO" | "CHECKBOX";
type TextEntryAnswerFormat = "FREE_TEXT" | "SUPPORT_SYSTEM";

type SharedQuestionConfigFields = {
  optional?: boolean;
  showIf?: ShowIfCondition<CheckInQuestionId> & { operator: "equals" };
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

export const checkInQuestionIds = [
  "WHERE_WILL_YOU_LIVE",
  "HOUSING_BACKUP_PLAN",
  "HOUSING_BACKUP_PLAN_DESCRIPTION",
  "HOUSING_SUCCESS",
  "HOUSING_STEP",
  "EDUCATION_PLANS",
  "EDUCATION_PLANS_DESCRIPTION",
  "WORK_PLANS",
  "WORK_PLANS_DESCRIPTION",
  "EDUCATION_WORK_SUCCESS",
  "EDUCATION_WORK_STEP",
  "TRANSPORTATION_PLAN",
  "CAR_INSURANCE_REGISTRATION",
  "TRANSPORTATION_STEP",
  "DO_FOR_FUN",
  "STAY_AWAY_FROM",
  "STAY_AWAY_FROM_DESCRIPTION",
  "FINES_AND_FEES",
  "DEBTS",
  "SOCIAL_SECURITY",
  "CHILDREN",
  "CHILDREN_DESCRIPTION",
  "FINANCES_SUCCESS",
  "FINANCES_STEP",
  "WELLNESS_SUPPORT",
  "WELLNESS_SUPPORT_OTHER",
  "WELLNESS_STEP",
  "MEDICAL_CONCERNS",
  "MEDICAL_CONCERNS_DESCRIPTION",
  "MEDICINE",
  "MEDICINE_DESCRIPTION",
  "HEALTH_GOALS",
  "HEALTH_STEP",
  "SUPPORT_SYSTEM",
  "STRENGTH_1",
  "STRENGTH_2",
  "SKILL_1",
  "SKILL_2",
  "OBSTACLES",
  "CELEBRATION",
] as const;

export type CheckInQuestionId = (typeof checkInQuestionIds)[number];

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
  HOUSING_BACKUP_PLAN_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "HOUSING_BACKUP_PLAN",
      operator: "equals",
      value: "YES",
    },
  },
  HOUSING_SUCCESS: {
    format: "FREE_TEXT",
  },
  HOUSING_STEP: {
    format: "FREE_TEXT",
  },
  EDUCATION_PLANS: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  EDUCATION_PLANS_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "EDUCATION_PLANS",
      operator: "equals",
      value: "YES",
    },
  },
  WORK_PLANS: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  WORK_PLANS_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "WORK_PLANS",
      operator: "equals",
      value: "YES",
    },
  },
  EDUCATION_WORK_SUCCESS: {
    format: "FREE_TEXT",
  },
  EDUCATION_WORK_STEP: {
    format: "FREE_TEXT",
  },
  TRANSPORTATION_PLAN: {
    format: "RADIO",
    answers: ["PUBLIC_TRANSPORT", "GET_A_RIDE", "OWN_CAR", "FIGURING_IT_OUT"],
  },
  CAR_INSURANCE_REGISTRATION: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
    showIf: {
      questionId: "TRANSPORTATION_PLAN",
      operator: "equals",
      value: "OWN_CAR",
    },
  },
  TRANSPORTATION_STEP: {
    format: "FREE_TEXT",
  },
  DO_FOR_FUN: {
    format: "FREE_TEXT",
  },
  STAY_AWAY_FROM: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  STAY_AWAY_FROM_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "STAY_AWAY_FROM",
      operator: "equals",
      value: "YES",
    },
  },
  FINES_AND_FEES: {
    format: "RADIO",
    answers: [...checkInStandardRadioAnswers, "DONT_KNOW"],
  },
  DEBTS: {
    format: "FREE_TEXT",
    optional: true,
  },
  SOCIAL_SECURITY: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  CHILDREN: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  CHILDREN_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "CHILDREN",
      operator: "equals",
      value: "YES",
    },
  },
  FINANCES_SUCCESS: {
    format: "FREE_TEXT",
  },
  FINANCES_STEP: {
    format: "FREE_TEXT",
  },
  WELLNESS_SUPPORT: {
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
  WELLNESS_SUPPORT_OTHER: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "WELLNESS_SUPPORT",
      operator: "equals",
      value: "OTHER",
    },
  },
  WELLNESS_STEP: {
    format: "FREE_TEXT",
  },
  MEDICAL_CONCERNS: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  MEDICAL_CONCERNS_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "MEDICAL_CONCERNS",
      operator: "equals",
      value: "YES",
    },
  },
  MEDICINE: {
    format: "RADIO",
    answers: checkInStandardRadioAnswers,
  },
  MEDICINE_DESCRIPTION: {
    format: "FREE_TEXT",
    showIf: {
      questionId: "MEDICINE",
      operator: "equals",
      value: "YES",
    },
  },
  HEALTH_GOALS: {
    format: "FREE_TEXT",
  },
  HEALTH_STEP: {
    format: "FREE_TEXT",
  },
  SUPPORT_SYSTEM: {
    format: "SUPPORT_SYSTEM",
    optional: true,
  },
  STRENGTH_1: {
    format: "FREE_TEXT",
  },
  STRENGTH_2: {
    format: "FREE_TEXT",
    optional: true,
  },
  SKILL_1: {
    format: "FREE_TEXT",
  },
  SKILL_2: {
    format: "FREE_TEXT",
    optional: true,
  },
  OBSTACLES: {
    format: "FREE_TEXT",
  },
  CELEBRATION: {
    format: "FREE_TEXT",
  },
};
