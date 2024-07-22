// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Attributes } from "./types";

export const LSIR_SCORE_KEY: keyof Attributes = "lsirScore";
export type LsirScoreKey = "lsirScore";

export const NEEDS_TO_BE_ADDRESSED_KEY: keyof Attributes = "needsToBeAddressed";
export type NeedsToBeAddressedKey = "needsToBeAddressed";

export const ASAM_CARE_RECOMMENDATION_KEY: keyof Attributes =
  "asamCareRecommendation";
export type AsamCareRecommendationKey = "asamCareRecommendation";

export const MENTAL_HEALTH_DIAGNOSES_KEY: keyof Attributes =
  "mentalHealthDiagnoses";
export type MentalHealthDiagnosesKey = "mentalHealthDiagnoses";

export const PLEA_KEY: keyof Attributes = "plea";
export type PleaKey = "plea";

export const IS_VETERAN_KEY: keyof Attributes = "isVeteran";
export type IsVeteran = "isVeteran";

export const OTHER_NEED_TO_BE_ADDRESSED_KEY: keyof Attributes =
  "otherNeedToBeAddressed";
export type OtherNeedToBeAddressed = "otherNeedToBeAddressed";

export const OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY: keyof Attributes =
  "otherMentalHealthDiagnosis";
export type OtherMentalHealthDiagnosis = "otherMentalHealthDiagnosis";

export const SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY: keyof Attributes =
  "substanceUseDisorderDiagnosis";
export type SubstanceUseDisorderDiagnosis = "substanceUseDisorderDiagnosis";

export const PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY: keyof Attributes =
  "previouslyIncarceratedOrUnderSupervision";
export type PreviouslyIncarceratedOrUnderSupervision =
  "previouslyIncarceratedOrUnderSupervision";

export const HAS_PREVIOUS_VIOLENT_OFFENSE_KEY: keyof Attributes =
  "hasPreviousViolentOffenseConviction";
export type HasPreviousViolentOffenseConviction =
  "hasPreviousViolentOffenseConviction";

export const HAS_DEVELOPMENTAL_DISABILITY_KEY: keyof Attributes =
  "hasDevelopmentalDisability";
export type HasDevelopmentalDisability = "hasDevelopmentalDisability";

export const HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY: keyof Attributes =
  "hasOpenChildProtectiveServicesCase";
export type HasOpenChildProtectiveServicesCase =
  "hasOpenChildProtectiveServicesCase";

export const NO_OPTION = "No";
export const YES_OPTION = "Yes";
export const NOT_SURE_YET_OPTION = "Not sure yet";
