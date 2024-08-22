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

import { Case } from "../../api";

export const OFFENSE_KEY = "offense";

export const LSIR_SCORE_KEY = "lsirScore";
export type LsirScoreKey = "lsirScore";

export const NEEDS_TO_BE_ADDRESSED_KEY = "needsToBeAddressed";
export type NeedsToBeAddressedKey = "needsToBeAddressed";

export const ASAM_CARE_RECOMMENDATION_KEY = "asamCareRecommendation";
export type AsamCareRecommendationKey = "asamCareRecommendation";

export const MENTAL_HEALTH_DIAGNOSES_KEY = "mentalHealthDiagnoses";
export type MentalHealthDiagnosesKey = "mentalHealthDiagnoses";

export const PLEA_KEY = "plea";
export type PleaKey = "plea";

export const IS_VETERAN_KEY = "isVeteran";
export type IsVeteran = "isVeteran";

export const OTHER_NEED_TO_BE_ADDRESSED_KEY = "otherNeedToBeAddressed";
export type OtherNeedToBeAddressed = "otherNeedToBeAddressed";

export const OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY = "otherMentalHealthDiagnosis";
export type OtherMentalHealthDiagnosis = "otherMentalHealthDiagnosis";

export const SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY =
  "substanceUseDisorderDiagnosis";
export type SubstanceUseDisorderDiagnosis = "substanceUseDisorderDiagnosis";

export const PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY =
  "previouslyIncarceratedOrUnderSupervision";
export type PreviouslyIncarceratedOrUnderSupervision =
  "previouslyIncarceratedOrUnderSupervision";

export const HAS_PREVIOUS_FELONY_KEY = "hasPreviousFelonyConviction";
export type HasPreviousFelonyConviction = "hasPreviousFelonyConviction";

export const HAS_PREVIOUS_VIOLENT_OFFENSE_KEY =
  "hasPreviousViolentOffenseConviction";
export type HasPreviousViolentOffenseConviction =
  "hasPreviousViolentOffenseConviction";

export const HAS_PREVIOUS_SEX_OFFENSE_KEY = "hasPreviousSexOffenseConviction";
export type HasPreviousSexOffenseConviction = "hasPreviousSexOffenseConviction";

export const HAS_PREVIOUS_TREATMENT_COURT_KEY = "hasPreviousTreatmentCourt";
export type HasPreviousTreatmentCourt = "hasPreviousTreatmentCourt";

export const HAS_DEVELOPMENTAL_DISABILITY_KEY = "hasDevelopmentalDisability";
export type HasDevelopmentalDisability = "hasDevelopmentalDisability";

export const HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY =
  "hasOpenChildProtectiveServicesCase";
export type HasOpenChildProtectiveServicesCase =
  "hasOpenChildProtectiveServicesCase";

export const NO_OPTION = "No";
export const YES_OPTION = "Yes";
export const NOT_SURE_YET_OPTION = "Not sure yet";

export const needsToBeAddressed: Record<
  Case["needsToBeAddressed"][number],
  string
> = {
  AngerManagement: "Anger management",
  CaseManagement: "Case management",
  ClothingAndToiletries: "Clothing and toiletries",
  DomesticViolenceIssues: "Domestic violence issues",
  Education: "Education",
  FamilyServices: "Family services",
  FinancialAssistance: "Financial assistance",
  FoodInsecurity: "Food insecurity",
  GeneralReEntrySupport: "General re-entry support",
  Healthcare: "Healthcare",
  HousingOpportunities: "Housing opportunities",
  JobTrainingOrOpportunities: "Job training or opportunities",
  MentalHealth: "Mental health",
  SubstanceUse: "Substance use",
  Transportation: "Transportation",
  Other: "Other",
};
