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

import { formatDate } from "../../utils";
import PopulationOverTimeMetric from "../models/PopulationOverTimeMetric";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import ProjectionsMetrics from "../models/ProjectionsMetrics";
import {
  PopulationProjectionTimeSeriesRecord,
  PopulationTimeSeriesRecord,
} from "../models/types";
import { getRecordDate } from "../models/utils";

export type MonthOptions = 6 | 12 | 24 | 60;

export type ChartPoint = {
  date: Date;
  value: number;
  lowerBound?: number;
  upperBound?: number;
};

export type PreparedData = {
  historicalPopulation: ChartPoint[];
  projectedPopulation: ChartPoint[];
  uncertainty: ChartPoint[];
};

export const prepareData = (
  metric:
    | PopulationProjectionOverTimeMetric
    | PopulationOverTimeMetric
    | ProjectionsMetrics,
  rawData: PopulationTimeSeriesRecord[] | PopulationProjectionTimeSeriesRecord[]
): PreparedData => {
  let historicalPopulation: ChartPoint[] = [];
  let projectedPopulation: ChartPoint[] = [];
  let uncertainty: ChartPoint[] = [];
  let data;

  if (
    metric instanceof PopulationProjectionOverTimeMetric ||
    metric instanceof ProjectionsMetrics
  ) {
    data = rawData as PopulationProjectionTimeSeriesRecord[];

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
        }))
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
  } else {
    data = rawData as PopulationTimeSeriesRecord[];
    historicalPopulation = data.map((d) => ({
      date: getRecordDate(d),
      value: d.totalPopulation,
    }));
  }

  return { historicalPopulation, projectedPopulation, uncertainty };
};

export const getDateRange = (
  firstDate: Date,
  lastDate: Date,
  monthRange: MonthOptions
): { beginDate: Date; endDate: Date } => {
  // set range slightly wider than data
  const beginDate = new Date(firstDate);
  const endDate = new Date(lastDate);

  let offset;
  switch (monthRange) {
    case 6:
      offset = 1;
      break;
    case 12:
      offset = 2;
      break;
    case 24:
      offset = 4;
      break;
    case 60:
      offset = 12;
      break;
    default:
      offset = 4;
  }

  beginDate.setDate(beginDate.getDate() - offset);
  endDate.setDate(endDate.getDate() + offset);

  if (!firstDate && !lastDate)
    return {
      beginDate: new Date(9999, 11, 31),
      endDate: new Date(9999, 11, 31),
    };

  return { beginDate, endDate };
};

export const formatMonthAndYear = (date: Date): string => {
  return formatDate(date, "MMM ''yy");
};

export const getChartTop = (plotLine: ChartPoint[]): number => {
  // Dynamically chose the top of the chart such that there should be a horizonal rule
  // at the very top for visual separation
  const maxValue = Math.max(...plotLine.map((d) => d.upperBound ?? d.value));

  let spacing;

  if (maxValue < 200) {
    spacing = 20;
  } else if (maxValue < 1000) {
    spacing = 100;
  } else if (maxValue < 2000) {
    spacing = 200;
  } else if (maxValue < 5000) {
    spacing = 500;
  } else if (maxValue < 10000) {
    spacing = 1000;
  } else {
    spacing = 2000;
  }

  return (Math.ceil(maxValue / spacing) + 1) * spacing;
};

export const getDateSpacing = (timeRange: MonthOptions): number => {
  if (timeRange <= 12) return 1;

  if (timeRange <= 24) return 2;

  return 4;
};

export const getTickValues = (
  population: ChartPoint[],
  dateSpacing: number
): Date[] => {
  return population
    .filter((_, index) => index % dateSpacing === 0)
    .map((r) => r.date);
};
