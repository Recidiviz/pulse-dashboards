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
  "TRANSPORTATION",
  "HEALTH",
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
  "TRANSPORTATION",
  "HEALTHCARE_NEEDED",
  "HEALTHCARE_DETAILS",
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
      "FRIENDS_OR_ROOMMATES",
      "LONG_TERM_RESIDENTIAL_PROGRAM",
      "SOBER_OR_ROOMING_HOUSE",
      "OWN_PLACE",
      ...unsureOrDeclinedOptionIds,
    ],
  },
  TRANSPORTATION: {
    domain: "TRANSPORTATION",
    format: "CHECKBOX",
    options: [
      "FAMILY_OR_FRIENDS",
      "PUBLIC_TRANSIT",
      "BIKE",
      "OWN_CAR",
      ...unsureOrDeclinedOptionIds,
    ],
    exclusiveOptions: unsureOrDeclinedOptionIds,
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
    ],
    exclusiveOptions: [],
    showIf: {
      questionId: "HEALTHCARE_NEEDED",
      operator: "equals",
      value: "YES",
    },
  },
};
