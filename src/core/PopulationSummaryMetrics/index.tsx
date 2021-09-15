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
import "./PopulationSummaryMetrics.scss";

import { observer } from "mobx-react-lite";
import numeral from "numeral";
import React from "react";

import { formatLargeNumber } from "../../utils";
import PercentDelta from "../controls/PercentDelta";
import { useCoreStore } from "../CoreStoreProvider";
import MetricsCard from "../MetricsCard";
import type { PopulationProjectionTimeSeriesRecord } from "../models/types";

type PropTypes = {
  data: PopulationProjectionTimeSeriesRecord[];
  simulationDate: Date;
  isLoading?: boolean;
  isError?: Error;
};

const PopulationSummaryMetrics: React.FC<PropTypes> = ({
  data,
  simulationDate,
  isError,
  isLoading = false,
}) => {
  const { filtersStore } = useCoreStore();
  const { timePeriodLabel } = filtersStore;

  if (isError) {
    return null;
  }

  const currentData = data.find(
    (d) =>
      d.year === simulationDate.getFullYear() &&
      d.month === simulationDate.getMonth() + 1
  ) as PopulationProjectionTimeSeriesRecord;

  if (!data.length) {
    return null;
  }

  const historicalData = data[0];

  const projectedData = data[data.length - 1];

  const {
    totalPopulation: projectedPopulation,
    totalPopulationMin,
    totalPopulationMax,
  } = projectedData;
  const historicalPercentChange =
    ((currentData.totalPopulation - historicalData.totalPopulation) /
      historicalData.totalPopulation) *
    100;

  const projectedPercentChange =
    ((projectedPopulation - currentData.totalPopulation) /
      currentData.totalPopulation) *
    100;

  return (
    <div className="PopulationSummaryMetrics">
      <MetricsCard heading={`Past ${timePeriodLabel}`}>
        <div className="PopulationSummaryMetrics__metric">
          <div
            className={`PopulationSummaryMetrics__value${
              isLoading ? "--loading" : ""
            }`}
          >
            {formatLargeNumber(currentData.totalPopulation)}
          </div>
        </div>
        <PercentDelta
          className={`PopulationSummaryMetrics__delta${
            isLoading ? "--loading" : ""
          }`}
          value={historicalPercentChange}
          improvesOnIncrease={false}
        />
      </MetricsCard>
      <MetricsCard heading={`Next ${timePeriodLabel}`} subheading="Projected">
        <div className="PopulationSummaryMetrics__metric">
          <div
            className={`PopulationSummaryMetrics__value${
              isLoading ? "--loading" : ""
            }`}
          >
            {formatLargeNumber(projectedPopulation)}
          </div>
          <div
            className={`PopulationSummaryMetrics__min-max${
              isLoading ? "--loading" : ""
            }`}
          >
            <div>
              (
              {[
                numeral(totalPopulationMin).format("0"),
                numeral(totalPopulationMax).format("0"),
              ].join(", ")}
              )
            </div>
          </div>
        </div>
        <PercentDelta
          className={`PopulationSummaryMetrics__delta${
            isLoading ? "--loading" : ""
          }`}
          value={projectedPercentChange}
          improvesOnIncrease={false}
        />
      </MetricsCard>
    </div>
  );
};

export default observer(PopulationSummaryMetrics);
