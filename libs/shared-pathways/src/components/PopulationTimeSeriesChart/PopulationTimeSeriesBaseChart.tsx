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

import { scaleTime } from "d3-scale";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";
import styled, { useTheme } from "styled-components";

import { PathwaysTheme } from "../PathwaysTheme";
import VizPathways from "../VizPathways";
import { ChartPoint, formatMonthAndYear, getTickValues } from "./helpers";
import PopulationTimeSeriesTooltip from "./PopulationTimeSeriesTooltip";

const ChartWrapper = styled(VizPathways)`
  .PopulationTimeSeriesChart__projectedLine {
    stroke: ${({ theme }) => theme.palette.data.indigo1};
    stroke-width: 2;
    stroke-dasharray: 2 3;
  }

  .projection-area-label {
    fill: ${({ theme }) => theme.palette.slate80};
  }

  .projection-area {
    fill: ${({ theme }) => theme.palette.marble4};
    fill-opacity: 0;
  }
`;

type PlotLine = {
  data: ChartPoint[];
  class: string;
};

type Props = {
  title: string;
  subtitle?: string;
  historicalPopulation: ChartPoint[];
  projectedPopulation?: ChartPoint[];
  chartTop: number;
  chartBottom: number;
  dateSpacing: number;
  beginDate: Date;
  endDate: Date;
  [k: string]: unknown;
};

const PopulationTimeSeriesBaseChart: React.FC<Props> = ({
  title,
  subtitle,
  historicalPopulation,
  projectedPopulation,
  chartTop,
  chartBottom,
  dateSpacing,
  beginDate,
  endDate,
  ...chartProps
}) => {
  const theme = useTheme() as PathwaysTheme;
  const charWidth = theme.typography.axisLabel.charWidth;

  const historicalLine = {
    class: "VizPathways__historicalLine",
    data: historicalPopulation,
  };

  const projectedLine = {
    class: "PopulationTimeSeriesChart__projectedLine",
    data: projectedPopulation,
  };

  const tickValues = projectedPopulation
    ? getTickValues(
        historicalPopulation.concat(projectedPopulation.slice(1)), // don't double-draw center date
        dateSpacing,
      )
    : getTickValues(historicalPopulation, dateSpacing);

  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveXYFrame
        responsiveWidth
        summaryDataAccessor="data"
        summaryClass="projection-area"
        hoverAnnotation
        // eslint-disable-next-line react/no-unstable-nested-components
        tooltipContent={(d: ChartPoint) => (
          <PopulationTimeSeriesTooltip d={d} />
        )}
        // @ts-expect-error semiotic types
        lines={
          projectedPopulation
            ? [historicalLine, projectedLine]
            : [historicalLine]
        }
        lineDataAccessor="data"
        // @ts-expect-error semiotic types
        lineClass={(l: PlotLine) => l.class}
        // @ts-expect-error semiotic types
        xScaleType={scaleTime()}
        xAccessor="date"
        yAccessor="value"
        size={[558, 558]}
        margin={{
          left: (chartTop.toString().length + 1.5) * charWidth,
          bottom: 96,
          right: 50,
          top: 56,
        }}
        // @ts-expect-error semiotic types
        xExtent={[beginDate, endDate]}
        yExtent={[chartBottom, chartTop]}
        showLinePoints
        pointClass="VizPathways__point"
        axes={[
          { orient: "left", tickFormat: (n: number) => n.toLocaleString() },
          {
            orient: "bottom",
            // @ts-expect-error semiotic types
            tickValues,
            tickFormat: (d: Date) => formatMonthAndYear(d),
          },
        ]}
        {...chartProps}
      />
      <div id="chart-description" className="sr-only">
        A line chart showing the population over time.
      </div>
      <div id="chart-instructions" className="sr-only">
        Press tab to access the line, and tab again to access the points. Use
        arrow keys to hear more information about each point.
      </div>
    </ChartWrapper>
  );
};

export default PopulationTimeSeriesBaseChart;
