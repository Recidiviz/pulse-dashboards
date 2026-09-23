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

import React from "react";

import { Client } from "../../api";
import { GenderToDisplayName } from "../CaseDetails/constants";
import { RISK_COLORS } from "./constants";
import * as Styled from "./RiskScoreChip.styles";
import {
  deriveStatic99RRiskCategory,
  STATIC_99R_INTRO,
  STATIC_99R_RISK_CATEGORY_LABELS,
  STATIC_99R_RISK_CATEGORY_TO_RISK_LEVEL,
} from "./utils";

interface Static99RReportTextProps {
  offenderName: string;
  gender: Client["gender"] | null | undefined;
  score: number | null;
}

/**
 * Static-99R report note text. Reuses the same offender name and gender that
 * feed the Insights footnote, but the risk category is derived from this
 * case's own Static-99R score (see `deriveStatic99RRiskCategory`), not from
 * the client's ORAS risk bucket.
 * When there's no score on file, only the general instrument description is
 * shown.
 */
export const Static99RReportText: React.FC<Static99RReportTextProps> = ({
  offenderName,
  gender,
  score,
}) => {
  if (score == null) return <>{STATIC_99R_INTRO}</>;

  const riskCategory = deriveStatic99RRiskCategory(score);
  const riskLevel = STATIC_99R_RISK_CATEGORY_TO_RISK_LEVEL[riskCategory];
  const color = RISK_COLORS[riskLevel];
  const label = STATIC_99R_RISK_CATEGORY_LABELS[riskCategory];
  const genderAdjective = gender
    ? GenderToDisplayName[gender].toLowerCase()
    : "adult";

  return (
    <>
      {STATIC_99R_INTRO} {offenderName} scored{" "}
      <Styled.Chip color={color}>{score}</Styled.Chip> on this risk assessment
      instrument. Based upon the Static 99R score, this places {offenderName} in
      the <Styled.Chip color={color}>{label} Risk</Styled.Chip> category
      relative to other {genderAdjective} sex offenders.
    </>
  );
};
