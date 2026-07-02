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

import moment from "moment";

import { ActiveFeatureVariants } from "../../datastores/types";
import { MutableSARAttributes } from "../CaseDetails/types";

export type ORASFormData = Pick<
  MutableSARAttributes,
  | "assessmentScore"
  | "assessmentType"
  | "assessmentDate"
  | "assessmentAdministeredBy"
  | "criminalHistoryLevel"
  | "educationLevelScore"
  | "neighborhoodLevel"
  | "substanceAbuseLevel"
  | "familySocialSupportLevel"
  | "peerAssociatesLevel"
  | "criminalBehaviorLevel"
  | "responsivityLevel"
  | "criminalHistoryRiskLevel"
  | "educationRiskLevel"
  | "neighborhoodRiskLevel"
  | "substanceAbuseRiskLevel"
  | "familySocialSupportRiskLevel"
  | "peerAssociatesRiskLevel"
  | "criminalBehaviorRiskLevel"
  | "noORASDomainReason"
  | "ORASDomainsAvailable"
>;

export const ORAS_EMPTY_FORM: ORASFormData = {
  assessmentScore: null,
  assessmentType: null,
  assessmentDate: null,
  assessmentAdministeredBy: null,
  criminalHistoryLevel: null,
  educationLevelScore: null,
  neighborhoodLevel: null,
  substanceAbuseLevel: null,
  familySocialSupportLevel: null,
  peerAssociatesLevel: null,
  criminalBehaviorLevel: null,
  responsivityLevel: null,
  criminalHistoryRiskLevel: null,
  educationRiskLevel: null,
  neighborhoodRiskLevel: null,
  substanceAbuseRiskLevel: null,
  familySocialSupportRiskLevel: null,
  peerAssociatesRiskLevel: null,
  criminalBehaviorRiskLevel: null,
  noORASDomainReason: null,
  ORASDomainsAvailable: true,
};

// Derives a domain risk level from a raw score as a fraction of maxScore.
// LOW: < 33%, MODERATE: 33–66%, HIGH: >= 67%
export function deriveDomainRiskLevel(
  score: number | null | undefined,
  maxScore: number | undefined,
): "LOW" | "MODERATE" | "HIGH" | null {
  if (score == null || !maxScore) return null;
  const ratio = score / maxScore;
  if (ratio >= 0.67) return "HIGH";
  if (ratio >= 0.33) return "MODERATE";
  return "LOW";
}

/**
 * Whether ORAS domain data (scores, risk levels) should be treated as
 * available. SARManualORAS gates the "no ORAS domains available" flow
 * entirely: with the flag off, domains are always treated as available,
 * matching pre-feature behavior for tenants that haven't opted in.
 */
export function shouldShowOrasContent(
  ORASDomainsAvailable: boolean | null | undefined,
  activeFeatureVariants: ActiveFeatureVariants,
): boolean {
  return (
    !activeFeatureVariants["SARManualORAS"] || (ORASDomainsAvailable ?? true)
  );
}

/**
 * Text describing the provenance/recency of ORAS data for the score card
 * header. Manually-entered ORAS data isn't synced on a schedule, so we show
 * that it was entered by staff instead of a sync timestamp.
 *
 * e.g. "Data manually added"
 * e.g. "Last Updated: 1/2/2026"
 */
export function getOrasUpdatedText(
  ORASLastUpdatedAt: Date | null,
  ORASEnteredManually: boolean,
): string {
  const label = ORASEnteredManually ? "Data Manually Added:" : `Last Updated: `;
  return `${label} ${
    ORASLastUpdatedAt ? moment.utc(ORASLastUpdatedAt).format("l") : "Unknown"
  }`;
}

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
  scoreField?: keyof ORASFormData;
  riskLevelField?: ORASDomainRiskLevelField;
  summaryField: ORASDomainSummaryField;
  maxScore?: number;
}

// Base domain configurations (reusable across ORAS types)
export const DOMAIN = {
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
