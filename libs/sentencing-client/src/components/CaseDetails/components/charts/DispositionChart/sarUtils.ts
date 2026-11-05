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

import {
  convertDecimalToPercentage,
  formatOffenseLabel,
} from "../../../../../../src/utils/utils";
import { SARInsight } from "../../../../../api";
import {
  RISK_LEVELS,
  RiskLevelKey,
} from "../../../../OffenderAssessment/constants";
import { getSubtitleGender } from "../common/utils";

/** Returns riskLevel as it reads mid-sentence, e.g. "moderate risk". */
export function getRiskLevelDescription(riskLevel: RiskLevelKey): string {
  return `${RISK_LEVELS[riskLevel].toLowerCase()} risk`;
}

/** Returns the insight chip label for riskLevel, e.g. "Moderate Risk Score". */
export function getRiskChipLabel(riskLevel: RiskLevelKey): string {
  return `${RISK_LEVELS[riskLevel]} Risk Score`;
}

/**
 * Returns a disposition share as display text without the "%" sign, e.g.
 * 0.42 → "42". A non-zero share that would round to 0 gets one decimal place
 * so it never reads as zero: 0.004 → "0.4", and anything below 0.0005 →
 * "<0.1".
 */
export function formatSARDispositionPercentage(decimal: number): string {
  const wholePct = convertDecimalToPercentage(decimal);
  if (wholePct >= 1) return String(wholePct);
  const pct = decimal * 100;
  return pct >= 0.05 ? pct.toFixed(1) : "<0.1";
}

export function getSARDispositionChartSubtitle(
  insight: NonNullable<SARInsight>,
): string {
  const { gender, assessmentRiskLevel, offense } = insight;
  const genderString = getSubtitleGender(gender);
  const riskString = `${RISK_LEVELS[assessmentRiskLevel]} risk score`;
  const offenseString = formatOffenseLabel(offense);
  return [genderString, riskString, offenseString].filter(Boolean).join(", ");
}
