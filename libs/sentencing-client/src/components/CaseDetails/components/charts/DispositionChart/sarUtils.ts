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
import { getSubtitleGender } from "../common/utils";

export const BUCKET_TO_RISK_LEVEL: Record<number, string> = {
  0: "low risk",
  1: "moderate risk",
  2: "high risk",
  3: "very high risk",
};

const BUCKET_TO_SUBTITLE_RISK_LEVEL: Record<number, string> = {
  0: "Low risk score",
  1: "Moderate risk score",
  2: "High risk score",
  3: "Very High risk score",
};

export function getSARDispositionChartSubtitle(
  insight: NonNullable<SARInsight>,
): string {
  const { gender, assessmentScoreBucketStart, offense, offenseCategory } =
    insight;
  const genderString = getSubtitleGender(gender);
  const riskString = BUCKET_TO_SUBTITLE_RISK_LEVEL[assessmentScoreBucketStart];
  const offenseString = offenseCategory ?? formatOffenseLabel(offense);
  return [genderString, riskString, offenseString].filter(Boolean).join(", ");
}
