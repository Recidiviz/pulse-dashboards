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

import { Case, Client } from "../../api";
import { RecommendationType } from "./types";

export const PDF_PAGE_WIDTH = 950;

export const OFFENSE_KEY = "offense";

export const VIOLENT_OFFENSE_KEY = "isCurrentOffenseViolent";

export const SEX_OFFENSE_KEY = "isCurrentOffenseSexual";

export const REPORT_TYPE_KEY = "reportType";
export type ReportTypeKey = typeof REPORT_TYPE_KEY;

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

export const CLIENT_GENDER_KEY = "clientGender";
export type ClientGender = "clientGender";

export const NeedsToBeAddressed: Record<
  Case["needsToBeAddressed"][number],
  string
> = {
  AngerManagement: "Anger Management",
  CaseManagement: "Case Management",
  ClothingAndToiletries: "Clothing and Toiletries",
  DomesticViolenceIssues: "Domestic Violence Issues",
  Education: "Education",
  FamilyServices: "Family Services",
  FinancialAssistance: "Financial Assistance",
  FoodInsecurity: "Food Insecurity",
  GeneralReEntrySupport: "General Re-entry Support",
  Healthcare: "Healthcare",
  HousingOpportunities: "Housing Opportunities",
  JobTrainingOrOpportunities: "Job Training or Opportunities",
  MentalHealth: "Mental Health",
  SubstanceUse: "Substance Use",
  Transportation: "Transportation",
  Other: "Other",
};

export const GenderToDisplayName: Record<Client["gender"], string> = {
  MALE: "Male",
  FEMALE: "Female",
  NON_BINARY: "Non-binary",
  TRANS: "Transgender",
  TRANS_FEMALE: "Transgender Female",
  TRANS_MALE: "Transgender Male",
  INTERNAL_UNKNOWN: "Unknown",
  EXTERNAL_UNKNOWN: "Unknown",
};

export const recommendationTypeOrder: Case["selectedRecommendation"][] = [
  RecommendationType.Probation,
  RecommendationType.Rider,
  RecommendationType.Term,
  RecommendationType.None,
];
