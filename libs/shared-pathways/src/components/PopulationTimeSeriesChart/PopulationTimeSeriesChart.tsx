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

import OverTimeMetric from "../../metrics/OverTimeMetric";
import { TimeSeriesDataRecord } from "../../types";
import { getRecordDate } from "../../utils";
import {
  ChartPoint,
  getChartBottom,
  getChartTop,
  getDateRange,
  TimeSeriesLine,
} from "./helpers";
import PopulationTimeSeriesBaseChart from "./PopulationTimeSeriesBaseChart";

/** Above this many points the axis labels every other period, not every one. */
const CROWDED_POINT_COUNT = 60;

type CommonProps = {
  title: string;
  subtitle?: string;
};

/** One population over time, which is what most Pathways charts show. */
type SinglePopulationProps = CommonProps & {
  metric: OverTimeMetric;
  data: TimeSeriesDataRecord[];
  series?: never;
};

/** Two or more named populations compared on the same axes. */
type MultiSeriesProps = CommonProps & {
  series: TimeSeriesLine[];
  metric?: never;
  data?: never;
};

type Props = SinglePopulationProps | MultiSeriesProps;

const PopulationTimeSeriesChart: React.FC<Props> = (props) => {
  const { title, subtitle } = props;

  // A chart draws either its own named series or a single population, never
  // both, so the props above keep them apart.
  const { lines, allPoints, longestLineLength } = props.series
    ? {
        lines: props.series,
        allPoints: props.series.flatMap(({ data }) => data),
        longestLineLength: Math.max(
          ...props.series.map(({ data }) => data.length),
          0,
        ),
      }
    : (() => {
        const historicalPopulation: ChartPoint[] = props.data.map((record) => ({
          date: getRecordDate(record),
          value: record.count,
        }));
        return {
          lines: undefined,
          allPoints: historicalPopulation,
          longestLineLength: historicalPopulation.length,
        };
      })();

  const dateSpacing = longestLineLength >= CROWDED_POINT_COUNT ? 2 : 1;

  // Series arrive one line at a time, so scan for the bounds rather than
  // reading the ends of the list. With no points at all, stand in the same
  // far-future date `getDateRange` itself falls back to.
  const timestamps = allPoints.map(({ date }) => date.getTime());
  const noPointsDate = new Date(9999, 11, 31);
  const { beginDate, endDate } = getDateRange(
    timestamps.length ? new Date(Math.min(...timestamps)) : noPointsDate,
    timestamps.length ? new Date(Math.max(...timestamps)) : noPointsDate,
  );

  // Set top of chart to the nearest thousand above the highest point.
  const chartTop = getChartTop(allPoints);
  const chartBottom = getChartBottom(allPoints);

  return (
    <PopulationTimeSeriesBaseChart
      title={title}
      subtitle={subtitle}
      historicalPopulation={lines ? [] : allPoints}
      series={lines}
      chartTop={chartTop}
      chartBottom={chartBottom}
      dateSpacing={dateSpacing}
      beginDate={beginDate}
      endDate={endDate}
    />
  );
};

export default PopulationTimeSeriesChart;
