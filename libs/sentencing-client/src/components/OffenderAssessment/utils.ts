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

// Domain keys used for conditional rendering based on ORAS type
export type ORASDomainKey =
  | "criminalHistory"
  | "educationEmployment"
  | "familySocialSupport"
  | "neighborhoodProblems"
  | "substanceUse"
  | "peerAssociates"
  | "criminalAttitudes"
  | "responsivity";

export type ORASDomainSummaryField =
  | "criminalHistorySummary"
  | "employmentSummary"
  | "familyAndSocialSupportSummary"
  | "housingSummary"
  | "drugHistorySummary"
  | "peerAssociatesSummary"
  | "criminalAttitudesSummary"
  | "responsivityAndBarriersSummary";

export type ORASDomainRiskLevelField =
  | "criminalHistoryRiskLevel"
  | "educationRiskLevel"
  | "familySocialSupportRiskLevel"
  | "neighborhoodRiskLevel"
  | "substanceAbuseRiskLevel"
  | "peerAssociatesRiskLevel"
  | "criminalBehaviorRiskLevel";

export interface DomainConfig {
  key: ORASDomainKey;
  title: string;
  scoreField?: string;
  riskLevelField?: ORASDomainRiskLevelField;
  summaryField: ORASDomainSummaryField;
  maxScore?: number;
}

// Base domain configurations (reusable across ORAS types)
const DOMAIN = {
  CRIMINAL_HISTORY: {
    key: "criminalHistory",
    title: "Criminal History",
    scoreField: "criminalHistoryLevel",
    riskLevelField: "criminalHistoryRiskLevel",
    summaryField: "criminalHistorySummary",
  },
  EDUCATION_FINANCIAL: {
    key: "educationEmployment",
    title: "Education, Employment & Financial Situation",
    scoreField: "educationLevelScore",
    riskLevelField: "educationRiskLevel",
    summaryField: "employmentSummary",
  },
  EDUCATION_SOCIAL: {
    key: "educationEmployment",
    title: "Education, Employment & Social Support",
    scoreField: "educationLevelScore",
    riskLevelField: "educationRiskLevel",
    summaryField: "employmentSummary",
  },
  FAMILY_SOCIAL_SUPPORT: {
    key: "familySocialSupport",
    title: "Family & Social Support",
    scoreField: "familySocialSupportLevel",
    riskLevelField: "familySocialSupportRiskLevel",
    summaryField: "familyAndSocialSupportSummary",
  },
  NEIGHBORHOOD_PROBLEMS: {
    key: "neighborhoodProblems",
    title: "Neighborhood Problems",
    scoreField: "neighborhoodLevel",
    riskLevelField: "neighborhoodRiskLevel",
    summaryField: "housingSummary",
  },
  SUBSTANCE_USE: {
    key: "substanceUse",
    title: "Substance Use",
    scoreField: "substanceAbuseLevel",
    riskLevelField: "substanceAbuseRiskLevel",
    summaryField: "drugHistorySummary",
  },
  SUBSTANCE_USE_MENTAL_HEALTH: {
    key: "substanceUse",
    title: "Substance Use & Mental Health",
    scoreField: "substanceAbuseLevel",
    riskLevelField: "substanceAbuseRiskLevel",
    summaryField: "drugHistorySummary",
  },
  PEER_ASSOCIATES: {
    key: "peerAssociates",
    title: "Peer Associates",
    scoreField: "peerAssociatesLevel",
    riskLevelField: "peerAssociatesRiskLevel",
    summaryField: "peerAssociatesSummary",
  },
  CRIMINAL_ATTITUDES: {
    key: "criminalAttitudes",
    title: "Criminal Attitudes & Behavioral Patterns",
    scoreField: "criminalBehaviorLevel",
    riskLevelField: "criminalBehaviorRiskLevel",
    summaryField: "criminalAttitudesSummary",
  },
  RESPONSIVITY: {
    key: "responsivity",
    title: "Responsivity Issues & Barriers",
    // No score or risk level in source data — case planning checklist only
    summaryField: "responsivityAndBarriersSummary",
  },
} as const satisfies Record<string, DomainConfig>;

// ORAS domain configuration by assessment type
// Each ORAS tool assesses different domains with potentially different names
// maxScore values are observed maximums from production data
export const ORAS_DOMAIN_CONFIG: Record<string, DomainConfig[]> = {
  ORAS_CST: [
    { ...DOMAIN.CRIMINAL_HISTORY, maxScore: 8 },
    { ...DOMAIN.EDUCATION_FINANCIAL, maxScore: 6 },
    { ...DOMAIN.FAMILY_SOCIAL_SUPPORT, maxScore: 5 },
    { ...DOMAIN.NEIGHBORHOOD_PROBLEMS, maxScore: 3 },
    { ...DOMAIN.SUBSTANCE_USE, maxScore: 6 },
    { ...DOMAIN.PEER_ASSOCIATES, maxScore: 8 },
    { ...DOMAIN.CRIMINAL_ATTITUDES, maxScore: 13 },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_SRT: [
    { ...DOMAIN.CRIMINAL_HISTORY, maxScore: 12 },
    { ...DOMAIN.EDUCATION_SOCIAL, maxScore: 9 },
    { ...DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH, maxScore: 4 },
    { ...DOMAIN.CRIMINAL_ATTITUDES, maxScore: 19 },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_PIT: [
    { ...DOMAIN.CRIMINAL_HISTORY, maxScore: 10 },
    { ...DOMAIN.EDUCATION_FINANCIAL, maxScore: 7 },
    { ...DOMAIN.FAMILY_SOCIAL_SUPPORT, maxScore: 6 },
    { ...DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH, maxScore: 5 },
    { ...DOMAIN.CRIMINAL_ATTITUDES, maxScore: 11 },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_RT: [
    { ...DOMAIN.CRIMINAL_HISTORY, maxScore: 12 },
    { ...DOMAIN.EDUCATION_FINANCIAL, maxScore: 4 },
    { ...DOMAIN.CRIMINAL_ATTITUDES, maxScore: 11 },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  // Screening tools and other non-full assessments have no domain breakdown
  Other: [],
};

// Helper function to get domains for an assessment type
export function getDomainsForAssessmentType(
  assessmentType: string | null | undefined,
): DomainConfig[] {
  if (!assessmentType) {
    // When no ORAS is on file, show Criminal History only with no score or risk level
    return [
      {
        key: DOMAIN.CRIMINAL_HISTORY.key,
        title: DOMAIN.CRIMINAL_HISTORY.title,
        summaryField: DOMAIN.CRIMINAL_HISTORY.summaryField,
      },
    ];
  }
  return ORAS_DOMAIN_CONFIG[assessmentType] ?? [];
}
