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

import { Client } from "../../api";
import { ActiveFeatureVariants } from "../../datastores/types";
import { GenderToDisplayName } from "../CaseDetails/constants";
import { MutableSARAttributes } from "../CaseDetails/types";
import { Boundaries } from "./assessmentTypeUtils";
import { RiskLevelKey } from "./constants";

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

/**
 * Derives a domain risk level from a raw score, given the score thresholds
 * (from the official ORAS scoring guide, see MO-11748) at which the domain
 * enters MODERATE and HIGH. Below `moderate` is LOW; there's no upper bound
 * on HIGH since scores are already capped at the domain's maxScore.
 *
 * Mirrors assessmentTypeUtils.ts's `getAssessmentScoreBucket`, which applies
 * the same threshold shape to the overall (gendered) assessment score.
 */
export function deriveDomainRiskLevel(
  score: number | null | undefined,
  cutoffs: Boundaries,
): "LOW" | "MODERATE" | "HIGH" | null {
  if (score == null) return null;

  if (score >= cutoffs.high) return "HIGH";
  if (score >= cutoffs.moderate) return "MODERATE";
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

/** Whether the Responsivity domain's Sexual History content (summary +
 * Static-99R note) should render, behind the `SARSexualHistory` variant. */
export function shouldShowSexualHistoryContent(
  involvesSexCrime: boolean | null | undefined,
  activeFeatureVariants: ActiveFeatureVariants,
): boolean {
  return !!involvesSexCrime && !!activeFeatureVariants["SARSexualHistory"];
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
  riskLevelCutoffs?: Boundaries;
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
//
// riskLevelCutoffs come from the official University of Cincinnati ORAS
// scoring guides (see MO-11748)
export const ORAS_DOMAIN_CONFIG: Record<string, DomainConfig[]> = {
  ORAS_CST: [
    {
      ...DOMAIN.CRIMINAL_HISTORY,
      maxScore: 8,
      riskLevelCutoffs: { moderate: 4, high: 7 },
    },
    {
      ...DOMAIN.EDUCATION_FINANCIAL,
      maxScore: 6,
      riskLevelCutoffs: { moderate: 2, high: 5 },
    },
    {
      ...DOMAIN.FAMILY_SOCIAL_SUPPORT,
      maxScore: 5,
      riskLevelCutoffs: { moderate: 2, high: 4 },
    },
    {
      ...DOMAIN.NEIGHBORHOOD_PROBLEMS,
      maxScore: 3,
      riskLevelCutoffs: { moderate: 1, high: 2 },
    },
    {
      ...DOMAIN.SUBSTANCE_USE,
      maxScore: 6,
      riskLevelCutoffs: { moderate: 3, high: 5 },
    },
    {
      ...DOMAIN.PEER_ASSOCIATES,
      maxScore: 8,
      riskLevelCutoffs: { moderate: 2, high: 5 },
    },
    {
      ...DOMAIN.CRIMINAL_ATTITUDES,
      maxScore: 13,
      riskLevelCutoffs: { moderate: 4, high: 9 },
    },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_SRT: [
    {
      ...DOMAIN.CRIMINAL_HISTORY,
      maxScore: 12,
      riskLevelCutoffs: { moderate: 4, high: 7 },
    },
    {
      ...DOMAIN.EDUCATION_SOCIAL,
      maxScore: 9,
      riskLevelCutoffs: { moderate: 5, high: 7 },
    },
    {
      ...DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH,
      maxScore: 4,
      riskLevelCutoffs: { moderate: 2, high: 3 },
    },
    {
      ...DOMAIN.CRIMINAL_ATTITUDES,
      maxScore: 19,
      riskLevelCutoffs: { moderate: 6, high: 9 },
    },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_PIT: [
    {
      ...DOMAIN.CRIMINAL_HISTORY,
      maxScore: 10,
      riskLevelCutoffs: { moderate: 4, high: 7 },
    },
    {
      ...DOMAIN.EDUCATION_FINANCIAL,
      maxScore: 7,
      riskLevelCutoffs: { moderate: 4, high: 6 },
    },
    {
      ...DOMAIN.FAMILY_SOCIAL_SUPPORT,
      maxScore: 6,
      riskLevelCutoffs: { moderate: 3, high: 5 },
    },
    {
      ...DOMAIN.SUBSTANCE_USE_MENTAL_HEALTH,
      maxScore: 5,
      riskLevelCutoffs: { moderate: 2, high: 4 },
    },
    {
      ...DOMAIN.CRIMINAL_ATTITUDES,
      maxScore: 11,
      riskLevelCutoffs: { moderate: 3, high: 6 },
    },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  ORAS_RT: [
    {
      ...DOMAIN.CRIMINAL_HISTORY,
      maxScore: 12,
      riskLevelCutoffs: { moderate: 4, high: 8 },
    },
    {
      ...DOMAIN.EDUCATION_FINANCIAL,
      maxScore: 4,
      riskLevelCutoffs: { moderate: 3, high: 4 },
    },
    {
      ...DOMAIN.CRIMINAL_ATTITUDES,
      maxScore: 11,
      riskLevelCutoffs: { moderate: 4, high: 7 },
    },
    DOMAIN.RESPONSIVITY, // No numeric score in source data
  ],
  // Screening tools and other non-full assessments have no domain breakdown
  Other: [],
};

export const STATIC_99R_INTRO =
  "The Static 99R is an instrument designed to assist in the prediction of sexual and violent recidivism for sexual offenders. It consists of 10 items and produces estimates of future risk based upon the number of risk factors present in any one individual.";

export type Static99RRiskCategory =
  | "LOW"
  | "MODERATE_LOW"
  | "MODERATE_HIGH"
  | "HIGH";

export const STATIC_99R_RISK_CATEGORY_LABELS: Record<
  Static99RRiskCategory,
  string
> = {
  LOW: "Low",
  MODERATE_LOW: "Moderate-Low",
  MODERATE_HIGH: "Moderate-High",
  HIGH: "High",
};

// The two moderate tiers share the existing MODERATE chip color — there's no
// separate color for them in the shared LOW/MODERATE/HIGH palette.
export const STATIC_99R_RISK_CATEGORY_TO_RISK_LEVEL: Record<
  Static99RRiskCategory,
  RiskLevelKey
> = {
  LOW: "LOW",
  MODERATE_LOW: "MODERATE",
  MODERATE_HIGH: "MODERATE",
  HIGH: "HIGH",
};

// Static-99R risk category cutoffs, applied to the raw score (range -3 to 12).
export function deriveStatic99RRiskCategory(
  score: number,
): Static99RRiskCategory {
  if (score <= 1) return "LOW";
  if (score <= 3) return "MODERATE_LOW";
  if (score <= 5) return "MODERATE_HIGH";
  return "HIGH";
}

/**
 * Static-99R report note as plain text. Used by renderers that can't render
 * the on-screen `Static99RReportText` component's colored chip (the react-pdf
 * template can only render its own primitives, not arbitrary styled-components
 * DOM elements) — see `Static99RReportText` for the chip'd on-screen version.
 */
export function buildStatic99RReportText(
  offenderName: string,
  gender: Client["gender"] | null | undefined,
  score: number | null,
): string {
  if (score == null) return STATIC_99R_INTRO;

  const riskCategory = deriveStatic99RRiskCategory(score);
  const label = STATIC_99R_RISK_CATEGORY_LABELS[riskCategory];
  const genderAdjective = gender
    ? GenderToDisplayName[gender].toLowerCase()
    : "adult";

  return `${STATIC_99R_INTRO} ${offenderName} scored ${score} on this risk assessment instrument. Based upon the Static 99R score, this places ${offenderName} in the ${label} risk category relative to other ${genderAdjective} sex offenders.`;
}

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
