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

export const RISK_LEVELS = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
} as const;

export function calculateRiskLevel(score: number): keyof typeof RISK_LEVELS {
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MODERATE";
  return "LOW";
}

export const RISK_COLORS = {
  HIGH: "#FFDCE5", // Light pink
  MODERATE: "#FDECD2", // Light peach/orange
  LOW: "#CCF2EB", // Light teal
};

// Domain score field names used in the Risk Category Summary.
// These keys match fields on the SAR type.
export const DOMAIN_SCORE_KEYS = [
  "criminalHistoryLevel",
  "educationLevelScore",
  "familySocialSupportLevel",
  "neighborhoodLevel",
  "substanceAbuseLevel",
  "peerAssociatesLevel",
  "criminalBehaviorLevel",
  "responsivityLevel",
] as const;

export type DomainScoreKey = (typeof DOMAIN_SCORE_KEYS)[number];
