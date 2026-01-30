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

export interface DomainConfig {
  key: ORASDomainKey;
  title: string;
  scoreField: string;
  summaryField: ORASDomainSummaryField;
}

// Base domain configurations (reusable across ORAS types)
const DOMAIN = {
  CRIMINAL_HISTORY: {
    key: "criminalHistory",
    title: "Criminal History",
    scoreField: "criminalHistoryLevel",
    summaryField: "criminalHistorySummary",
  },
  EDUCATION_FINANCIAL: {
    key: "educationEmployment",
    title: "Education, Employment & Financial Situation",
    scoreField: "educationLevelScore",
    summaryField: "employmentSummary",
  },
  EDUCATION_SOCIAL: {
    key: "educationEmployment",
    title: "Education, Employment & Social Support",
    scoreField: "educationLevelScore",
    summaryField: "employmentSummary",
  },
  FAMILY_SOCIAL_SUPPORT: {
    key: "familySocialSupport",
    title: "Family & Social Support",
    scoreField: "familySocialSupportLevel",
    summaryField: "familyAndSocialSupportSummary",
  },
  NEIGHBORHOOD_PROBLEMS: {
    key: "neighborhoodProblems",
    title: "Neighborhood Problems",
    scoreField: "neighborhoodLevel",
    summaryField: "housingSummary",
  },
  SUBSTANCE_USE: {
    key: "substanceUse",
    title: "Substance Use",
    scoreField: "substanceAbuseLevel",
    summaryField: "drugHistorySummary",
  },
  SUBSTANCE_USE_MENTAL_HEALTH: {
    key: "substanceUse",
    title: "Substance Use & Mental Health",
    scoreField: "substanceAbuseLevel",
    summaryField: "drugHistorySummary",
  },
  PEER_ASSOCIATES: {
    key: "peerAssociates",
    title: "Peer Associates",
    scoreField: "peerAssociatesLevel",
    summaryField: "peerAssociatesSummary",
  },
  CRIMINAL_ATTITUDES: {
    key: "criminalAttitudes",
    title: "Criminal Attitudes & Behavioral Patterns",
    scoreField: "criminalBehaviorLevel",
    summaryField: "criminalAttitudesSummary",
  },
  RESPONSIVITY: {
    key: "responsivity",
    title: "Responsivity Issues & Barriers",
    scoreField: "responsivityLevel",
    summaryField: "responsivityAndBarriersSummary",
  },
} as const satisfies Record<string, DomainConfig>;

// ORAS domain configuration by assessment type
// Each ORAS tool assesses different domains with potentially different names
export const ORAS_DOMAIN_CONFIG: Record<string, DomainConfig[]> = {
  ORAS_CST: [
    DOMAIN.CRIMINAL_HISTORY,
    DOMAIN.EDUCATION_FINANCIAL,
    DOMAIN.FAMILY_SOCIAL_SUPPORT,
    DOMAIN.NEIGHBORHOOD_PROBLEMS,
    DOMAIN.SUBSTANCE_USE,
    DOMAIN.PEER_ASSOCIATES,
    DOMAIN.CRIMINAL_ATTITUDES,
    DOMAIN.RESPONSIVITY,
  ],
  ORAS_SRT: [
    DOMAIN.CRIMINAL_HISTORY,
    DOMAIN.EDUCATION_SOCIAL,
    DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH,
    DOMAIN.CRIMINAL_ATTITUDES,
    DOMAIN.RESPONSIVITY,
  ],
  ORAS_PIT: [
    DOMAIN.CRIMINAL_HISTORY,
    DOMAIN.EDUCATION_FINANCIAL,
    DOMAIN.FAMILY_SOCIAL_SUPPORT,
    DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH,
    DOMAIN.CRIMINAL_ATTITUDES,
    DOMAIN.RESPONSIVITY,
  ],
  ORAS_RT: [
    DOMAIN.CRIMINAL_HISTORY,
    DOMAIN.EDUCATION_FINANCIAL,
    DOMAIN.CRIMINAL_ATTITUDES,
    DOMAIN.RESPONSIVITY,
  ],
};

// Helper function to get domains for an assessment type
export function getDomainsForAssessmentType(
  assessmentType: string | null | undefined,
): DomainConfig[] {
  if (!assessmentType || !ORAS_DOMAIN_CONFIG[assessmentType]) {
    // Default to CST (most comprehensive) if unknown
    return ORAS_DOMAIN_CONFIG["ORAS_CST"];
  }
  return ORAS_DOMAIN_CONFIG[assessmentType];
}
