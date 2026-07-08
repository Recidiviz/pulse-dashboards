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
  score: number | null;
  maxScore?: number;
  /**
   * When true and `maxScore` is undefined, treat the max as genuinely unknown:
   * render the denominator as "--" and draw no filled arc (a light,
   * background-only ring) instead of falling back to a default max. Opt-in so
   * existing callers (SAR Builder) keep their current rendering.
   */
  showUnknownMax?: boolean;
}

export const OrasScoreDonut: React.FC<OrasScoreDonutProps> = ({
  score,
  maxScore,
  showUnknownMax = false,
}) => {
  // With an unknown max we can't compute a fraction, so leave the ring empty
  // (light). Otherwise fall back to the historical default of 9 for callers
  // that don't pass a max and haven't opted into the unknown-max treatment.
  const fallbackMax = showUnknownMax ? undefined : 9;
  const effectiveMax = maxScore !== undefined ? maxScore : fallbackMax;

  // Calculate the angle for the filled portion
  const percentage =
    score !== null && effectiveMax !== undefined
      ? Math.min(score / effectiveMax, 1)
      : 0;
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
          {/* Foreground arc (score) — omitted when the max is unknown so the
              ring reads as a single light color. */}
          {score !== null && effectiveMax !== undefined && (
            <path d={foregroundArc ?? undefined} fill={SCORE_COLOR} />
          )}
        </g>
      </svg>
      <Styled.CenterText>
        <Styled.RiskLevelLabel>Risk Level</Styled.RiskLevelLabel>
        <Styled.ScoreText $small={score === null}>
          {score === null
            ? "Score Unavailable"
            : `${score}/${effectiveMax ?? "--"}`}
        </Styled.ScoreText>
      </Styled.CenterText>
    </Styled.DonutContainer>
  );
};
