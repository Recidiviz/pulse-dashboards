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

import { useCallback } from "react";
import useMeasure from "react-use-measure";
import { ResponsiveXYFrame } from "semiotic";

import { ParoleRiskTool } from "~datatypes";
import { palette } from "~design-system";

import { EdgeAwareTooltip } from "./EdgeAwareTooltip";
import {
  ChartColumn,
  ChartTitle,
  ChartWrapper,
  DEFAULT_CHART_HEIGHT,
} from "./RiskAssessmentSection.styles";
import { formatDateShort } from "./RiskAssessmentSection.utils";
import { formatDate } from "./shared";

export type RiskTrajectoryLine = {
  tool: ParoleRiskTool;
  color: string;
  coordinates: Array<{ date: Date; value: number }>;
};

// The trajectory line chart: raw score (scaled to `yMax`) for tenants with a
// custom riskAssessmentConfig, percent-of-max for everyone else -- see
// RiskAssessmentSection for how `trajectoryLines`' values are derived to
// match whichever mode `hasCustomConfig` selects.
export function RiskTrajectoryChart({
  trajectoryLines,
  hasCustomConfig,
  yMax,
  selectedTool,
}: {
  trajectoryLines: Array<RiskTrajectoryLine>;
  hasCustomConfig: boolean;
  yMax: number;
  selectedTool: ParoleRiskTool | null;
}) {
  const [lineChartRef, lineChartBounds] = useMeasure();

  const renderOverviewTrendTooltip = useCallback(
    (d: {
      points: Array<{ data: { date: Date; value: number } }>;
      parentLine: { tool: string; color: string };
    }): JSX.Element | null => {
      const point = d.points[0]?.data;
      if (!point) return null;
      return (
        <EdgeAwareTooltip
          containerBounds={lineChartBounds}
          resetKey={`${d.parentLine.tool}-${point.date.getTime()}`}
        >
          <div>{formatDate(point.date)}</div>
          <div>
            {d.parentLine.tool}: {Math.round(point.value)}
            {hasCustomConfig ? "" : "%"}
          </div>
        </EdgeAwareTooltip>
      );
    },
    [hasCustomConfig, lineChartBounds],
  );

  // A per-line summary of the most recent point, for the aria-label below --
  // the tooltip already surfaces the same "value as of date" pairing per
  // point on hover, so this mirrors that rather than inventing a new format.
  // Labeled "latest score" rather than "trajectory": each line's individual
  // values don't encode movement on their own, only the plotted shape does.
  const latestScoreSummary = trajectoryLines
    .map((line) => {
      const latest = line.coordinates.at(-1);
      if (!latest) return `${line.tool}: no data`;
      const suffix = hasCustomConfig ? "" : "%";
      const count = line.coordinates.length;
      return `${line.tool} ${Math.round(latest.value)}${suffix} as of ${formatDate(latest.date)} (${count} assessment${count === 1 ? "" : "s"})`;
    })
    .join("; ");

  return (
    <ChartColumn>
      <ChartTitle>
        {hasCustomConfig
          ? `Trajectory out of a maximum of ${yMax} points`
          : "Trajectory - percent of max scores"}
      </ChartTitle>
      {trajectoryLines.length > 0 && (
        <ChartWrapper
          ref={lineChartRef}
          role="img"
          aria-label={`Latest risk score: ${latestScoreSummary}`}
        >
          {lineChartBounds.width > 0 && (
            <ResponsiveXYFrame
              // Remounts on tool switch so semiotic doesn't try to animate
              // between two unrelated line sets, which briefly overlaps them.
              key={selectedTool ?? "aggregate"}
              responsiveWidth={false}
              optimizeCustomTooltipPosition
              size={[
                lineChartBounds.width,
                lineChartBounds.height || DEFAULT_CHART_HEIGHT,
              ]}
              lines={trajectoryLines.map((l) => ({
                color: l.color,
                tool: l.tool,
                coordinates: l.coordinates,
              }))}
              lineStyle={(l: RiskTrajectoryLine) => ({
                stroke: l.color,
                strokeWidth: 2,
              })}
              xAccessor="date"
              yAccessor="value"
              yExtent={hasCustomConfig ? [0, yMax] : [0, 100]}
              margin={{ left: 48, right: 20, top: 10, bottom: 30 }}
              showLinePoints
              pointStyle={(p: {
                parentLine?: { color: string };
                color?: string;
              }) => ({
                r: 5,
                fill: p.parentLine?.color ?? p.color,
                stroke: palette.white,
                strokeWidth: 2,
              })}
              axes={[
                {
                  orient: "left",
                  ticks: 5,
                  tickFormat: (n: number) =>
                    hasCustomConfig ? `${n}` : `${n}%`,
                  label: hasCustomConfig
                    ? {
                        name: selectedTool ? `${selectedTool} Score` : "Score",
                        locationDistance: 35,
                      }
                    : undefined,
                },
                {
                  orient: "bottom",
                  ticks: 4,
                  tickFormat: (d: Date) => formatDateShort(d),
                },
              ]}
              hoverAnnotation
              tooltipContent={renderOverviewTrendTooltip}
            />
          )}
        </ChartWrapper>
      )}
    </ChartColumn>
  );
}
