// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { autoUpdate, flip, offset, useFloating } from "@floating-ui/react-dom";
import { spacing } from "@recidiviz/design-system";
import { ascending } from "d3-array";
import { format } from "d3-format";
import { scaleLinear } from "d3-scale";
import { observer } from "mobx-react-lite";
import { Fragment } from "react";
import { SizeMeProps, withSize } from "react-sizeme";

import { MetricWithConfig } from "../../OutliersStore/presenters/SupervisionOfficersPresenter";
import { calculateSwarm } from "./calculateSwarm";
import {
  GOAL_COLORS,
  HIGHLIGHT_DOT_RADIUS,
  MARGIN,
  MAX_ASPECT_RATIO,
  SWARM_AREA_BOTTOM_OFFSET,
  SWARM_AREA_TOP_OFFSET,
  SWARM_DOT_RADIUS,
  TARGET_LINE_WIDTH,
} from "./constants";
import {
  AxisLabel,
  AxisSpine,
  HIGHLIGHT_MARK_STROKE,
  HighlightLabel,
  Plot,
  PlotWrapper,
  RateHighlightMark,
  TargetLabel,
  TargetLine,
  TickLine,
} from "./styles";
import { SwarmedCircleGroup } from "./SwarmedCircleGroup";
import { InputPoint } from "./types";

const formatTickLabel = format(".0%");
const formatTargetAndHighlight = format(".1%");

function prepareChartData(metric: MetricWithConfig, width: number) {
  const allValues = [
    ...metric.benchmark.latestPeriodValues.map((o) => o.value),
    metric.rate,
  ].sort(ascending);

  // round extrema to the nearest whole percentage point
  const min = Math.floor(allValues[0] * 100) / 100;
  const max = Math.ceil(allValues.slice(-1)[0] * 100) / 100;

  // this is the function that converts rates to pixel values on the X axis
  const xScale = scaleLinear()
    .domain([min, max])
    .range([MARGIN.left, width - MARGIN.right]);

  // value we will use to contstrain the height of the chart
  const maxSwarmHeight =
    width * MAX_ASPECT_RATIO -
    (SWARM_AREA_TOP_OFFSET + SWARM_AREA_BOTTOM_OFFSET);

  const { swarmPoints, swarmSpread } = calculateSwarm(
    [
      ...metric.benchmark.latestPeriodValues.map(
        ({ value, targetStatus }): InputPoint => ({
          position: xScale(value),
          targetStatus,
          radius: SWARM_DOT_RADIUS,
          opacity: 0.15,
        })
      ),
      {
        position: xScale(metric.rate),
        // when calculating the swarm positions, give this point some extra breathing room
        radius: HIGHLIGHT_DOT_RADIUS + HIGHLIGHT_MARK_STROKE.width,
        opacity: 1,
        targetStatus: metric.status,
        highlight: true,
      },
    ],
    maxSwarmHeight
  );

  // round off value to avoid a fractional pixel height
  const chartHeight = Math.ceil(
    SWARM_AREA_TOP_OFFSET + SWARM_AREA_BOTTOM_OFFSET + swarmSpread
  );

  // swarm positions are relative to vertical center, so the layout will need this
  const centerOfContentArea = SWARM_AREA_TOP_OFFSET + swarmSpread / 2;

  // screen reader label, for accessibility
  const chartLabel = `Swarm plot of all ${
    metric.config.bodyDisplayName
  }s in the state for ${
    metric.benchmark.caseloadType
  } caseloads, highlighting a value of ${formatTargetAndHighlight(
    metric.rate
  )}, which is far worse than the statewide rate of ${formatTargetAndHighlight(
    metric.benchmark.currentPeriodTarget
  )}. Other values in the chart range from ${formatTickLabel(
    min
  )} to ${formatTickLabel(max)}.`;

  return { centerOfContentArea, chartHeight, chartLabel, swarmPoints, xScale };
}

// recalculating the swarm may be expensive so we throttle it a bit on resize
const withSizeHOC = withSize({ refreshRate: 128 });

type OutliersSwarmPlotProps = {
  metric: MetricWithConfig;
} & SizeMeProps;

export const OutliersSwarmPlot = withSizeHOC(
  observer(function OutliersSwarmPlot({
    metric,
    size,
  }: OutliersSwarmPlotProps) {
    // extract some nested values from props, for convenience
    const targetRate = metric.benchmark.currentPeriodTarget;
    // should always be defined in practice because we have not disabled the sizeme placeholder
    const width = size.width ?? 0;

    const {
      centerOfContentArea,
      chartHeight,
      chartLabel,
      swarmPoints,
      xScale,
    } = prepareChartData(metric, width);

    const axisPositions = {
      targetStart: MARGIN.top,
      tickStart: MARGIN.top,
      tickEnd: chartHeight - SWARM_AREA_BOTTOM_OFFSET,
      spine: chartHeight - SWARM_AREA_BOTTOM_OFFSET,
      tickLabel: chartHeight - SWARM_AREA_BOTTOM_OFFSET + spacing.xs,
      axisLabel: chartHeight - MARGIN.bottom,
      min: MARGIN.left,
      max: width - MARGIN.right,
      target: xScale(targetRate),
    };

    const highlightLabelProps = useFloating({
      placement: "right",
      middleware: [flip(), offset(5)],
      open: true,
      whileElementsMounted: autoUpdate,
    });

    return (
      <PlotWrapper role="img" aria-label={chartLabel}>
        <Plot height={chartHeight}>
          {/* axis */}
          <AxisSpine
            x1={axisPositions.min}
            x2={axisPositions.max}
            y1={axisPositions.spine}
            y2={axisPositions.spine}
          />
          {xScale.ticks(5).map((tick) => (
            <Fragment key={tick}>
              <AxisLabel
                x={xScale(tick)}
                y={axisPositions.tickLabel}
                textAnchor="middle"
                verticalAnchor="start"
              >
                {formatTickLabel(tick)}
              </AxisLabel>
              <TickLine
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={axisPositions.tickStart}
                y2={axisPositions.spine}
              />
            </Fragment>
          ))}

          {/* target */}
          <TargetLine
            x1={axisPositions.target}
            x2={axisPositions.target}
            y1={axisPositions.targetStart}
            y2={axisPositions.tickEnd}
          />
          <TargetLabel
            dx={TARGET_LINE_WIDTH + spacing.xxs}
            x={axisPositions.target}
            y={axisPositions.targetStart}
            verticalAnchor="start"
          >
            {formatTargetAndHighlight(targetRate)}
          </TargetLabel>

          {/* background swarm */}
          <SwarmedCircleGroup
            swarmPoints={swarmPoints.filter((d) => !d.highlight)}
            transform={`translate(0 ${centerOfContentArea})`}
          />

          {/* highlighted officer */}
          <g transform={`translate(0 ${centerOfContentArea})`}>
            <RateHighlightMark
              r={HIGHLIGHT_DOT_RADIUS}
              // swarm is calculated such that the highlighted officer will be on the center line,
              // so no Y offset is required here
              cx={xScale(metric.rate)}
              fill={GOAL_COLORS[metric.status]}
              ref={highlightLabelProps.refs.setReference}
            />
          </g>
        </Plot>
        <HighlightLabel
          ref={highlightLabelProps.refs.setFloating}
          style={highlightLabelProps.floatingStyles}
        >
          {formatTargetAndHighlight(metric.rate)}
        </HighlightLabel>
      </PlotWrapper>
    );
  })
);
