/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import "./PopulationTimeSeriesChart.scss";

import { scaleTime } from "d3-scale";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";

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
  dateSpacing,
  beginDate,
  endDate,
  ...chartProps
}) => {
  const historicalLine = {
    class: "PopulationTimeSeriesChart__historicalLine",
    data: historicalPopulation,
  };

  const projectedLine = {
    class: "PopulationTimeSeriesChart__projectedLine",
    data: projectedPopulation,
  };

  const tickValues = projectedPopulation
    ? getTickValues(
        historicalPopulation.concat(projectedPopulation.slice(1)), // don't double-draw center date
        dateSpacing
      )
    : getTickValues(historicalPopulation, dateSpacing);

  return (
    <div className="PopulationTimeSeriesChart">
      <div className="PopulationTimeSeriesChart__header">
        <div className="PopulationTimeSeriesChart__title">{title}</div>
      </div>
      <ResponsiveXYFrame
        responsiveWidth
        summaryDataAccessor="data"
        summaryClass="projection-area"
        hoverAnnotation
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
        margin={{ left: 104, bottom: 96, right: 50, top: 56 }}
        // @ts-ignore
        xExtent={[beginDate, endDate]}
        yExtent={[0, chartTop]}
        showLinePoints
        pointClass="PopulationTimeSeriesChart__point"
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
    </div>
  );
};

export default PopulationTimeSeriesBaseChart;
