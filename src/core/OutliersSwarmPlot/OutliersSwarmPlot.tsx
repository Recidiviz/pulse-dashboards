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

import { Loading, spacing } from "@recidiviz/design-system";
import { format } from "d3-format";
import { scaleLinear } from "d3-scale";
import { observer } from "mobx-react-lite";
import { Fragment } from "react";

import {
  MARGIN,
  SWARM_AREA_BOTTOM_OFFSET,
} from "../../OutliersStore/presenters/SwarmPresenter/constants";
import { TARGET_LINE_WIDTH } from "./constants";
import { HighlightedPoint } from "./HighlightedPoint";
import {
  AxisLabel,
  AxisSpine,
  Plot,
  PlotWrapper,
  TargetLabel,
  TargetLine,
  TickLine,
} from "./styles";
import { SwarmedCircleGroup } from "./SwarmedCircleGroup";
import { OutliersSwarmPlotWrappedProps } from "./types";
import { formatTargetAndHighlight } from "./utils";

const formatTickLabel = format(".0%");

export const OutliersSwarmPlotWrapped = observer(
  function OutliersSwarmPlotWrapped({
    presenter,
  }: OutliersSwarmPlotWrappedProps) {
    const {
      width,
      chartData,
      isLoading,
      metric: {
        currentPeriodData: currentMetricData,
        benchmark: { currentPeriodTarget: targetRate },
      },
    } = presenter;

    if (isLoading) return <Loading />;

    if (!chartData) return null;

    const {
      centerOfContentArea,
      chartHeight,
      chartLabel,
      swarmPoints,
      scaleDomain,
      scaleRange,
    } = chartData;

    const xScale = scaleLinear().domain(scaleDomain).range(scaleRange);

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
          <g
            transform={`translate(${xScale(
              currentMetricData.metricRate
            )} ${centerOfContentArea})`}
          >
            <HighlightedPoint currentMetricData={currentMetricData} />
          </g>
        </Plot>
      </PlotWrapper>
    );
  }
);
