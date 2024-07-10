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

export const OTHER_NEED_TO_BE_ADDRESED_KEY: keyof Attributes =
  "otherNeedToBeAddressed";
export type OtherNeedToBeAddressed = "otherNeedToBeAddressed";

export const OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY: keyof Attributes =
  "otherMentalHealthDiagnosis";
export type OtherMentalHealthDiagnosis = "otherMentalHealthDiagnosis";

export const NO_OPTION = "No";
export const YES_OPTION = "Yes";
export const NOT_SURE_YET_OPTION = "Not sure yet";
