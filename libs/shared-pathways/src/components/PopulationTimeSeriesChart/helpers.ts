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

import { differenceInCalendarMonths, format } from "date-fns";

import type { MonthOptions } from "../../types";

export type ChartPoint = {
  date: Date;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  /**
   * Fill for this point's dot. A point carries its own color because the chart
   * frame styles dots one at a time, with no reference back to the line they
   * belong to. Left unset, the dot takes its fill from CSS.
   */
  color?: string;
};

export type PreparedData = {
  historicalPopulation: ChartPoint[];
  projectedPopulation: ChartPoint[];
  uncertainty: ChartPoint[];
};

export const getDateRange = (
  firstDate: Date,
  lastDate: Date,
): { beginDate: Date; endDate: Date } => {
  // set range slightly wider than data
  const beginDate = new Date(firstDate);
  const endDate = new Date(lastDate);

  const offset = (differenceInCalendarMonths(lastDate, firstDate) - 1) / 6;

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
  return format(date, "MMM ''yy");
};

const getAxisSpacing = (value: number): number => {
  let spacing;

  if (value < 200) {
    spacing = 20;
  } else if (value < 1000) {
    spacing = 100;
  } else if (value < 2000) {
    spacing = 200;
  } else if (value < 5000) {
    spacing = 500;
  } else if (value < 10000) {
    spacing = 1000;
  } else {
    spacing = 2000;
  }
  return spacing;
};

export const getChartTop = (plotLine: ChartPoint[]): number => {
  // Dynamically choose the top of the chart such that there should be a horizonal rule
  // at the very top for visual separation
  const maxValue = Math.max(...plotLine.map((d) => d.upperBound ?? d.value));
  const spacing = getAxisSpacing(maxValue);

  return (Math.ceil(maxValue / spacing) + 1) * spacing;
};

export const getChartBottom = (plotLine: ChartPoint[]): number => {
  // Dynamically choose the bottom of the Y axis based on the min value
  const minValue = Math.min(...plotLine.map((d) => d.lowerBound ?? d.value));
  const spacing = getAxisSpacing(minValue);

  return Math.max((Math.floor(minValue / spacing) - 1) * spacing, 0);
};

export const getDateSpacing = (timeRange: MonthOptions): number => {
  if (timeRange <= 12) return 1;

  if (timeRange <= 24) return 2;

  return 4;
};

export const getTickValues = (
  population: ChartPoint[],
  dateSpacing: number,
): Date[] => {
  return population
    .filter((_, index) => index % dateSpacing === 0)
    .map((r) => r.date);
};

/** One named line on an over-time chart, and how to draw it. */
export type TimeSeriesLine = {
  /** Label for this line in the chart legend. */
  name: string;
  data: ChartPoint[];
  /**
   * Stroke color. Omit to leave the line to the chart's own CSS, which is what
   * the single-population charts rely on.
   */
  color?: string;
};

/** A line as the underlying chart frame wants it. */
export type PlotLine = {
  data: ChartPoint[];
  class: string;
  name?: string;
  color?: string;
};

export const HISTORICAL_LINE_CLASS = "VizPathways__historicalLine";
export const PROJECTED_LINE_CLASS = "PopulationTimeSeriesChart__projectedLine";

/**
 * Returns the lines to draw, plus every point across them for axis and tick
 * math.
 *
 * A chart either names its own lines through `series` — which is how a chart
 * that compares two populations does it — or supplies one historical
 * population and an optional projection, which every single-population chart
 * does.
 */
export const resolveTimeSeriesLines = ({
  series,
  historicalPopulation,
  projectedPopulation,
}: {
  series?: TimeSeriesLine[];
  historicalPopulation: ChartPoint[];
  projectedPopulation?: ChartPoint[];
}): { lines: PlotLine[]; allPoints: ChartPoint[] } => {
  if (series?.length) {
    // Stamp each point with its line's color so the dots match the line.
    const coloredSeries = series.map(({ name, data, color }) => ({
      class: HISTORICAL_LINE_CLASS,
      name,
      color,
      data: color ? data.map((point) => ({ ...point, color })) : data,
    }));

    return {
      lines: coloredSeries,
      allPoints: coloredSeries.flatMap(({ data }) => data),
    };
  }

  const historicalLine = {
    class: HISTORICAL_LINE_CLASS,
    data: historicalPopulation,
  };

  if (!projectedPopulation) {
    return { lines: [historicalLine], allPoints: historicalPopulation };
  }

  return {
    lines: [
      historicalLine,
      { class: PROJECTED_LINE_CLASS, data: projectedPopulation },
    ],
    // The projection repeats the last historical point so the lines meet, so
    // drop it here to avoid counting that point twice.
    allPoints: historicalPopulation.concat(projectedPopulation.slice(1)),
  };
};
