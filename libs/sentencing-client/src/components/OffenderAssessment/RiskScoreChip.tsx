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

import React from "react";

import { calculateRiskLevel, RISK_COLORS, RISK_LEVELS } from "./constants";
import * as Styled from "./RiskScoreChip.styles";

// Maps stored DomainRiskLevel enum values (Prisma) to frontend RISK_LEVELS keys
// DomainRiskLevel enum uses LOW/MODERATE/HIGH which matches RISK_LEVELS keys
function mapStoredRiskLevel(riskLevel: string): keyof typeof RISK_LEVELS {
  return riskLevel as keyof typeof RISK_LEVELS;
}

interface RiskScoreChipProps {
  score: number;
  maxScore?: number;
  riskLevel?: string | null; // Stored DomainRiskLevel from source data
}

export const RiskScoreChip: React.FC<RiskScoreChipProps> = ({
  score,
  maxScore,
  riskLevel,
}) => {
  const level = riskLevel
    ? mapStoredRiskLevel(riskLevel)
    : calculateRiskLevel(score);
  const label = RISK_LEVELS[level];
  const color = RISK_COLORS[level];
  const scoreDisplay = maxScore !== undefined ? `${score}/${maxScore}` : score;

  return (
    <Styled.Chip color={color}>
      {label} Risk ({scoreDisplay})
    </Styled.Chip>
  );
};
