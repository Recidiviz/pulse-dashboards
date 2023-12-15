// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import React from "react";

import OverTimeMetric from "../models/OverTimeMetric";
import { TimeSeriesDataRecord } from "../models/types";
import { getRecordDate } from "../models/utils";
import withPathwaysMetricHelpers from "../PathwaysMetricHelpers/withPathwaysMetricHelpers";
import { getChartBottom, getChartTop, getDateRange } from "./helpers";
import PopulationTimeSeriesBaseChart from "./PopulationTimeSeriesBaseChart";

type Props = {
  metric: OverTimeMetric;
  title: string;
  data: TimeSeriesDataRecord[];
};

const PopulationTimeSeriesChart: React.FC<Props> = ({
  title,
  data,
  metric,
}) => {
  const dateSpacing = data.length >= 60 ? 2 : 1;

  const historicalPopulation = data.map((d: TimeSeriesDataRecord) => ({
    date: getRecordDate(d),
    value: d.count,
  }));

  const { beginDate, endDate } = getDateRange(
    historicalPopulation[0]?.date,
    historicalPopulation.slice(-1)[0]?.date
  );

  // set top of chart to the nearest thousand above the highest historical point
  const chartTop = getChartTop(historicalPopulation);
  const chartBottom = getChartBottom(historicalPopulation);

  return (
    <PopulationTimeSeriesBaseChart
      title={title}
      historicalPopulation={historicalPopulation}
      chartTop={chartTop}
      chartBottom={chartBottom}
      dateSpacing={dateSpacing}
      beginDate={beginDate}
      endDate={endDate}
    />
  );
};

export default withPathwaysMetricHelpers(observer(PopulationTimeSeriesChart));
