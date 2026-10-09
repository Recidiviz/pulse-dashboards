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
 * Configuration and types relating to the Reentry Questionnaire for Massachussets.
 *
 * This file should only contain internal identifiers, not copy. All copy should be
 * in the @jii/translation library.
 */

import { ShowIf } from "./showIf";

export type ReentryQuestionnaireQuestionFormat = "RADIO" | "CHECKBOX";

export const unsureOrDeclinedOptionIds = [
  "UNSURE",
  "DECLINED_TO_ANSWER",
] as const;

export const standardRadioOptionIds = [
  "YES",
  "NO",
  ...unsureOrDeclinedOptionIds,
] as const;
export type StandardRadioOptionId = (typeof standardRadioOptionIds)[number];

export const reentryQuestionnaireDomainIds = [
  "HOUSING",
  "WORK",
  "HEALTH",
  "MONEY",
  "TRANSPORTATION",
  "EDUCATION_AND_PROGRAMS",
  "DOCUMENTS",
] as const;
export type ReentryQuestionnaireDomainId =
  (typeof reentryQuestionnaireDomainIds)[number];

type QuestionConfigBase = {
  domain: ReentryQuestionnaireDomainId;
  options: readonly string[];
  // When set, this question is shown on its own page, only when the given
  // condition (or any one of the given conditions) is met.
  showIf?: ShowIf<ReentryQuestionnaireQuestionId>;
};

export type ReentryQuestionnaireQuestionConfig =
  | (QuestionConfigBase & { format: "RADIO" })
  | (QuestionConfigBase & {
      format: "CHECKBOX";
      // Selecting one of these clears every other selection. Empty when there
      // are none.
      exclusiveOptions: readonly string[];
    });

export const reentryQuestionnaireQuestionIds = [
  "HOUSING",
  "WORK_PLANS",
  "HEALTHCARE_NEEDED",
  "HEALTHCARE_DETAILS",
  "SSI_SSDI_ELIGIBILITY",
  "SSI_SSDI_DETAILS",
  "TRANSPORTATION_PLAN",
  "TRANSPORTATION",
  "RELEASE_DAY_TRANSPORTATION",
  "EDUCATION_LEVEL",
  "MILITARY_SERVICE",
  "BORN_IN_MASSACHUSETTS",
] as const;
export type ReentryQuestionnaireQuestionId =
  (typeof reentryQuestionnaireQuestionIds)[number];

export const reentryQuestionnaireConfig: Record<
  ReentryQuestionnaireQuestionId,
  ReentryQuestionnaireQuestionConfig
> = {
  HOUSING: {
    domain: "HOUSING",
    format: "RADIO",
    options: [
      "FAMILY",
      "FRIEND",
      "LONG_TERM_RESIDENTIAL_PROGRAM",
      "RESIDENTIAL_RECOVERY_HOUSE",
      "SOBER_HOUSE",
      "ROOMING_HOUSE",
      "OWN_PLACE",
      ...unsureOrDeclinedOptionIds,
    ],
  },
  WORK_PLANS: {
    domain: "WORK",
    format: "RADIO",
    options: [
      "HAS_JOB_LINED_UP",
      "LOOKING_FOR_WORK",
      "DISABLED",
      "RETIRED",
      "ATTENDING_SCHOOL",
      ...unsureOrDeclinedOptionIds,
    ],
  },
  HEALTHCARE_NEEDED: {
    domain: "HEALTH",
    format: "RADIO",
    options: standardRadioOptionIds,
  },
  HEALTHCARE_DETAILS: {
    domain: "HEALTH",
    format: "CHECKBOX",
    options: [
      "PRESCRIPTION_MEDICINE",
      "ONGOING_CONDITION",
      "MENTAL_HEALTH",
      "SUBSTANCE_USE",
      "MEDICATION_ASSISTED_TREATMENT",
      "SOMETHING_ELSE",
    ],
    exclusiveOptions: [],
    showIf: {
      questionId: "HEALTHCARE_NEEDED",
      operator: "equals",
      value: "YES",
    },
  },
  SSI_SSDI_ELIGIBILITY: {
    domain: "MONEY",
    format: "RADIO",
    options: standardRadioOptionIds,
  },
  SSI_SSDI_DETAILS: {
    domain: "MONEY",
    format: "CHECKBOX",
    options: ["SSI", "SSDI", "NONE", "DECLINED_TO_ANSWER"],
    exclusiveOptions: ["NONE", "DECLINED_TO_ANSWER"],
    showIf: {
      questionId: "SSI_SSDI_ELIGIBILITY",
      operator: "equals",
      value: "YES",
    },
  },
  TRANSPORTATION_PLAN: {
    domain: "TRANSPORTATION",
    format: "RADIO",
    options: ["HAS_PLAN", "NO_PLAN_YET", "DECLINED_TO_ANSWER"],
  },
  TRANSPORTATION: {
    domain: "TRANSPORTATION",
    format: "CHECKBOX",
    options: ["FAMILY_OR_FRIENDS", "PUBLIC_TRANSIT", "BIKE", "OWN_CAR"],
    exclusiveOptions: [],
    showIf: {
      questionId: "TRANSPORTATION_PLAN",
      operator: "equals",
      value: "HAS_PLAN",
    },
  },
  RELEASE_DAY_TRANSPORTATION: {
    domain: "TRANSPORTATION",
    format: "RADIO",
    options: ["PICKUP", "PUBLIC_TRANSPORTATION", ...unsureOrDeclinedOptionIds],
  },
  EDUCATION_LEVEL: {
    domain: "EDUCATION_AND_PROGRAMS",
    format: "RADIO",
    options: [
      "BACHELORS_OR_HIGHER",
      "ASSOCIATE_DEGREE",
      "SOME_COLLEGE",
      "HIGH_SCHOOL_EQUIVALENT",
      "LESS_THAN_HIGH_SCHOOL",
      "DECLINED_TO_ANSWER",
    ],
  },
  MILITARY_SERVICE: {
    domain: "DOCUMENTS",
    format: "RADIO",
    options: ["YES_HAS_DD214", "YES_NEEDS_DD214", "NO", "DECLINED_TO_ANSWER"],
  },
  BORN_IN_MASSACHUSETTS: {
    domain: "DOCUMENTS",
    format: "RADIO",
    options: ["YES", "NO", "DECLINED_TO_ANSWER"],
  },
};
