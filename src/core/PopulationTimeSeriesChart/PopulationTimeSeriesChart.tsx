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

import { useCoreStore } from "../CoreStoreProvider";
import PopulationOverTimeMetric from "../models/PrisonPopulationOverTimeMetric";
import { PrisonPopulationTimeSeriesRecord } from "../models/types";
import { getRecordDate } from "../models/utils";
import withMetricHydrator from "../withMetricHydrator";
import {
  getChartTop,
  getDateRange,
  getDateSpacing,
  MonthOptions,
} from "./helpers";
import PopulationTimeSeriesBaseChart from "./PopulationTimeSeriesBaseChart";

type Props = {
  metric: PopulationOverTimeMetric;
  title: string;
  data: PrisonPopulationTimeSeriesRecord[];
};

const PopulationTimeSeriesChart: React.FC<Props> = ({
  title,
  data,
  metric,
}) => {
  const { filtersStore } = useCoreStore();

  const timePeriod: MonthOptions = parseInt(
    // the timePeriod filter will only ever be single-select so always use the 0 index
    filtersStore.filters.timePeriod[0]
  ) as MonthOptions;

  const dateSpacing = Math.ceil(getDateSpacing(timePeriod) / 2);

  const historicalPopulation = data.map(
    (d: PrisonPopulationTimeSeriesRecord) => ({
      date: getRecordDate(d),
      value: d.count,
    })
  );

  const { beginDate, endDate } = getDateRange(
    historicalPopulation[0]?.date,
    historicalPopulation.slice(-1)[0]?.date,
    timePeriod
  );

  // set top of chart to the nearest thousand above the highest historical point
  const chartTop = getChartTop(historicalPopulation);

  return (
    <PopulationTimeSeriesBaseChart
      title={title}
      historicalPopulation={historicalPopulation}
      chartTop={chartTop}
      dateSpacing={dateSpacing}
      beginDate={beginDate}
      endDate={endDate}
    />
  );
};

export default withMetricHydrator(observer(PopulationTimeSeriesChart));
