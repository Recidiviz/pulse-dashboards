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

import { formatOffenseLabel } from "../../../../../../src/utils/utils";
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

export function getSARDispositionChartSubtitle(
  insight: NonNullable<SARInsight>,
): string {
  const { gender, assessmentRiskLevel, offense, offenseCategory } = insight;
  const genderString = getSubtitleGender(gender);
  const riskString = `${RISK_LEVELS[assessmentRiskLevel]} risk score`;
  const offenseString = offenseCategory ?? formatOffenseLabel(offense);
  return [genderString, riskString, offenseString].filter(Boolean).join(", ");
}
