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

import "../VizPathways.scss";
import "./PopulationTimeSeriesChart.scss";

import { scaleTime } from "d3-scale";
import { observer } from "mobx-react-lite";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";

import { useCoreStore } from "../CoreStoreProvider";
import VizPathways from "../VizPathways";
import { ChartPoint, formatMonthAndYear, getTickValues } from "./helpers";
import PopulationTimeSeriesTooltip from "./PopulationTimeSeriesTooltip";

type PlotLine = {
  data: ChartPoint[];
  class: string;
};

type Props = {
  title: string;
  historicalPopulation: ChartPoint[];
  projectedPopulation?: ChartPoint[];
  chartTop: number;
  dateSpacing: number;
  beginDate: Date;
  endDate: Date;
  [k: string]: any;
};

const PopulationTimeSeriesBaseChart: React.FC<Props> = ({
  title,
  historicalPopulation,
  projectedPopulation,
  chartTop,
  chartBottom,
  dateSpacing,
  beginDate,
  endDate,
  ...chartProps
}) => {
  const { filtersStore } = useCoreStore();
  const { filtersDescription } = filtersStore;

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
    <VizPathways
      className="PopulationTimeSeriesChart"
      title={title}
      subtitle={filtersDescription}
    >
      <ResponsiveXYFrame
        responsiveWidth
        summaryDataAccessor="data"
        summaryClass="projection-area"
        hoverAnnotation
        // eslint-disable-next-line react/no-unstable-nested-components
        tooltipContent={(d: any) => <PopulationTimeSeriesTooltip d={d} />}
        // @ts-ignore
        lines={
          projectedPopulation
            ? [historicalLine, projectedLine]
            : [historicalLine]
        }
        lineDataAccessor="data"
        // @ts-ignore
        lineClass={(l: PlotLine) => l.class}
        // @ts-ignore
        xScaleType={scaleTime()}
        xAccessor="date"
        yAccessor="value"
        size={[558, 558]}
        margin={{
          left: (chartTop.toString().length + 1.5) * 10,
          bottom: 96,
          right: 50,
          top: 56,
        }}
        // @ts-ignore
        xExtent={[beginDate, endDate]}
        yExtent={[chartBottom, chartTop]}
        showLinePoints
        pointClass="VizPathways__point"
        axes={[
          { orient: "left", tickFormat: (n: number) => n.toLocaleString() },
          {
            orient: "bottom",
            // @ts-ignore
            tickValues,
            tickFormat: (d: Date) => formatMonthAndYear(d),
          },
        ]}
        {...chartProps}
      />
    </VizPathways>
  );
};

export default observer(PopulationTimeSeriesBaseChart);
