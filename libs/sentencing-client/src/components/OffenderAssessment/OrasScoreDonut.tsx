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

import { arc } from "d3-shape";
import React from "react";

import { palette } from "~design-system";

import * as Styled from "./OrasScoreDonut.styles";

const DONUT_SIZE = 185;
const DONUT_RADIUS = DONUT_SIZE / 2;
const INNER_RADIUS = DONUT_RADIUS * 0.7;
const SCORE_COLOR = palette.data.forest1; // Data/Forest
const BACKGROUND_COLOR = palette.data.teal1; // Data/Teal

interface OrasScoreDonutProps {
  score: number;
  maxScore?: number;
}

export const OrasScoreDonut: React.FC<OrasScoreDonutProps> = ({
  score,
  maxScore = 9,
}) => {
  // Calculate the angle for the filled portion
  const percentage = Math.min(score / maxScore, 1);
  const endAngle = percentage * 2 * Math.PI;

  // Create arc generators
  const arcGenerator = arc();

  // Background arc (full circle)
  const backgroundArc = arcGenerator({
    innerRadius: INNER_RADIUS,
    outerRadius: DONUT_RADIUS,
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });

  // Foreground arc (score portion)
  const foregroundArc = arcGenerator({
    innerRadius: INNER_RADIUS,
    outerRadius: DONUT_RADIUS,
    startAngle: 0,
    endAngle: endAngle,
  });

  return (
    <Styled.DonutContainer>
      <svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <g transform={`translate(${DONUT_RADIUS}, ${DONUT_RADIUS})`}>
          {/* Background arc */}
          <path d={backgroundArc ?? undefined} fill={BACKGROUND_COLOR} />
          {/* Foreground arc (score) */}
          <path d={foregroundArc ?? undefined} fill={SCORE_COLOR} />
        </g>
      </svg>
      <Styled.CenterText>
        <Styled.RiskLevelLabel>Risk Level</Styled.RiskLevelLabel>
        <Styled.ScoreText>
          {score}/{maxScore}
        </Styled.ScoreText>
      </Styled.CenterText>
    </Styled.DonutContainer>
  );
};
