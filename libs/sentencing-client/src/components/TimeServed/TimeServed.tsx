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

import { formatTimeServedPct } from "../../utils/utils";
import * as Styled from "../Summary/SentencingAssessmentReport.styles";

const DEFAULT_CHART_COLOR = "rgba(0, 0, 0, 0.30)";
const LABEL_FONT_SIZE = 11;
const LINE_HEIGHT = 14;

interface TimeServedProps {
  /** Percentage of sentence served (0–100), as returned by BigQuery avg_pct_served. */
  avgPctServed: number;
  /** Bar fill height in px. Defaults to 31 (SAR PDF). Pass 100 for CaseDetails. */
  barHeight?: number;
  /** Fill color for the served portion rect. Defaults to rgba(0,0,0,0.30). */
  fillColor?: string;
  /** Color for all SVG text labels. Defaults to "black". */
  labelColor?: string;
  /** Style applied to all SVG text labels. Defaults to 11px. */
  labelStyle?: React.CSSProperties;
  /**
   * When false, the "Start"/"End" labels are omitted from above the bar and
   * "Start" is rendered below-left instead (panel view). Defaults to true (PDF).
   */
  showLabelsAbove?: boolean;
}

export const TimeServed: React.FC<TimeServedProps> = ({
  avgPctServed,
  barHeight = 31,
  fillColor,
  labelColor = "black",
  labelStyle = { fontSize: `${LABEL_FONT_SIZE}px` },
  showLabelsAbove = true,
}) => {
  const chartColor = fillColor ?? DEFAULT_CHART_COLOR;
  const pct = formatTimeServedPct(avgPctServed);
  const filledPct = `${avgPctServed}%`;

  const labelAboveY = LABEL_FONT_SIZE;
  const barY = showLabelsAbove ? labelAboveY + 6 : 0;
  const barMidY = barY + barHeight / 2;
  const labelBelowY = barY + barHeight + LINE_HEIGHT;
  const svgHeight = labelBelowY + 4;

  return (
    <Styled.TimeServedSVG height={svgHeight}>
      {/* Labels above bar (PDF mode only) */}
      {showLabelsAbove && (
        <>
          <text
            x="0"
            y={labelAboveY}
            textAnchor="start"
            fill={labelColor}
            style={labelStyle}
          >
            Start
          </text>
          <text
            x="100%"
            y={labelAboveY}
            textAnchor="end"
            fill={labelColor}
            style={labelStyle}
          >
            End
          </text>
        </>
      )}

      {/* Filled (served) rect */}
      <rect
        x="0"
        y={barY}
        width={filledPct}
        height={barHeight}
        fill={chartColor}
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

      {/* Dotted line for unserved portion — always black, 2px, centered on bar mid */}
      <line
        x1={filledPct}
        y1={barMidY}
        x2="100%"
        y2={barMidY}
        stroke="black"
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

      {/* "Start" label below-left (panel mode only) */}
      {!showLabelsAbove && (
        <text
          x="0"
          y={labelBelowY}
          textAnchor="start"
          fill={labelColor}
          style={labelStyle}
        >
          Start
        </text>
      )}

      {/* Label below — served endpoint */}
      <text
        x={filledPct}
        y={labelBelowY}
        textAnchor="middle"
        fill={labelColor}
        style={labelStyle}
      >
        {pct}%
      </text>

      {/* Label below — full sentence endpoint */}
      <text
        x="100%"
        y={labelBelowY}
        textAnchor="end"
        fill={labelColor}
        style={labelStyle}
      >
        100%
      </text>
    </Styled.TimeServedSVG>
  );
};
