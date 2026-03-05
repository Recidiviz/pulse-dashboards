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

import {
  type ChartPoint,
  getRecordDate,
  PopulationProjectionTimeSeriesRecord,
} from "~shared-pathways";

import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";

export const prepareData = (
  metric: PopulationProjectionOverTimeMetric,
  data: PopulationProjectionTimeSeriesRecord[],
): {
  historicalPopulation: ChartPoint[];
  projectedPopulation: ChartPoint[];
  uncertainty: ChartPoint[];
} => {
  let historicalPopulation: ChartPoint[] = [];
  let projectedPopulation: ChartPoint[] = [];
  let uncertainty: ChartPoint[] = [];

  historicalPopulation = data
    .filter((d) => d.simulationTag === "HISTORICAL")
    .map((d) => ({
      date: getRecordDate(d),
      value: d.totalPopulation,
    }));

  projectedPopulation = historicalPopulation.slice(-1).concat(
    data
      .filter((d) => d.simulationTag === "BASELINE")
      .map((d) => ({
        date: getRecordDate(d),
        value: d.totalPopulation,
        lowerBound: d.totalPopulationMin,
        upperBound: d.totalPopulationMax,
      })),
  );

  uncertainty = [
    historicalPopulation[historicalPopulation.length - 1],
    ...data
      .filter((d) => d.simulationTag !== "HISTORICAL")
      .map((d) => ({ date: getRecordDate(d), value: d.totalPopulationMax })),
    ...data
      .filter((d) => d.simulationTag !== "HISTORICAL")
      .map((d) => ({ date: getRecordDate(d), value: d.totalPopulationMin }))
      .reverse(),
    historicalPopulation[historicalPopulation.length - 1],
  ];

  return { historicalPopulation, projectedPopulation, uncertainty };
};
