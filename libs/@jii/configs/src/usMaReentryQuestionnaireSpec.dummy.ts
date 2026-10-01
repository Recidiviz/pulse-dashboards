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
// Stand-in for the real usMaReentryQuestionnaireSpec.ts, with deliberate
// deviations from its current shape:
//   - a `domain` per question, for section grouping (she's adding one)
//   - options as `{ id, exclusive? }` objects, for exclusive checkboxes
//   - question ids as their own union, so `satisfies` catches missing/extra keys
// Ids, options and copy are illustrative only - nothing real references them.
// Replaced with the real config in OBT-51840.

import { ShowIf } from "./showIf";

export type ReentryQuestionnaireQuestionFormat = "RADIO" | "CHECKBOX";

export const reentryQuestionnaireQuestionIds = [
  "housing",
  "planToWork",
  "healthcareNeeded",
  "healthcareDetails",
  "receivedBenefitsBefore",
  "benefitsType",
  "transportation",
  "highestEducationLevel",
  "servedInMilitary",
] as const;

export type ReentryQuestionnaireQuestionId =
  (typeof reentryQuestionnaireQuestionIds)[number];

export type ReentryQuestionnaireOptionConfig = {
  id: string;
  // CHECKBOX only: checking this option clears every other selection.
  exclusive?: boolean;
};

export type ReentryQuestionnaireQuestionConfig = {
  domain: string;
  format: ReentryQuestionnaireQuestionFormat;
  options: readonly ReentryQuestionnaireOptionConfig[];
  showIf?: ShowIf<ReentryQuestionnaireQuestionId>;
};

export const reentryQuestionnaireConfig = {
  housing: {
    domain: "housing",
    format: "RADIO",
    options: [
      { id: "FAMILY" },
      { id: "FRIENDS_OR_ROOMMATES" },
      { id: "LONG_TERM_RESIDENTIAL_PROGRAM" },
      { id: "OWN_PLACE" },
      { id: "UNSURE" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
  planToWork: {
    domain: "work",
    format: "RADIO",
    options: [
      { id: "YES_JOB_LINED_UP" },
      { id: "YES_NEED_TO_LOOK" },
      { id: "NO_DISABLED" },
      { id: "NO_RETIRED" },
      { id: "NO_SCHOOL" },
      { id: "UNSURE" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
  healthcareNeeded: {
    domain: "health",
    format: "RADIO",
    options: [
      { id: "YES" },
      { id: "NO" },
      { id: "UNSURE" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
  healthcareDetails: {
    domain: "health",
    format: "CHECKBOX",
    options: [
      { id: "PRESCRIPTION_MEDICINE" },
      { id: "ONGOING_CONDITION" },
      { id: "MENTAL_HEALTH" },
      { id: "SUBSTANCE_USE" },
      { id: "MEDICATION_ASSISTED_TREATMENT" },
    ],
    showIf: {
      questionId: "healthcareNeeded",
      operator: "equals",
      value: "YES",
    },
  },
  receivedBenefitsBefore: {
    domain: "money",
    format: "RADIO",
    options: [
      { id: "YES" },
      { id: "NONE_OF_THESE" },
      { id: "UNSURE" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
  benefitsType: {
    domain: "money",
    format: "CHECKBOX",
    options: [{ id: "SSI" }, { id: "SSDI" }],
    showIf: {
      questionId: "receivedBenefitsBefore",
      operator: "equals",
      value: "YES",
    },
  },
  transportation: {
    domain: "transportation",
    format: "CHECKBOX",
    options: [
      { id: "FAMILY_OR_FRIENDS" },
      { id: "PUBLIC_TRANSIT" },
      { id: "BIKE" },
      { id: "OWN_CAR" },
      { id: "UNSURE", exclusive: true },
      { id: "DECLINE_TO_ANSWER", exclusive: true },
    ],
  },
  highestEducationLevel: {
    domain: "education",
    format: "RADIO",
    options: [
      { id: "LESS_THAN_HIGH_SCHOOL" },
      { id: "HS_DIPLOMA_OR_GED_OR_HISET" },
      { id: "SOME_COLLEGE" },
      { id: "COLLEGE_DEGREE" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
  servedInMilitary: {
    domain: "documents",
    format: "RADIO",
    options: [
      { id: "YES_HAVE_DD214" },
      { id: "YES_MISSING_DD214" },
      { id: "NO" },
      { id: "DECLINE_TO_ANSWER" },
    ],
  },
} satisfies Record<
  ReentryQuestionnaireQuestionId,
  ReentryQuestionnaireQuestionConfig
>;
