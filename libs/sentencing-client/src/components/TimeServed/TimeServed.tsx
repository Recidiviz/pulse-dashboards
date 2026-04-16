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

import {
  computeAvgTimeServedYears,
  formatTimeServedPct,
} from "../../utils/utils";
import * as Styled from "../Summary/SentencingAssessmentReport.styles";

const CHART_COLOR = "rgba(0, 0, 0, 0.30)";
const LABEL_FONT_SIZE = 11;
const LINE_HEIGHT = 14;

interface TimeServedProps {
  avgSentenceLengthYears: number;
  /** Percentage of sentence served (0–100), as returned by BigQuery avg_pct_served. */
  avgPctServed: number;
  /** Bar fill height in px. Defaults to 31 (SAR PDF). Pass 100 for CaseDetails. */
  barHeight?: number;
}

export const TimeServed: React.FC<TimeServedProps> = ({
  avgSentenceLengthYears,
  avgPctServed,
  barHeight = 31,
}) => {
  const avgTimeServedYears = computeAvgTimeServedYears(
    avgPctServed,
    avgSentenceLengthYears,
  );
  const pct = formatTimeServedPct(avgPctServed);
  const filledPct = `${avgPctServed}%`;

  const labelAboveY = LABEL_FONT_SIZE;
  const barY = labelAboveY + 6;
  const barMidY = barY + barHeight / 2;
  const labelBelowY1 = barY + barHeight + LINE_HEIGHT;
  const labelBelowY2 = labelBelowY1 + LINE_HEIGHT;
  const svgHeight = labelBelowY2 + 4;

  return (
    <Styled.TimeServedSVG height={svgHeight}>
      {/* Labels above bar */}
      <text
        x="0"
        y={labelAboveY}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="start"
        fill="black"
      >
        Start
      </text>
      <text
        x="100%"
        y={labelAboveY}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="end"
        fill="black"
      >
        End
      </text>

      {/* Filled (served) rect */}
      <rect
        x="0"
        y={barY}
        width={filledPct}
        height={barHeight}
        fill={CHART_COLOR}
      />
      {/* 3px black borders on left and right edges of the filled rect */}
      <line
        x1="0"
        y1={barY}
        x2="0"
        y2={barY + barHeight}
        stroke="black"
        strokeWidth={3}
      />
      <line
        x1={filledPct}
        y1={barY}
        x2={filledPct}
        y2={barY + barHeight}
        stroke="black"
        strokeWidth={3}
      />

      {/* Dotted line for unserved portion — 2px, centered on bar mid */}
      <line
        x1={filledPct}
        y1={barMidY}
        x2="100%"
        y2={barMidY}
        stroke={CHART_COLOR}
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      {/* Vertical end-cap at full sentence length */}
      <line
        x1="100%"
        y1={barY}
        x2="100%"
        y2={barY + barHeight}
        stroke="black"
        strokeWidth={2}
      />

      {/* Labels below — served endpoint */}
      <text
        x={filledPct}
        y={labelBelowY1}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="middle"
        fill="black"
      >
        {avgTimeServedYears} years
      </text>
      <text
        x={filledPct}
        y={labelBelowY2}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="middle"
        fill="black"
      >
        ({pct}%)
      </text>

      {/* Labels below — full sentence endpoint */}
      <text
        x="100%"
        y={labelBelowY1}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="end"
        fill="black"
      >
        {avgSentenceLengthYears} years
      </text>
      <text
        x="100%"
        y={labelBelowY2}
        fontSize={LABEL_FONT_SIZE}
        textAnchor="end"
        fill="black"
      >
        (100%)
      </text>
    </Styled.TimeServedSVG>
  );
};
