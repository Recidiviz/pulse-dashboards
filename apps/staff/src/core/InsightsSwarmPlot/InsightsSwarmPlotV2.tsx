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

import { Loading, palette, spacing } from "@recidiviz/design-system";
import { scaleLinear } from "d3-scale";
import { observer } from "mobx-react-lite";

import { useFeatureVariants } from "../../components/StoreProvider";
import {
  MARGIN,
  SWARM_AREA_BOTTOM_OFFSET,
} from "../../InsightsStore/presenters/SwarmPresenter/constants";
import { TARGET_LINE_WIDTH } from "./constants";
import { Plot, PlotWrapper, TargetLabel, TargetLine } from "./styles";
import { SwarmedCircleGroup } from "./SwarmedCircleGroup";
import { SwarmPlotHighlightedDot } from "./SwarmPlotHighlightedDot";
import { InsightsSwarmPlotWrappedProps } from "./types";
import { formatTargetAndHighlight } from "./utils";

export const InsightsSwarmPlotV2 = observer(function InsightsSwarmPlotV2({
  presenter,
}: InsightsSwarmPlotWrappedProps) {
  const { supervisorHomepage } = useFeatureVariants();

  const {
    width,
    chartHeight,
    chartData,
    isLoading,
    highlightedDots,
    metric: {
      benchmark: { currentPeriodTarget: targetRate },
    },
  } = presenter;

  if (isLoading) return <Loading />;

  if (!chartData) return null;

  const {
    centerOfContentArea,
    chartLabel,
    swarmPoints,
    scaleDomain,
    scaleRange,
  } = chartData;

  const xScale = scaleLinear().domain(scaleDomain).range(scaleRange);
  const yScale = scaleLinear()
    .domain([0, chartHeight])
    .range([centerOfContentArea - 30, centerOfContentArea + 30]);

  const axisPositions = {
    targetStart: MARGIN.top,
    tickEnd: chartHeight - SWARM_AREA_BOTTOM_OFFSET,
    target: targetRate && xScale(targetRate),
  };

  return (
    <PlotWrapper role="img" aria-label={chartLabel}>
      <Plot height={chartHeight}>
        {/* target */}
        {targetRate && (
          <>
            <TargetLine
              supervisorHomepage={!!supervisorHomepage}
              x1={axisPositions.target}
              x2={axisPositions.target}
              y1={axisPositions.targetStart}
              y2={axisPositions.tickEnd}
            />
            <TargetLabel
              supervisorHomepage={!!supervisorHomepage}
              dx={TARGET_LINE_WIDTH + spacing.sm}
              x={axisPositions.target}
              y={axisPositions.targetStart}
              verticalAnchor="start"
            >
              {`State-wide Rate: ${formatTargetAndHighlight(targetRate)}`}
            </TargetLabel>
          </>
        )}

        {/* background swarm */}
        <SwarmedCircleGroup
          swarmPoints={swarmPoints.filter((d) => !d.highlight)}
          pointColor={palette.data.teal2}
          transform={`translate(0 ${centerOfContentArea})`}
        />

        {/* highlighted officer */}
        {highlightedDots.map((dot, index) => {
          return (
            <SwarmPlotHighlightedDot
              key={dot.value}
              data={dot}
              cx={xScale(dot.value)}
              cy={yScale(index * centerOfContentArea)}
              plotWidth={width}
            />
          );
        })}
      </Plot>
    </PlotWrapper>
  );
});