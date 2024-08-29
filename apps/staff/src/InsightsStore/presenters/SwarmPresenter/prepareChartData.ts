// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ascending } from "d3-array";
import { format } from "d3-format";
import { scaleLinear } from "d3-scale";

import { MetricConfigWithBenchmark, MetricWithConfig } from "../types";
import { calculateSwarm } from "./calculateSwarm";
import {
  HIGHLIGHT_DOT_RADIUS_LG,
  HIGHLIGHT_DOT_RADIUS_SM,
  HIGHLIGHT_MARK_STROKE_WIDTH,
  MARGIN,
  SWARM_AREA_TOP_OFFSET,
  SWARM_DOT_RADIUS_LG,
  SWARM_DOT_RADIUS_SM,
  SWARM_SIZE_BREAKPOINT,
} from "./constants";
import {
  HighlightedDot,
  InputPoint,
  PrepareFn,
  PrepareFnV2,
  ScaleParameter,
} from "./types";

const formatTickLabel = format(".0%");
const formatTargetAndHighlight = format(".1%");
const getHighlightInfoForChartLabel = (
  highlightedDots: HighlightedDot[],
): string => {
  const formattedHighlightValues = highlightedDots.map((dot) =>
    formatTargetAndHighlight(dot.value),
  );
  return formattedHighlightValues.join(", ");
};
/**
 * Shared plot calculations
 */
const calculateSwarmPlotConstants = (
  allValues: number[],
  width: number,
  height: number,
) => {
  // round extrema to the nearest whole percentage point
  const min = Math.floor(allValues[0] * 100) / 100;
  const max = Math.ceil(allValues.slice(-1)[0] * 100) / 100;

  // this is the function that converts rates to pixel values on the X axis
  // we can't serialize the actual scale function over the webworker interface,
  // so we will return its parameters instead
  const scaleDomain: ScaleParameter = [min, max];
  const scaleRange: ScaleParameter = [MARGIN.left, width - MARGIN.right];
  const xScale = scaleLinear().domain(scaleDomain).range(scaleRange);

  const highlightRadius =
    width > SWARM_SIZE_BREAKPOINT
      ? HIGHLIGHT_DOT_RADIUS_LG
      : HIGHLIGHT_DOT_RADIUS_SM;
  const backgroundRadius =
    width > SWARM_SIZE_BREAKPOINT ? SWARM_DOT_RADIUS_LG : SWARM_DOT_RADIUS_SM;

  // swarm positions are relative to vertical center, so the layout will need this
  const centerOfContentArea = SWARM_AREA_TOP_OFFSET + height / 2;
  return {
    min,
    max,
    xScale,
    highlightRadius,
    backgroundRadius,
    centerOfContentArea,
    scaleRange,
    scaleDomain,
  };
};

export const prepareChartData: PrepareFn = (
  metric: MetricWithConfig,
  width: number,
  height: number,
) => {
  const currentMetricData = metric.currentPeriodData;

  const allValues = [
    ...metric.benchmark.latestPeriodValues.map((o) => o.value),
    currentMetricData.metricRate,
  ].sort(ascending);

  const {
    min,
    max,
    xScale,
    scaleRange,
    scaleDomain,
    highlightRadius,
    backgroundRadius,
    centerOfContentArea,
  } = calculateSwarmPlotConstants(allValues, width, height);

  const { swarmPoints } = calculateSwarm(
    [
      ...metric.benchmark.latestPeriodValues.map(
        ({ value, targetStatus }): InputPoint => ({
          position: xScale(value),
          targetStatus,
          radius: backgroundRadius,
          opacity: 0.15,
        }),
      ),
      {
        position: xScale(currentMetricData.metricRate),
        // when calculating the swarm positions, give this point some extra breathing room
        radius: highlightRadius + HIGHLIGHT_MARK_STROKE_WIDTH,
        opacity: 1,
        targetStatus: currentMetricData.status,
        highlight: true,
      },
    ],
    height,
  );

  // screen reader label, for accessibility
  const chartLabel = `Swarm plot of all ${
    metric.config.bodyDisplayName
  }s in the state for ${
    metric.benchmark.caseloadCategory
  } caseloads, highlighting a value of ${formatTargetAndHighlight(
    currentMetricData.metricRate,
  )}, which is far worse than the statewide rate of ${formatTargetAndHighlight(
    metric.benchmark.currentPeriodTarget,
  )}. Other values in the chart range from ${formatTickLabel(
    min,
  )} to ${formatTickLabel(max)}.`;

  return {
    centerOfContentArea,
    chartLabel,
    swarmPoints,
    scaleDomain,
    scaleRange,
    highlightRadius,
    backgroundRadius,
  };
};

export const prepareChartDataV2: PrepareFnV2 = (
  metric: MetricConfigWithBenchmark,
  highlightedDots: HighlightedDot[],
  width: number,
  height: number,
) => {
  const allValues = [
    ...metric.benchmark.latestPeriodValues.map((o) => o.value),
    ...highlightedDots.map((dot) => dot.value),
  ].sort(ascending);

  const {
    min,
    max,
    xScale,
    scaleRange,
    scaleDomain,
    highlightRadius,
    backgroundRadius,
    centerOfContentArea,
  } = calculateSwarmPlotConstants(allValues, width, height);

  const { swarmPoints } = calculateSwarm(
    [
      ...metric.benchmark.latestPeriodValues.map(
        ({ value, targetStatus }): InputPoint => ({
          position: xScale(value),
          targetStatus,
          radius: backgroundRadius,
          opacity: 0.15,
        }),
      ),
      ...highlightedDots.map(
        ({ value }): InputPoint => ({
          position: xScale(value),
          targetStatus: "FAR",
          // when calculating the swarm positions, give these points some extra breathing room
          radius: highlightRadius + HIGHLIGHT_MARK_STROKE_WIDTH,
          opacity: 1,
          highlight: true,
        }),
      ),
    ],
    height,
  );

  // screen reader label, for accessibility
  const chartLabel = `Swarm plot of all ${
    metric.config.bodyDisplayName
  }s in the state for ${
    metric.benchmark.caseloadCategory
  } caseloads, highlighting values of ${getHighlightInfoForChartLabel(highlightedDots)}, which are far worse than the statewide rate of ${formatTargetAndHighlight(
    metric.benchmark.currentPeriodTarget,
  )}. Other values in the chart range from ${formatTickLabel(
    min,
  )} to ${formatTickLabel(max)}.`;

  return {
    centerOfContentArea,
    chartLabel,
    swarmPoints,
    scaleDomain,
    scaleRange,
    highlightRadius,
    backgroundRadius,
  };
};
