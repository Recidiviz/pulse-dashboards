// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Case, SAR } from "../api";

export const ReportType = {
  FullPSI: "Full PSI",
  FileReview: "File Review",
  FileReviewWithUpdatedLSIRScore: "File Review + Updated LSI-R",
};

// Shared constants used by both PSI and SAR
export const OTHER_OPTION = "Other";
export const NOT_SURE_YET_OPTION = "Not sure yet";

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

export const ProtectiveFactors: Record<
  Case["protectiveFactors"][number],
  string
> = {
  NoPriorCriminalConvictions: "No prior criminal convictions",
  NoHistoryOfViolentBehavior: "No history of violent behavior",
  NoSubstanceAbuseIssues: "No substance abuse issues",
  NoDiagnosisOfAMentalIllness: "No diagnosis of a mental illness",
  HistoryOfSuccessUnderSupervision: "History of success under supervision",
  LengthyPeriodsOfSobrietyAfterCompletingTreatment:
    "Lengthy periods of sobriety after completing treatment",
  StableHousing: "Stable housing",
  SteadyEmployment: "Steady employment",
  FinancialStability: "Financial stability",
  HighSchoolDiplomaOrHigherEducation: "High school diploma or higher education",
  StrongSocialSupportNetwork: "Strong social support network",
  CloseFamilyTies: "Close family ties",
  ActivelyParticipatingInTreatmentPrograms:
    "Actively participating in treatment programs",
  EnrolledInEducationalOrVocationalTraining:
    "Enrolled in educational or vocational training",
  ActiveInvolvementInCommunityActivities:
    "Active involvement in community activities",
  Other: "Other",
};

export const LevelOfEducationLabels: Record<
  NonNullable<SAR["levelOfEducation"]>,
  string
> = {
  NoFormalSchooling: "No Formal Schooling",
  ElementarySchool: "Elementary School",
  MiddleSchool: "Middle School",
  SomeHighSchool: "Some High School",
  HighSchoolDiplomaOrGED: "High School Diploma or GED",
  SomeCollege: "Some College",
  AssociateDegree: "Associate's Degree",
  BachelorsDegree: "Bachelor's Degree",
  MastersDegree: "Master's Degree",
  DoctorateDegree: "Doctorate Degree",
};
